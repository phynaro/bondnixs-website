#!/bin/bash

# SSH Setup Script for Bondnixs Production Server
# This script sets up SSH keys for Git access

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Setting up SSH keys for Git access..."

# Check if SSH key already exists
if [ -f ~/.ssh/id_ed25519 ]; then
    warning "SSH key already exists. Do you want to regenerate it? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -f ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
    else
        log "Using existing SSH key"
        cat ~/.ssh/id_ed25519.pub
        log "Please add this public key to your Git repository"
        exit 0
    fi
fi

# Generate SSH key
log "Generating SSH key..."
ssh-keygen -t ed25519 -C "server@bondnixs.co.th" -f ~/.ssh/id_ed25519 -N ""

# Start SSH agent and add key
log "Starting SSH agent..."
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Display public key
log "SSH key generated successfully!"
echo ""
echo "=========================================="
echo "Add this public key to your Git repository:"
echo "=========================================="
cat ~/.ssh/id_ed25519.pub
echo "=========================================="
echo ""

# Test GitHub connection
log "Testing GitHub connection..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    log "✅ GitHub connection successful!"
else
    warning "GitHub connection test failed. Please add the public key to GitHub first."
fi

# Test GitLab connection
log "Testing GitLab connection..."
if ssh -T git@gitlab.com 2>&1 | grep -q "successfully authenticated"; then
    log "✅ GitLab connection successful!"
else
    warning "GitLab connection test failed. Please add the public key to GitLab first."
fi

# Configure Git
log "Configuring Git..."
git config --global user.name "Bondnixs Server"
git config --global user.email "server@bondnixs.co.th"

log "✅ SSH setup completed!"
log "You can now clone repositories using SSH URLs"
