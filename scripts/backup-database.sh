#!/bin/bash

# Database Backup Script for BONDNIXS
# This script handles PostgreSQL database backups and restores

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESS="${COMPRESS:-true}"
ENVIRONMENT="${ENVIRONMENT:-development}"

# Database configuration
DB_NAME="${POSTGRES_DB:-bondnixs_db}"
DB_USER="${POSTGRES_USER:-bondnixs}"
DB_CONTAINER="postgres"

# Determine which docker-compose file to use
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to check if PostgreSQL container is running
check_postgres() {
    if ! docker compose -f "$COMPOSE_FILE" ps "$DB_CONTAINER" | grep -q "Up"; then
        error "PostgreSQL container is not running"
        error "Please start the database with: docker compose -f $COMPOSE_FILE up -d postgres"
        exit 1
    fi
}

# Function to create a backup
create_backup() {
    log "Starting database backup process..."
    
    check_postgres
    
    # Generate backup filename with timestamp
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    BACKUP_FILE="$BACKUP_DIR/bondnixs_db_${TIMESTAMP}.sql"
    
    if [ "$COMPRESS" = "true" ]; then
        BACKUP_FILE="${BACKUP_FILE}.gz"
        log "Creating compressed backup: $BACKUP_FILE"
        docker compose -f "$COMPOSE_FILE" exec -T "$DB_CONTAINER" \
            pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"
    else
        log "Creating backup: $BACKUP_FILE"
        docker compose -f "$COMPOSE_FILE" exec -T "$DB_CONTAINER" \
            pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"
    fi
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✅ Backup created successfully: $BACKUP_FILE (Size: $BACKUP_SIZE)"
        echo "$BACKUP_FILE"
    else
        error "❌ Failed to create backup"
        exit 1
    fi
}

# Function to list available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        warning "No backups found in $BACKUP_DIR"
        return
    fi
    
    # List backups with details
    for backup in "$BACKUP_DIR"/bondnixs_db_*.sql*; do
        if [ -f "$backup" ]; then
            filename=$(basename "$backup")
            size=$(du -h "$backup" | cut -f1)
            modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d'.' -f1)
            echo "  📦 $filename"
            echo "     Size: $size | Modified: $modified"
            echo ""
        fi
    done
}

# Function to restore from a backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "No backup file specified"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        # Try to find it in backup directory
        if [ -f "$BACKUP_DIR/$backup_file" ]; then
            backup_file="$BACKUP_DIR/$backup_file"
        else
            error "Backup file not found: $backup_file"
            exit 1
        fi
    fi
    
    log "Starting database restore process..."
    warning "⚠️  This will replace the current database with the backup!"
    warning "⚠️  Make sure you have a current backup before proceeding!"
    
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    check_postgres
    
    log "Restoring from: $backup_file"
    
    # Determine if backup is compressed
    if [[ "$backup_file" == *.gz ]]; then
        log "Decompressing and restoring backup..."
        gunzip -c "$backup_file" | docker compose -f "$COMPOSE_FILE" exec -T "$DB_CONTAINER" \
            psql -U "$DB_USER" -d "$DB_NAME"
    else
        log "Restoring backup..."
        docker compose -f "$COMPOSE_FILE" exec -T "$DB_CONTAINER" \
            psql -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log "✅ Database restored successfully from: $backup_file"
    else
        error "❌ Failed to restore database"
        exit 1
    fi
}

# Function to clean up old backups
cleanup_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        warning "Backup directory does not exist: $BACKUP_DIR"
        return
    fi
    
    # Find and delete old backups
    DELETED_COUNT=0
    while IFS= read -r -d '' backup; do
        if [ -f "$backup" ]; then
            rm -f "$backup"
            DELETED_COUNT=$((DELETED_COUNT + 1))
            log "Deleted old backup: $(basename "$backup")"
        fi
    done < <(find "$BACKUP_DIR" -name "bondnixs_db_*.sql*" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $DELETED_COUNT -eq 0 ]; then
        log "No old backups to clean up"
    else
        log "✅ Cleaned up $DELETED_COUNT old backup(s)"
    fi
}

# Function to show usage
show_usage() {
    echo "Database Backup Script for BONDNIXS"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a new database backup (default)"
    echo "  restore <file>      Restore database from a backup file"
    echo "  list                List all available backups"
    echo "  cleanup             Remove backups older than $RETENTION_DAYS days"
    echo "  help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR          Directory to store backups (default: ./backups)"
    echo "  RETENTION_DAYS      Number of days to keep backups (default: 30)"
    echo "  COMPRESS            Compress backups (default: true)"
    echo "  ENVIRONMENT         Environment: development or production (default: development)"
    echo "  POSTGRES_DB         Database name (default: bondnixs_db)"
    echo "  POSTGRES_USER       Database user (default: bondnixs)"
    echo ""
    echo "Examples:"
    echo "  $0 backup                              # Create a backup"
    echo "  $0 backup ENVIRONMENT=production       # Create a production backup"
    echo "  $0 list                                # List all backups"
    echo "  $0 restore bondnixs_db_20240101_120000.sql.gz  # Restore from backup"
    echo "  $0 cleanup                             # Clean up old backups"
}

# Main script logic
COMMAND="${1:-backup}"

case "$COMMAND" in
    backup)
        create_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_backups
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        error "Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac

