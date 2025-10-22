const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const { sendContactNotification, sendContactConfirmation } = require('../services/emailService')
const { 
  contactRateLimit, 
  emailCooldownCheck, 
  trackSubmission, 
  honeypotValidation, 
  contentValidation 
} = require('../middleware/rateLimiting')

// Apply all rate limiting and validation middleware to contact form submission
router.post('/', 
  contactRateLimit,
  honeypotValidation,
  contentValidation,
  emailCooldownCheck,
  trackSubmission,
  async (req, res) => {
  try {
    const { name, email, company, phone, subject, message } = req.body

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, email, subject, message'
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // Save message to database
    const result = await pool.query(`
      INSERT INTO contact_messages (name, email, company, phone, subject, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, company, phone, subject, message, status, created_at
    `, [name, email, company || null, phone || null, subject, message, 'new'])

    const savedMessage = result.rows[0]

    // Get active recipients
    const recipientsResult = await pool.query(`
      SELECT id, name, email FROM email_recipients WHERE active = true
    `)

    const recipients = recipientsResult.rows

    if (recipients.length === 0) {
      console.warn('No active recipients found for contact notification')
    } else {
      try {
        // Send notification email to admin recipients
        await sendContactNotification(savedMessage, recipients)
        console.log('Contact notification email sent successfully')
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    try {
      // Send confirmation email to customer
      await sendContactConfirmation(savedMessage)
      console.log('Contact confirmation email sent successfully')
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.',
      data: {
        id: savedMessage.id,
        timestamp: savedMessage.created_at
      }
    })
  } catch (error) {
    console.error('Error processing contact form:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process your message. Please try again later.'
    })
  }
})

// Get all contact messages (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, company, phone, subject, message, status, created_at, updated_at
      FROM contact_messages
      ORDER BY created_at DESC
    `)
    
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching contact messages:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages'
    })
  }
})

// Get specific message (admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(`
      SELECT id, name, email, company, phone, subject, message, status, created_at, updated_at
      FROM contact_messages
      WHERE id = $1
    `, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error fetching contact message:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact message'
    })
  }
})

// Update message status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    // Validate status
    const validStatuses = ['new', 'read', 'archived']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: new, read, archived'
      })
    }
    
    const result = await pool.query(`
      UPDATE contact_messages 
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, name, email, company, phone, subject, message, status, created_at, updated_at
    `, [status, id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating message status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update message status'
    })
  }
})

// Delete message (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    })
  }
})

module.exports = router
