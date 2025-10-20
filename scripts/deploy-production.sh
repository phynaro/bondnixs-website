#!/bin/bash

# BONDNIXS Production Deployment Script
# This script handles the complete production deployment process

set -e

# Configuration
PROJECT_DIR="/opt/bondnixs-website"
DOMAIN="www.bondnixs.co.th"
BACKUP_DIR="/opt/backups/bondnixs"
LOG_FILE="/var/log/bondnixs-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root"
    exit 1
fi

log "Starting BONDNIXS production deployment..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current deployment
log "Creating backup of current deployment..."
if [ -d "$PROJECT_DIR" ]; then
    BACKUP_NAME="bondnixs-backup-$(date +%Y%m%d-%H%M%S)"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$PROJECT_DIR" .
    log "Backup created: $BACKUP_NAME.tar.gz"
else
    warning "No existing deployment found to backup"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Pull latest changes
log "Pulling latest changes from repository..."
git pull origin main

# Check if .env file exists
if [ ! -f ".env" ]; then
    warning ".env file not found, creating from template..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
        warning "Please update .env file with production values before continuing"
        read -p "Press Enter after updating .env file..."
    else
        error ".env.production template not found"
        exit 1
    fi
fi

# Validate environment file
log "Validating environment configuration..."
if ! grep -q "POSTGRES_PASSWORD=" .env || ! grep -q "JWT_SECRET=" .env; then
    error "Required environment variables missing in .env file"
    exit 1
fi

# Stop current containers
log "Stopping current containers..."
docker compose -f docker-compose.prod.yml down

# Build and start new containers
log "Building and starting new containers..."
docker compose -f docker-compose.prod.yml up --build -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Health checks
log "Performing health checks..."

# Check if containers are running
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    error "Some containers failed to start"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

# Check database connection
if ! docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U bondnixs -d bondnixs_db > /dev/null 2>&1; then
    error "Database health check failed"
    exit 1
fi

# Check backend health using Docker health status
BACKEND_HEALTH=$(docker compose -f docker-compose.prod.yml ps backend --format "{{.Health}}")
if [[ "$BACKEND_HEALTH" != "healthy" ]]; then
    error "Backend health check failed - Status: $BACKEND_HEALTH"
    docker compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend using Docker health status
FRONTEND_HEALTH=$(docker compose -f docker-compose.prod.yml ps frontend --format "{{.Health}}")
if [[ "$FRONTEND_HEALTH" != "healthy" ]]; then
    error "Frontend health check failed - Status: $FRONTEND_HEALTH"
    docker compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

# Test HTTPS endpoint
if ! curl -f -s -I "https://$DOMAIN" | grep -q "200 OK"; then
    warning "HTTPS endpoint test failed - check SSL configuration"
else
    log "HTTPS endpoint test successful"
fi

# Clean up old Docker images
log "Cleaning up old Docker images..."
docker system prune -f

# Set up SSL certificate renewal cron job
log "Setting up SSL certificate renewal..."
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/bondnixs-website/cert-renewal.sh >> /var/log/certbot-renewal.log 2>&1") | crontab -

log "✅ Production deployment completed successfully!"
log "🌐 Website should be available at: https://$DOMAIN"
log "📊 Monitor logs with: docker compose -f docker-compose.prod.yml logs -f"

# Display service status
log "Current service status:"
docker compose -f docker-compose.prod.yml ps
