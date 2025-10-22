const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get all recipients (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, active, created_at, updated_at
      FROM email_recipients
      ORDER BY created_at DESC
    `)
    
    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching recipients:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipients'
    })
  }
})

// Create new recipient (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
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
    
    // Check if email already exists
    const existingRecipient = await pool.query(
      'SELECT id FROM email_recipients WHERE email = $1',
      [email]
    )
    
    if (existingRecipient.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email address already exists'
      })
    }
    
    // Create recipient
    const result = await pool.query(`
      INSERT INTO email_recipients (name, email, active)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, active, created_at, updated_at
    `, [name, email, true])
    
    res.status(201).json({
      success: true,
      message: 'Recipient created successfully',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating recipient:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create recipient'
    })
  }
})

// Update recipient (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, email } = req.body
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
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
    
    // Check if email already exists for different recipient
    const existingRecipient = await pool.query(
      'SELECT id FROM email_recipients WHERE email = $1 AND id != $2',
      [email, id]
    )
    
    if (existingRecipient.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email address already exists'
      })
    }
    
    // Update recipient
    const result = await pool.query(`
      UPDATE email_recipients 
      SET name = $1, email = $2, updated_at = now()
      WHERE id = $3
      RETURNING id, name, email, active, created_at, updated_at
    `, [name, email, id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Recipient updated successfully',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating recipient:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update recipient'
    })
  }
})

// Delete recipient (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      'DELETE FROM email_recipients WHERE id = $1 RETURNING id',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Recipient deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting recipient:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipient'
    })
  }
})

// Toggle active status (admin only)
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(`
      UPDATE email_recipients 
      SET active = NOT active, updated_at = now()
      WHERE id = $1
      RETURNING id, name, email, active, created_at, updated_at
    `, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      })
    }
    
    res.json({
      success: true,
      message: `Recipient ${result.rows[0].active ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error toggling recipient status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update recipient status'
    })
  }
})

module.exports = router
