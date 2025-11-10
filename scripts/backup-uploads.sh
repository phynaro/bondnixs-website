#!/bin/bash

# Uploads Directory Backup Script for BONDNIXS
# This script handles backup and restore of the uploads directory

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
BACKUP_DIR="${BACKUP_DIR:-./backups/uploads}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESS="${COMPRESS:-true}"
ENVIRONMENT="${ENVIRONMENT:-development}"

# Uploads configuration
UPLOADS_SOURCE="${UPLOADS_SOURCE:-backend/uploads}"
BACKEND_CONTAINER="backend"

# Determine which docker-compose file to use
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to check if backend container is running
check_backend_container() {
    if docker compose -f "$COMPOSE_FILE" ps "$BACKEND_CONTAINER" | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Function to get uploads path (from container or local)
get_uploads_path() {
    if check_backend_container; then
        # Use container path
        echo "/app/uploads"
        return 0
    elif [ -d "$UPLOADS_SOURCE" ]; then
        # Use local path
        echo "$UPLOADS_SOURCE"
        return 0
    else
        error "Uploads directory not found and backend container is not running"
        error "Please ensure the backend container is running or the uploads directory exists at: $UPLOADS_SOURCE"
        return 1
    fi
}

# Function to create a backup
create_backup() {
    log "Starting uploads backup process..."
    
    # Determine source path
    SOURCE_PATH=$(get_uploads_path)
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    # Generate backup filename with timestamp
    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar"
    
    if [ "$COMPRESS" = "true" ]; then
        BACKUP_FILE="${BACKUP_FILE}.gz"
    fi
    
    log "Creating backup from: $SOURCE_PATH"
    
    # Check if source is empty
    if check_backend_container; then
        # Backup from Docker container
        FILE_COUNT=$(docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
            find /app/uploads -type f 2>/dev/null | wc -l | tr -d ' ')
        
        if [ "$FILE_COUNT" -eq 0 ]; then
            warning "Uploads directory appears to be empty"
        else
            info "Found $FILE_COUNT file(s) to backup"
        fi
        
        if [ "$COMPRESS" = "true" ]; then
            log "Creating compressed backup: $BACKUP_FILE"
            docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
                tar czf - -C /app/uploads . > "$BACKUP_FILE"
        else
            log "Creating backup: $BACKUP_FILE"
            docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
                tar cf - -C /app/uploads . > "$BACKUP_FILE"
        fi
    else
        # Backup from local filesystem
        FILE_COUNT=$(find "$SOURCE_PATH" -type f 2>/dev/null | wc -l | tr -d ' ')
        
        if [ "$FILE_COUNT" -eq 0 ]; then
            warning "Uploads directory appears to be empty"
        else
            info "Found $FILE_COUNT file(s) to backup"
        fi
        
        if [ "$COMPRESS" = "true" ]; then
            log "Creating compressed backup: $BACKUP_FILE"
            tar czf "$BACKUP_FILE" -C "$SOURCE_PATH" .
        else
            log "Creating backup: $BACKUP_FILE"
            tar cf "$BACKUP_FILE" -C "$SOURCE_PATH" .
        fi
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
    log "Available uploads backups in $BACKUP_DIR:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        warning "No backups found in $BACKUP_DIR"
        return
    fi
    
    # List backups with details
    for backup in "$BACKUP_DIR"/uploads_*.tar*; do
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
    
    log "Starting uploads restore process..."
    warning "⚠️  This will replace the current uploads directory with the backup!"
    warning "⚠️  Make sure you have a current backup before proceeding!"
    
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Determine target path
    TARGET_PATH=$(get_uploads_path)
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    log "Restoring from: $backup_file"
    log "Target path: $TARGET_PATH"
    
    # Determine if backup is compressed
    if check_backend_container; then
        # Restore to Docker container
        # Use a more reliable method: copy file to container, extract, then remove
        # Use /app/tmp to ensure the container user has write permissions
        TEMP_BACKUP="/app/tmp/restore_backup_$(basename "$backup_file")"
        
        log "Copying backup file to container..."
        # Create temp directory if it doesn't exist
        docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
            mkdir -p /app/tmp
        
        docker compose -f "$COMPOSE_FILE" cp "$backup_file" "$BACKEND_CONTAINER:$TEMP_BACKUP"
        
        if [[ "$backup_file" == *.gz ]]; then
            log "Decompressing and extracting backup in container..."
            docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
                sh -c "cd /app/uploads && tar xzf $TEMP_BACKUP && rm -f $TEMP_BACKUP"
        else
            log "Extracting backup in container..."
            docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
                sh -c "cd /app/uploads && tar xf $TEMP_BACKUP && rm -f $TEMP_BACKUP"
        fi
        
        # Fix permissions in container
        log "Fixing file permissions..."
        docker compose -f "$COMPOSE_FILE" exec -T "$BACKEND_CONTAINER" \
            chown -R $(id -u):$(id -g) /app/uploads 2>/dev/null || true
    else
        # Restore to local filesystem
        if [ ! -d "$TARGET_PATH" ]; then
            log "Creating target directory: $TARGET_PATH"
            mkdir -p "$TARGET_PATH"
        fi
        
        # Clear existing files (optional - ask user)
        if [ "$(ls -A $TARGET_PATH 2>/dev/null)" ]; then
            read -p "Clear existing files in $TARGET_PATH before restore? (yes/no): " clear_existing
            if [ "$clear_existing" = "yes" ]; then
                log "Clearing existing files..."
                rm -rf "$TARGET_PATH"/*
            fi
        fi
        
        if [[ "$backup_file" == *.gz ]]; then
            log "Decompressing and restoring backup..."
            tar xzf "$backup_file" -C "$TARGET_PATH"
        else
            log "Restoring backup..."
            tar xf "$backup_file" -C "$TARGET_PATH"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        log "✅ Uploads restored successfully from: $backup_file"
    else
        error "❌ Failed to restore uploads"
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
    done < <(find "$BACKUP_DIR" -name "uploads_*.tar*" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $DELETED_COUNT -eq 0 ]; then
        log "No old backups to clean up"
    else
        log "✅ Cleaned up $DELETED_COUNT old backup(s)"
    fi
}

# Function to show usage
show_usage() {
    echo "Uploads Directory Backup Script for BONDNIXS"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a new uploads backup (default)"
    echo "  restore <file>      Restore uploads from a backup file"
    echo "  list                List all available backups"
    echo "  cleanup             Remove backups older than $RETENTION_DAYS days"
    echo "  help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR          Directory to store backups (default: ./backups/uploads)"
    echo "  RETENTION_DAYS      Number of days to keep backups (default: 30)"
    echo "  COMPRESS            Compress backups (default: true)"
    echo "  ENVIRONMENT         Environment: development or production (default: development)"
    echo "  UPLOADS_SOURCE      Local uploads directory path (default: backend/uploads)"
    echo ""
    echo "Examples:"
    echo "  $0 backup                              # Create a backup"
    echo "  $0 backup ENVIRONMENT=production       # Create a production backup"
    echo "  $0 list                                # List all backups"
    echo "  $0 restore uploads_20240101_120000.tar.gz  # Restore from backup"
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

