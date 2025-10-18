#!/bin/bash

# SSL Certificate Setup Script for Bondnixs Website
# This script helps set up SSL certificates for nginx

set -e

SSL_DIR="./ssl"
DOMAIN="www.bondnixs.co.th"

echo "🔐 Setting up SSL certificates for $DOMAIN..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Check if certificates already exist
if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo "✅ SSL certificates already exist"
    echo "📋 Certificate details:"
    openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout | grep -E "(Subject:|Not Before|Not After)"
    exit 0
fi

echo "⚠️  SSL certificates not found. You have several options:"
echo ""
echo "1. 🔄 Use Let's Encrypt with Certbot (Recommended for production)"
echo "2. 🧪 Generate self-signed certificates (For development/testing)"
echo "3. 📁 Copy existing certificates to $SSL_DIR/"
echo ""

read -p "Choose option (1/2/3): " choice

case $choice in
    1)
        echo "🔧 Setting up Let's Encrypt certificates..."
        echo ""
        echo "📝 Prerequisites:"
        echo "   - Domain $DOMAIN must point to this server"
        echo "   - Ports 80 and 443 must be accessible"
        echo "   - Docker containers must be running"
        echo ""
        read -p "Continue with Let's Encrypt setup? (y/N): " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            # Install certbot if not available
            if ! command -v certbot &> /dev/null; then
                echo "📦 Installing certbot..."
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    brew install certbot
                elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                    sudo apt-get update && sudo apt-get install -y certbot
                else
                    echo "❌ Please install certbot manually for your OS"
                    exit 1
                fi
            fi
            
            # Stop nginx temporarily for certificate generation
            echo "🛑 Stopping nginx container..."
            docker-compose stop nginx
            
            # Generate certificate
            echo "🔐 Generating SSL certificate..."
            sudo certbot certonly --standalone -d "$DOMAIN" --email admin@bondnixs.co.th --agree-tos --non-interactive
            
            # Copy certificates to ssl directory
            echo "📋 Copying certificates..."
            sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
            sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
            sudo chown $(whoami):$(whoami) "$SSL_DIR"/*
            
            echo "✅ SSL certificates generated successfully!"
        fi
        ;;
    2)
        echo "🧪 Generating self-signed certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/privkey.pem" \
            -out "$SSL_DIR/fullchain.pem" \
            -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Bondnixs/OU=IT/CN=$DOMAIN"
        
        echo "✅ Self-signed certificates generated!"
        echo "⚠️  Note: Browsers will show security warnings for self-signed certificates"
        ;;
    3)
        echo "📁 Please copy your existing certificates to:"
        echo "   - $SSL_DIR/fullchain.pem"
        echo "   - $SSL_DIR/privkey.pem"
        echo ""
        echo "Press Enter when done..."
        read
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

# Verify certificates
if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo ""
    echo "✅ SSL setup completed successfully!"
    echo "📋 Certificate details:"
    openssl x509 -in "$SSL_DIR/fullchain.pem" -text -noout | grep -E "(Subject:|Not Before|Not After)"
    echo ""
    echo "🚀 You can now start your containers with:"
    echo "   docker-compose up -d"
else
    echo "❌ SSL setup failed. Please check the certificates."
    exit 1
fi
