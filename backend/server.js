const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const path = require('path')

// Load environment-specific config
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development'

require('dotenv').config({ path: envFile })

// Import passport after environment variables are loaded
const passport = require('./config/passport')
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'BONDNIXS API Server',
    version: '1.0.0',
    status: 'running'
  })
})

// API Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/products', require('./routes/products'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/solutions', require('./routes/solutions'))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
