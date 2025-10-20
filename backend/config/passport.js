const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user email is in admin list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const userEmail = profile.emails[0].value

    if (!adminEmails.includes(userEmail)) {
      return done(null, false, { message: 'Access denied. Admin email required.' })
    }

    // Return user profile for JWT generation
    const user = {
      id: profile.id,
      email: userEmail,
      name: profile.displayName,
      picture: profile.photos[0]?.value
    }

    return done(null, user)
  } catch (error) {
    return done(error, null)
  }
}))

// Serialize user for session (we'll use JWT instead of sessions)
passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})


module.exports = passport
