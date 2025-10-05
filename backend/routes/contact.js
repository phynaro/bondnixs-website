const express = require('express')
const router = express.Router()

// Mock contact submissions storage (in production, use a database)
let contactSubmissions = []

// Submit contact form
router.post('/', (req, res) => {
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

  // Create submission object
  const submission = {
    id: Date.now(),
    name,
    email,
    company: company || '',
    phone: phone || '',
    subject,
    message,
    timestamp: new Date().toISOString(),
    status: 'new'
  }

  // Store submission (in production, save to database)
  contactSubmissions.push(submission)

  // In production, you would:
  // 1. Save to database
  // 2. Send email notification
  // 3. Send auto-reply to customer
  // 4. Integrate with CRM system

  res.json({
    success: true,
    message: 'Thank you for your message. We will get back to you soon.',
    data: {
      id: submission.id,
      timestamp: submission.timestamp
    }
  })
})

// Get all contact submissions (admin endpoint)
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: contactSubmissions
  })
})

// Get specific submission (admin endpoint)
router.get('/:id', (req, res) => {
  const { id } = req.params
  const submission = contactSubmissions.find(s => s.id === parseInt(id))
  
  if (submission) {
    res.json({
      success: true,
      data: submission
    })
  } else {
    res.status(404).json({
      success: false,
      message: 'Submission not found'
    })
  }
})

// Update submission status (admin endpoint)
router.patch('/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  
  const submission = contactSubmissions.find(s => s.id === parseInt(id))
  
  if (submission) {
    submission.status = status
    submission.updatedAt = new Date().toISOString()
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: submission
    })
  } else {
    res.status(404).json({
      success: false,
      message: 'Submission not found'
    })
  }
})

module.exports = router
