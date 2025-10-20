# BONDNIXS Website

A modern, responsive website for BONDNIXS with a comprehensive product catalog system and admin panel.

## Features

- **Public Website**: Modern, responsive design showcasing products and services
- **Product Catalog**: Dynamic product pages with features and specifications
- **Admin Panel**: Secure admin interface for managing products
- **Authentication**: Google OAuth integration for admin access
- **Image Upload**: Support for product images with multer
- **Database**: PostgreSQL with optimized queries and indexes

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- Passport.js for Google OAuth
- JWT for session management
- Multer for file uploads
- Docker containerization

### Frontend
- React with Vite
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Context API for state management

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bondnixs-website
   ```

2. **Set up environment variables**
   
   Create `backend/.env.development`:
   ```bash
   # Google OAuth (see oauth-setup.md for detailed instructions)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   
   # JWT Secret (use a strong, random key)
   JWT_SECRET=your_jwt_secret_key
   
   # Admin emails (comma-separated)
   ADMIN_EMAILS=admin@example.com
   
   # Database
   POSTGRES_HOST=postgres
   POSTGRES_PORT=5432
   POSTGRES_DB=bondnixs_dev
   POSTGRES_USER=bondnixs_dev
   POSTGRES_PASSWORD=devpassword123
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - **Via nginx proxy**: http://localhost (recommended for Docker)
     - Frontend: http://localhost/
     - API: http://localhost/api/
     - Admin Panel: http://localhost/admin/login
   - **Direct access** (if ports are exposed):
     - Frontend: http://localhost:5173
     - Backend API: http://localhost:3001

### Manual Setup (without Docker)

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb bondnixs_dev
   
   # Run the init script
   psql bondnixs_dev < backend/db/init.sql
   ```

3. **Start development servers**
   ```bash
   # Backend (in one terminal)
   cd backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## Admin Panel

### Accessing the Admin Panel

1. Navigate to `/admin/login`
2. Click "Sign in with Google"
3. Use a Google account that's listed in `ADMIN_EMAILS`

### Admin Features

- **Dashboard**: Overview of products and statistics
- **Product Management**: 
  - View all products (published and unpublished)
  - Add new products with images
  - Edit existing products
  - Delete products
  - Toggle publish status
- **Image Upload**: Support for PNG, JPG, WebP files up to 5MB

### Product Management

Each product can have:
- **Basic Info**: Model, name, short brief, description
- **Image**: Product photo with preview
- **Features**: Dynamic list of key features
- **Specifications**: Key-value pairs for technical specs
- **Publish Status**: Control visibility to public

## API Endpoints

### Public Endpoints
- `GET /api/products` - List all published products
- `GET /api/products/:model` - Get product by model

### Admin Endpoints (Protected)
- `GET /api/products/admin/all` - List all products (including unpublished)
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/publish` - Toggle publish status

### Auth Endpoints
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

## Database Schema

The `product` table includes:
- `id` (UUID, primary key)
- `model` (unique text)
- `name` (text)
- `short_brief` (text, optional)
- `description` (text, optional)
- `image_url` (text, optional)
- `features` (text array)
- `specs` (JSONB)
- `published` (boolean)
- `created_at`, `updated_at` (timestamps)

### Frontend Environment Variables

The frontend automatically detects the environment and uses the appropriate API URL:

- **Direct Development** (npm run dev): `http://localhost:3001`
- **Docker Development** (nginx proxy): `http://localhost/api` 
- **Production**: `https://api.bondnixs.com`

**Automatic Detection Logic:**
- If running on `localhost:80` or `localhost:443` → Uses nginx-proxied API (`http://localhost/api`)
- If running on `localhost:5173` → Uses direct backend API (`http://localhost:3001`)
- Otherwise → Uses production API

**Manual Override** (`.env.development`):
```bash
# Force specific API URL
VITE_API_BASE_URL=http://localhost/api
VITE_DEBUG=true
```

## Deployment

### Production Environment Variables
```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Security
JWT_SECRET=your_production_jwt_secret
ADMIN_EMAILS=admin@yourdomain.com

# Database
POSTGRES_HOST=your_production_db_host
POSTGRES_PORT=5432
POSTGRES_DB=bondnixs_prod
POSTGRES_USER=bondnixs_prod
POSTGRES_PASSWORD=your_production_password

# CORS
FRONTEND_URL=https://yourdomain.com
```

### Docker Production
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets for each environment
3. **Admin Emails**: Only whitelist trusted email addresses
4. **HTTPS**: Always use HTTPS in production
5. **File Uploads**: Images are validated and size-limited

## Troubleshooting

### Common Issues

1. **OAuth Errors**: Check Google Cloud Console configuration
2. **Database Connection**: Verify PostgreSQL is running and credentials are correct
3. **Image Upload**: Ensure uploads directory has proper permissions
4. **CORS Issues**: Verify FRONTEND_URL matches your frontend domain

### Development Tips

1. **Database Reset**: Use the init.sql script to reset the database
2. **Admin Access**: Add your email to ADMIN_EMAILS for testing
3. **Image Testing**: Use the admin panel to upload test images

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]