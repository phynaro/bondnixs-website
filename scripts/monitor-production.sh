#!/bin/bash

# BONDNIXS Production Monitoring Script
# This script monitors the health and performance of the production deployment

set -e

# Configuration
PROJECT_DIR="/opt/bondnixs-website"
DOMAIN="www.bondnixs.co.th"
LOG_FILE="/var/log/bondnixs-monitoring.log"
ALERT_EMAIL="admin@bondnixs.co.th"

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

# Send alert function
send_alert() {
    local message="$1"
    echo "$message" | mail -s "BONDNIXS Alert: $message" "$ALERT_EMAIL" 2>/dev/null || true
    error "$message"
}

log "Starting BONDNIXS production monitoring..."

cd "$PROJECT_DIR"

# Check Docker containers
log "Checking Docker containers..."
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    send_alert "Some Docker containers are not running"
    docker compose -f docker-compose.prod.yml ps
fi

# Check disk space
log "Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    send_alert "Disk usage is high: ${DISK_USAGE}%"
fi

# Check memory usage
log "Checking memory usage..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    send_alert "Memory usage is high: ${MEMORY_USAGE}%"
fi

# Check database connection
log "Checking database connection..."
if ! docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U bondnixs -d bondnixs_db > /dev/null 2>&1; then
    send_alert "Database connection failed"
fi

# Check backend health
log "Checking backend health..."
if ! curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    send_alert "Backend health check failed"
fi

# Check frontend
log "Checking frontend..."
if ! curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    send_alert "Frontend health check failed"
fi

# Check HTTPS endpoint
log "Checking HTTPS endpoint..."
if ! curl -f -s -I "https://$DOMAIN" > /dev/null 2>&1; then
    send_alert "HTTPS endpoint is not responding"
fi

# Check SSL certificate expiry
log "Checking SSL certificate expiry..."
CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
if [ -n "$CERT_EXPIRY" ]; then
    CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
        send_alert "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
    fi
fi

# Check log file sizes
log "Checking log file sizes..."
for log_file in /var/log/bondnixs-*.log; do
    if [ -f "$log_file" ]; then
        SIZE=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null)
        SIZE_MB=$((SIZE / 1024 / 1024))
        if [ "$SIZE_MB" -gt 100 ]; then
            warning "Log file $log_file is large: ${SIZE_MB}MB"
        fi
    fi
done

# Check for error patterns in logs
log "Checking for error patterns in logs..."
ERROR_COUNT=$(docker compose -f docker-compose.prod.yml logs --tail=1000 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
if [ "$ERROR_COUNT" -gt 10 ]; then
    warning "High number of errors in logs: $ERROR_COUNT"
fi

log "✅ Monitoring check completed successfully"

# Display system status
log "System Status Summary:"
echo "Disk Usage: ${DISK_USAGE}%"
echo "Memory Usage: ${MEMORY_USAGE}%"
echo "SSL Certificate Expires: $CERT_EXPIRY ($DAYS_UNTIL_EXPIRY days)"
echo "Recent Errors: $ERROR_COUNT"
