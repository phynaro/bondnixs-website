const express = require('express')
const { generateToken } = require('../middleware/auth')

const router = express.Router()

// Initialize Google OAuth login
router.get('/google', (req, res, next) => {
  const passport = require('../config/passport')
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next)
})

// Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  const passport = require('../config/passport')
  passport.authenticate('google', { failureRedirect: '/admin/login?error=auth_failed' })(req, res, next)
}, (req, res) => {
    try {
      // Generate JWT token
      const token = generateToken(req.user)
      
      // Set token in httpOnly cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })

      // Redirect to admin dashboard
      res.redirect('/admin')
    } catch (error) {
      console.error('Auth callback error:', error)
      res.redirect('/admin/login?error=token_generation_failed')
    }
  }
)

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('authToken')
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  })
})

// Get current user info
router.get('/me', (req, res) => {
  const token = req.cookies?.authToken
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authenticated' 
    })
  }

  try {
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    
    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      }
    })
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    })
  }
})

module.exports = router
