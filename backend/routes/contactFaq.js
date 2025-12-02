const express = require('express')
const router = express.Router()
const { contactFaqQueries } = require('../db/pool')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

// Public routes

// Get all published FAQs
router.get('/', async (req, res) => {
  try {
    const result = await contactFaqQueries.getFaqs()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs'
    })
  }
})

// Admin routes (protected)

// Get all FAQs (including unpublished) - Admin only
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await contactFaqQueries.getAllFaqsAdmin()
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching all FAQs:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs'
    })
  }
})

// Create new FAQ - Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { question, answer, display_order, published } = req.body
    
    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      })
    }

    const faqData = {
      question: question.trim(),
      answer: answer.trim(),
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await contactFaqQueries.createFaq(faqData)
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'FAQ created successfully'
    })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ'
    })
  }
})

// Update FAQ - Admin only
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { question, answer, display_order, published } = req.body

    // Validate required fields
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      })
    }

    // Check if FAQ exists
    const existingResult = await contactFaqQueries.getFaqById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      })
    }

    const faqData = {
      question: question.trim(),
      answer: answer.trim(),
      display_order: display_order || 0,
      published: published !== undefined ? published : true
    }

    const result = await contactFaqQueries.updateFaq(id, faqData)
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'FAQ updated successfully'
    })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ'
    })
  }
})

// Delete FAQ - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if FAQ exists
    const existingResult = await contactFaqQueries.getFaqById(id)
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      })
    }

    await contactFaqQueries.deleteFaq(id)

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ'
    })
  }
})

// Toggle publish status - Admin only
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await contactFaqQueries.togglePublish(id)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `FAQ ${result.rows[0].published ? 'published' : 'unpublished'} successfully`
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

