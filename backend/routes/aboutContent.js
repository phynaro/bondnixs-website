const express = require('express')
const router = express.Router()
const { aboutContentQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { handleContentImageUpload, getContentImageUrl, deleteFile } = require('../middleware/upload')

// Public routes

// Get all published about content
router.get('/', async (req, res) => {
  try {
    const result = await aboutContentQueries.getAllContent()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching about content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch about content'
    })
  }
})

// Get content by section type (published only)
router.get('/type/:sectionType', async (req, res) => {
  try {
    const { sectionType } = req.params
    const result = await aboutContentQueries.getContentByType(sectionType)
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching about content by type:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch about content'
    })
  }
})

// Admin routes (protected)

// Get all content (including unpublished) - Admin only
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await aboutContentQueries.getAllContentAdmin()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching all about content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch about content'
    })
  }
})

// Create new content - Admin only
router.post('/', authenticateToken, requireAdmin, handleContentImageUpload, async (req, res) => {
  try {
    const { section_type, title, description, content, display_order, published } = req.body
    
    // Validate required fields
    if (!section_type) {
      return res.status(400).json({
        success: false,
        message: 'Section type is required'
      })
    }

    // Parse JSON content if provided
    let parsedContent = null
    if (content) {
      try {
        parsedContent = typeof content === 'string' ? JSON.parse(content) : content
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content format'
        })
      }
    }

    // Handle image upload
    let imageUrl = null
    if (req.file) {
      imageUrl = getContentImageUrl(req.file.filename)
    }

    const contentData = {
      section_type,
      title: title || null,
      description: description || null,
      image_url: imageUrl,
      content: parsedContent,
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await aboutContentQueries.createContent(contentData)
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'About content created successfully'
    })
  } catch (error) {
    console.error('Error creating about content:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create about content'
    })
  }
})

// Update content - Admin only
router.put('/:id', authenticateToken, requireAdmin, handleContentImageUpload, async (req, res) => {
  try {
    const { id } = req.params
    const { section_type, title, description, content, display_order, published } = req.body

    // Validate required fields
    if (!section_type) {
      return res.status(400).json({
        success: false,
        message: 'Section type is required'
      })
    }

    // Check if content exists
    const existingResult = await aboutContentQueries.getContentById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'About content not found'
      })
    }

    const existingContent = existingResult.rows[0]

    // Parse JSON content if provided
    let parsedContent = null
    if (content) {
      try {
        parsedContent = typeof content === 'string' ? JSON.parse(content) : content
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content format'
        })
      }
    }

    // Handle image upload
    let imageUrl = existingContent.image_url
    if (req.file) {
      // Delete old image if it exists
      if (existingContent.image_url) {
        const oldImagePath = existingContent.image_url.replace('/uploads/content/', '')
        deleteFile(require('path').join(__dirname, '../uploads/content', oldImagePath))
      }
      imageUrl = getContentImageUrl(req.file.filename)
    }

    const contentData = {
      section_type,
      title: title || null,
      description: description || null,
      image_url: imageUrl,
      content: parsedContent,
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await aboutContentQueries.updateContent(id, contentData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'About content updated successfully'
    })
  } catch (error) {
    console.error('Error updating about content:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update about content'
    })
  }
})

// Delete content - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if content exists
    const existingResult = await aboutContentQueries.getContentById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'About content not found'
      })
    }

    const existingContent = existingResult.rows[0]

    // Delete content from database
    await aboutContentQueries.deleteContent(id)

    // Delete associated image file if it exists
    if (existingContent.image_url) {
      const imagePath = existingContent.image_url.replace('/uploads/content/', '')
      deleteFile(require('path').join(__dirname, '../uploads/content', imagePath))
    }

    res.json({
      success: true,
      message: 'About content deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting about content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete about content'
    })
  }
})

// Toggle publish status - Admin only
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await aboutContentQueries.togglePublish(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'About content not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `About content ${result.rows[0].published ? 'published' : 'unpublished'} successfully`
    })
  } catch (error) {
    console.error('Error toggling publish status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update publish status'
    })
  }
})

module.exports = router

