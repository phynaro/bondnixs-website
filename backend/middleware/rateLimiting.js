const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const pool = require('../db/pool')

const MINUTE_IN_MS = 60 * 1000

const normalizeEmail = (email = '') => email.trim().toLowerCase()
const hashKey = (value) => crypto.createHash('sha256').update(value).digest('hex')

const minutesUntilReset = (req, windowMs) => {
  const resetTime = req.rateLimit?.resetTime

  if (resetTime instanceof Date) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / MINUTE_IN_MS))
  }

  if (typeof resetTime === 'number') {
    return Math.max(1, Math.ceil((resetTime - Date.now()) / MINUTE_IN_MS))
  }

  return Math.max(1, Math.ceil(windowMs / MINUTE_IN_MS))
}

const respondWith429 = (req, res, options, { message, code }) => {
  const retryAfter = minutesUntilReset(req, options.windowMs)

  res.status(options.statusCode || 429).json({
    success: false,
    message,
    code,
    retryAfter
  })
}

setInterval(async () => {
  try {
    await pool.query('SELECT cleanup_old_tracking_records()')
  } catch (error) {
    console.error('Error cleaning up old tracking records:', error)
  }
}, 60 * MINUTE_IN_MS)

/**
 * Rate limiting middleware for contact form submissions
 */
const contactRateLimit = rateLimit({
  windowMs: 15 * MINUTE_IN_MS,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    respondWith429(req, res, options, {
      message: 'Too many contact form submissions. Please wait a little before trying again.',
      code: 'RATE_LIMIT_EXCEEDED'
    })
  }
})

/**
 * Email-based cooldown protection
 * Prevents the same email from submitting multiple times within a cooldown period
 */
const emailCooldownCheck = rateLimit({
  windowMs: 1 * MINUTE_IN_MS,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.body?.email,
  keyGenerator: (req) => hashKey(`email:${normalizeEmail(req.body.email)}`),
  handler: (req, res, next, options) => {
    respondWith429(req, res, options, {
      message: 'Please wait a few more minutes before submitting another message from this email address.',
      code: 'EMAIL_COOLDOWN_ACTIVE'
    })
  }
})

/**
 * Enhanced submission tracking with database persistence
 * Tracks submissions per IP and email for additional protection
 */
const trackSubmission = async (req, res, next) => {
  const { email } = req.body
  const ip = req.ip || req.connection.remoteAddress
  const userAgent = req.get('User-Agent') || ''
  const now = new Date()
  const normalizedEmail = email ? normalizeEmail(email) : null

  try {
    const updateResult = await pool.query(`
      UPDATE contact_submissions_tracking
      SET submission_count = submission_count + 1,
          last_submission = $3,
          updated_at = NOW(),
          user_agent = $4
      WHERE ip_address = $1
        AND ((email IS NULL AND $2::text IS NULL) OR email = $2)
      RETURNING submission_count
    `, [ip, normalizedEmail, now, userAgent.slice(0, 500)])

    let submissionCount = updateResult.rows[0]?.submission_count

    if (!submissionCount) {
      const insertResult = await pool.query(`
        INSERT INTO contact_submissions_tracking (ip_address, email, user_agent, submission_count, first_submission, last_submission)
        VALUES ($1, $2, $3, 1, $4, $4)
        RETURNING submission_count
      `, [ip, normalizedEmail, userAgent.slice(0, 500), now])

      submissionCount = insertResult.rows[0].submission_count
    }

    if (submissionCount > 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many submissions detected. Please contact us directly if you need immediate assistance.',
        code: 'SUSPICIOUS_ACTIVITY'
      })
    }

    next()
  } catch (error) {
    console.error('Error tracking submission:', error)
    next()
  }
}

/**
 * Honeypot validation
 * Checks for bot submissions using hidden fields
 */
const honeypotValidation = (req, res, next) => {
  const { website, url, honeypot } = req.body
  
  // If any honeypot fields are filled, it's likely a bot
  if (website || url || honeypot) {
    return res.status(400).json({
      success: false,
      message: 'Invalid submission detected.',
      code: 'HONEYPOT_TRIGGERED'
    })
  }
  
  next()
}

/**
 * Content validation to prevent spam
 */
const contentValidation = (req, res, next) => {
  const { name, message, subject } = req.body
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /http[s]?:\/\/[^\s]+/gi, // URLs
    /[A-Z]{10,}/g, // Excessive caps
    /(.)\1{4,}/g, // Repeated characters
    /(.)\1{3,}/g, // Repeated characters (less strict)
  ]
  
  const textToCheck = `${name} ${message} ${subject}`.toLowerCase()
  
  // Check for URLs (not allowed in contact form)
  if (suspiciousPatterns[0].test(textToCheck)) {
    return res.status(400).json({
      success: false,
      message: 'URLs are not allowed in contact form submissions.',
      code: 'URL_DETECTED'
    })
  }
  
  // Check for excessive caps
  if (suspiciousPatterns[1].test(textToCheck)) {
    return res.status(400).json({
      success: false,
      message: 'Please avoid excessive use of capital letters.',
      code: 'EXCESSIVE_CAPS'
    })
  }
  
  // Check for repeated characters
  if (suspiciousPatterns[2].test(textToCheck)) {
    return res.status(400).json({
      success: false,
      message: 'Please avoid repeated characters in your message.',
      code: 'REPEATED_CHARS'
    })
  }
  
  // Check message length (prevent extremely long messages)
  if (message && message.length > 5000) {
    return res.status(400).json({
      success: false,
      message: 'Message is too long. Please keep it under 5000 characters.',
      code: 'MESSAGE_TOO_LONG'
    })
  }
  
  next()
}

module.exports = {
  contactRateLimit,
  emailCooldownCheck,
  trackSubmission,
  honeypotValidation,
  contentValidation
}
