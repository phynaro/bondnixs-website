# Google OAuth Setup Instructions

This guide will help you set up Google OAuth authentication for the BONDNIXS admin panel.

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required fields:
   - App name: `BONDNIXS Admin Panel`
   - User support email: Your email
   - Developer contact information: Your email
4. Add your domain to "Authorized domains" (e.g., `bondnixs.com`)
5. Save and continue through the scopes (you can use the default)

## Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Configure the OAuth client:
   - Name: `BONDNIXS Admin Panel`
   - Authorized JavaScript origins:
     - `http://localhost:3001` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Create or update your `.env.development` file in the backend directory:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Admin Email Whitelist (comma-separated)
ADMIN_EMAILS=admin@yourdomain.com,another@yourdomain.com

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=bondnixs_dev
POSTGRES_USER=bondnixs_dev
POSTGRES_PASSWORD=devpassword123

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

For production, create a `.env.production` file with production values:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# JWT Configuration
JWT_SECRET=your_production_jwt_secret_key

# Admin Email Whitelist
ADMIN_EMAILS=admin@yourdomain.com

# Database Configuration
POSTGRES_HOST=your_production_db_host
POSTGRES_PORT=5432
POSTGRES_DB=bondnixs_prod
POSTGRES_USER=bondnixs_prod
POSTGRES_PASSWORD=your_production_db_password

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

## Step 5: Security Considerations

1. **JWT Secret**: Use a strong, random secret key for JWT signing
2. **Admin Emails**: Only add trusted email addresses to the ADMIN_EMAILS list
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit `.env` files to version control

## Step 6: Testing

1. Start your development server
2. Navigate to `http://localhost:3001/api/auth/google`
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you should be redirected to the admin dashboard

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: Check that your redirect URI exactly matches what's configured in Google Cloud Console
2. **"access_denied"**: Make sure the user's email is in the ADMIN_EMAILS list
3. **"invalid_client"**: Verify your Client ID and Client Secret are correct

### Development vs Production:

- Use separate OAuth client IDs for development and production
- Update redirect URIs for each environment
- Use different JWT secrets for each environment

## Production Deployment

When deploying to production:

1. Update Google Cloud Console with production URLs
2. Set environment variables in your production environment
3. Ensure HTTPS is enabled
4. Test the OAuth flow in production

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
