const express = require('express')
const router = express.Router()
const { solutionsContentQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { handleContentImageUpload, getContentImageUrl, deleteFile } = require('../middleware/upload')

// Public routes

// Get all published solutions content
router.get('/', async (req, res) => {
  try {
    const result = await solutionsContentQueries.getAllContent()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching solutions content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch solutions content'
    })
  }
})

// Get content by type (published only)
router.get('/type/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params
    const result = await solutionsContentQueries.getContentByType(contentType)
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching solutions content by type:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch solutions content'
    })
  }
})

// Admin routes (protected)

// Get all content (including unpublished) - Admin only
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await solutionsContentQueries.getAllContentAdmin()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching all solutions content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch solutions content'
    })
  }
})

// Create new content - Admin only
router.post('/', authenticateToken, requireAdmin, handleContentImageUpload, async (req, res) => {
  try {
    const { content_type, title, description, content, display_order, published } = req.body
    
    // Validate required fields
    if (!content_type) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required'
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
      content_type,
      title: title || null,
      description: description || null,
      image_url: imageUrl,
      content: parsedContent,
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await solutionsContentQueries.createContent(contentData)
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Solutions content created successfully'
    })
  } catch (error) {
    console.error('Error creating solutions content:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create solutions content'
    })
  }
})

// Update content - Admin only
router.put('/:id', authenticateToken, requireAdmin, handleContentImageUpload, async (req, res) => {
  try {
    const { id } = req.params
    const { content_type, title, description, content, display_order, published } = req.body

    // Validate required fields
    if (!content_type) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required'
      })
    }

    // Check if content exists
    const existingResult = await solutionsContentQueries.getContentById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solutions content not found'
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
      content_type,
      title: title || null,
      description: description || null,
      image_url: imageUrl,
      content: parsedContent,
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await solutionsContentQueries.updateContent(id, contentData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Solutions content updated successfully'
    })
  } catch (error) {
    console.error('Error updating solutions content:', error)
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      deleteFile(req.file.path)
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update solutions content'
    })
  }
})

// Delete content - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if content exists
    const existingResult = await solutionsContentQueries.getContentById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solutions content not found'
      })
    }

    const existingContent = existingResult.rows[0]

    // Delete content from database
    await solutionsContentQueries.deleteContent(id)

    // Delete associated image file if it exists
    if (existingContent.image_url) {
      const imagePath = existingContent.image_url.replace('/uploads/content/', '')
      deleteFile(require('path').join(__dirname, '../uploads/content', imagePath))
    }

    res.json({
      success: true,
      message: 'Solutions content deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting solutions content:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete solutions content'
    })
  }
})

// Toggle publish status - Admin only
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await solutionsContentQueries.togglePublish(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solutions content not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Solutions content ${result.rows[0].published ? 'published' : 'unpublished'} successfully`
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

