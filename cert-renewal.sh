#!/bin/bash

# BONDNIXS Website SSL Certificate Renewal Script
# This script renews Let's Encrypt certificates and updates local copies

set -e

# Configuration
PROJECT_DIR="/opt/bondnixs-website"
DOMAIN="bondnixs.co.th"
SSL_DIR="$PROJECT_DIR/ssl"
LOG_FILE="/var/log/certbot-renewal.log"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting certificate renewal process..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log "ERROR: This script must be run as root"
    exit 1
fi

# Stop nginx container to free up port 80
log "Stopping nginx container..."
cd "$PROJECT_DIR"
docker compose stop nginx

# Renew certificates
log "Renewing certificates for $DOMAIN..."
if certbot renew --standalone --quiet; then
    log "Certificate renewal successful"
    
    # Copy certificates to local directory
    log "Copying certificates to local directory..."
    mkdir -p "$SSL_DIR"
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
    
    # Set proper permissions
    chown -R 1000:1000 "$SSL_DIR"
    chmod 644 "$SSL_DIR/fullchain.pem"
    chmod 600 "$SSL_DIR/privkey.pem"
    
    log "Certificates copied successfully"
    
    # Restart nginx container
    log "Restarting nginx container..."
    docker compose up -d nginx
    
    # Wait a moment for nginx to start
    sleep 5
    
    # Test if nginx is running
    if docker compose ps nginx | grep -q "Up"; then
        log "Nginx restarted successfully"
        
        # Test HTTPS connection
        if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
            log "HTTPS connection test successful"
        else
            log "WARNING: HTTPS connection test failed"
        fi
    else
        log "ERROR: Failed to restart nginx"
        exit 1
    fi
    
else
    log "ERROR: Certificate renewal failed"
    
    # Restart nginx anyway
    log "Restarting nginx container..."
    docker-compose up -d nginx
    exit 1
fi

log "Certificate renewal process completed successfully"
