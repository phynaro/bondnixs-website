const jwt = require('jsonwebtoken')

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Middleware to verify JWT token from cookie
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.authToken

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    })
  }

  req.user = decoded
  next()
}

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    })
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  const userEmail = req.user.email

  if (!adminEmails.includes(userEmail)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    })
  }

  next()
}

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.authToken

  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      req.user = decoded
    }
  }

  next()
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  optionalAuth
}
