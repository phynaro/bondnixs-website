# BONDNIXS Website

A modern, responsive website for BONDNIXS CO., LTD. - a specialized engineering and distribution company focusing on desktop robot and dispensing solutions.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS v3
- **Routing**: React Router
- **Deployment**: Docker + Nginx

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Deployment**: Docker

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (Reverse Proxy)
- **Monitoring**: Grafana + Prometheus + cAdvisor
- **Deployment**: GitHub Actions
- **Host**: Ubuntu 24
- **DNS**: Cloudflare

## 📁 Project Structure

```
bondnixs-website/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   └── App.jsx          # Main app component
│   ├── Dockerfile           # Frontend container config
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── routes/              # API route handlers
│   ├── server.js            # Express server
│   ├── Dockerfile           # Backend container config
│   └── package.json
├── docker-compose.yml       # Multi-container setup
├── nginx.conf              # Nginx configuration
└── README.md
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/phynaro/bondnixs-website.git
   cd bondnixs-website
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/health

### Manual Development Setup

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

#### Backend Development
```bash
cd backend
npm install
npm run dev
```

## 🌐 Domains

- **Development**: bondnixs.trazor.cloud
- **Production**: bondixs.co.th

## 📋 Features

### Core Pages
- **Home**: Landing page with company overview and key features
- **About**: Company story, values, and expertise
- **Products**: Comprehensive product catalog
- **Solutions**: Industry-specific solutions and case studies
- **Contact**: Contact form and company information

### Key Features
- Responsive design (mobile-first)
- Modern UI with TailwindCSS
- Fast loading with Vite
- SEO optimized
- Contact form with validation
- Product catalog with categories
- Industry solutions showcase
- Case studies and testimonials

## 🔧 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:category` - Get products by category
- `GET /api/products/:category/:id` - Get specific product

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all submissions (admin)
- `GET /api/contact/:id` - Get specific submission

### Solutions
- `GET /api/solutions` - Get all solutions
- `GET /api/solutions/:id` - Get specific solution
- `GET /api/solutions/industry/:industry` - Get solutions by industry
- `GET /api/solutions/case-studies` - Get case studies

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up --build
```

### Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Deployment

### GitHub Actions
The project uses GitHub Actions for automated deployment:

1. **Development**: Auto-deploy to bondnixs.trazor.cloud
2. **Production**: Manual deployment to bondixs.co.th

### Manual Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔒 Environment Variables

### Frontend
- `VITE_API_URL` - Backend API URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

### Backend
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

## 📊 Monitoring

### Grafana Dashboard
- Access: http://localhost:3001
- Default credentials: admin/admin

### Metrics
- Application performance
- Container resource usage
- Database performance
- API response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For technical support or questions:
- **Email**: Hathaipat.w@bondnixs.co.th
- **Phone**: +66 92 549 5845

## 📄 License

This project is proprietary to BONDNIXS CO., LTD.

---

**BONDNIXS CO., LTD.**  
88/55 Centro Village, Moo 11, Soi Kingkaew 37, Kingkaew Road,  
Racha Thewa, Bang Phli, Samut Prakan 10540, Thailand
