const express = require('express')
const router = express.Router()
const { homeContentQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { handleContentImageUpload, getContentImageUrl, deleteFile } = require('../middleware/upload')

// Public routes

// Get all published home content
router.get('/', async (req, res) => {
  try {
    const result = await homeContentQueries.getAllContent()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching home content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content'
    })
  }
})

// Get content by section type (published only)
router.get('/type/:sectionType', async (req, res) => {
  try {
    const { sectionType } = req.params
    const result = await homeContentQueries.getContentByType(sectionType)
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching home content by type:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content'
    })
  }
})

// Admin routes (protected)

// Get all content (including unpublished) - Admin only
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await homeContentQueries.getAllContentAdmin()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching all home content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content'
    })
  }
})

// Create new content - Admin only
router.post('/', authenticateToken, requireAdmin, handleContentImageUpload, async (req, res) => {
  try {
    // Ensure req.body exists (multer should populate it, but add safety check)
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing'
      })
    }
    
    const { section_type, title, subtitle, description, content, display_order, published } = req.body
    
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
      subtitle: subtitle || null,
      description: description || null,
      image_url: imageUrl,
      content: parsedContent,
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await homeContentQueries.createContent(contentData)
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Home content created successfully'
    })
  } catch (error) {
    console.error('Error creating home content:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create home content'
    })
  }
})

// Update content - Admin only
router.put('/:id', authenticateToken, requireAdmin, handleContentImageUpload, async (req, res) => {
  try {
    const { id } = req.params
    
    // Ensure req.body exists (multer should populate it, but add safety check)
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing'
      })
    }
    
    const { section_type, title, subtitle, description, content, display_order, published } = req.body

    // Validate required fields
    if (!section_type) {
      return res.status(400).json({
        success: false,
        message: 'Section type is required'
      })
    }

    // Check if content exists
    const existingResult = await homeContentQueries.getContentById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
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
      subtitle: subtitle || null,
      description: description || null,
      image_url: imageUrl,
      content: parsedContent,
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await homeContentQueries.updateContent(id, contentData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Home content updated successfully'
    })
  } catch (error) {
    console.error('Error updating home content:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update home content'
    })
  }
})

// Delete content - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if content exists
    const existingResult = await homeContentQueries.getContentById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      })
    }

    const existingContent = existingResult.rows[0]

    // Delete content from database
    await homeContentQueries.deleteContent(id)

    // Delete associated image file if it exists
    if (existingContent.image_url) {
      const imagePath = existingContent.image_url.replace('/uploads/content/', '')
      deleteFile(require('path').join(__dirname, '../uploads/content', imagePath))
    }

    res.json({
      success: true,
      message: 'Home content deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting home content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete home content'
    })
  }
})

// Toggle publish status - Admin only
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await homeContentQueries.togglePublish(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Home content ${result.rows[0].published ? 'published' : 'unpublished'} successfully`
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

