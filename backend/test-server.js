const express = require('express')

// Load environment-specific config
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development'

require('dotenv').config({ path: envFile })

const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(express.json())

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'BONDNIXS API Server',
    version: '1.0.0',
    status: 'running',
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
    }
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
