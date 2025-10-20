#!/bin/bash

# Migration Management Utility for BONDNIXS
# This script provides commands to manage database migrations

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
MIGRATIONS_DIR="backend/db/migrations"

show_help() {
    echo "Migration Management Utility"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status     - Show migration status"
    echo "  list       - List all migration files"
    echo "  pending    - Show pending migrations"
    echo "  applied    - Show applied migrations"
    echo "  create     - Create new migration file"
    echo "  run        - Run pending migrations"
    echo "  help       - Show this help"
    echo ""
}

show_status() {
    log "Migration Status Report"
    echo ""
    
    # Check if PostgreSQL is running
    if ! docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        error "PostgreSQL container is not running"
        exit 1
    fi
    
    # Get applied migrations
    APPLIED_MIGRATIONS=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U bondnixs -d bondnixs_db -t -c "SELECT migration_name FROM schema_migrations ORDER BY applied_at;" 2>/dev/null | tr -d ' \n' || echo "")
    
    # Get all migration files
    ALL_MIGRATIONS=$(find "$MIGRATIONS_DIR" -name "*.sql" 2>/dev/null | sort | xargs -I {} basename {} .sql || echo "")
    
    if [ -z "$ALL_MIGRATIONS" ]; then
        warning "No migration files found in $MIGRATIONS_DIR"
        return
    fi
    
    echo "📊 Migration Summary:"
    echo "===================="
    
    APPLIED_COUNT=0
    PENDING_COUNT=0
    
    for migration in $ALL_MIGRATIONS; do
        if echo "$APPLIED_MIGRATIONS" | grep -q "$migration"; then
            echo "✅ $migration (applied)"
            APPLIED_COUNT=$((APPLIED_COUNT + 1))
        else
            echo "⏳ $migration (pending)"
            PENDING_COUNT=$((PENDING_COUNT + 1))
        fi
    done
    
    echo ""
    echo "📈 Statistics:"
    echo "  Applied: $APPLIED_COUNT"
    echo "  Pending: $PENDING_COUNT"
    echo "  Total: $((APPLIED_COUNT + PENDING_COUNT))"
}

list_migrations() {
    log "All Migration Files:"
    echo ""
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        warning "Migrations directory not found: $MIGRATIONS_DIR"
        return
    fi
    
    find "$MIGRATIONS_DIR" -name "*.sql" | sort | while read -r file; do
        filename=$(basename "$file")
        size=$(wc -c < "$file")
        lines=$(wc -l < "$file")
        echo "📄 $filename ($size bytes, $lines lines)"
    done
}

show_pending() {
    log "Pending Migrations:"
    echo ""
    
    # Get applied migrations
    APPLIED_MIGRATIONS=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U bondnixs -d bondnixs_db -t -c "SELECT migration_name FROM schema_migrations ORDER BY applied_at;" 2>/dev/null | tr -d ' \n' || echo "")
    
    # Get all migration files
    find "$MIGRATIONS_DIR" -name "*.sql" | sort | while read -r file; do
        migration_name=$(basename "$file" .sql)
        if ! echo "$APPLIED_MIGRATIONS" | grep -q "$migration_name"; then
            echo "⏳ $migration_name"
        fi
    done
}

show_applied() {
    log "Applied Migrations:"
    echo ""
    
    docker compose -f docker-compose.prod.yml exec postgres psql -U bondnixs -d bondnixs_db -c "SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at;" 2>/dev/null || echo "No migrations applied yet"
}

create_migration() {
    if [ -z "$1" ]; then
        error "Please provide a description for the migration"
        echo "Usage: $0 create 'description of migration'"
        exit 1
    fi
    
    # Create migrations directory if it doesn't exist
    mkdir -p "$MIGRATIONS_DIR"
    
    # Generate timestamp
    TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
    DESCRIPTION=$(echo "$1" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
    FILENAME="${TIMESTAMP}_${DESCRIPTION}.sql"
    FILEPATH="$MIGRATIONS_DIR/$FILENAME"
    
    # Create migration file
    cat > "$FILEPATH" << EOF
-- Migration: $TIMESTAMP
-- Description: $1

-- UP Migration (applying the change)
BEGIN;

-- Your schema changes here
-- Example:
-- CREATE TABLE new_table (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT now()
-- );

COMMIT;

-- DOWN Migration (reverting the change) - Optional
/*
BEGIN;
DROP TABLE IF EXISTS new_table CASCADE;
COMMIT;
*/
EOF

    log "Created migration file: $FILEPATH"
    info "Edit the file to add your schema changes"
}

run_migrations() {
    log "Running pending migrations..."
    if [ -f "scripts/migrate-database.sh" ]; then
        ./scripts/migrate-database.sh
    else
        error "Migration script not found: scripts/migrate-database.sh"
        exit 1
    fi
}

# Main command handling
case "${1:-help}" in
    "status")
        show_status
        ;;
    "list")
        list_migrations
        ;;
    "pending")
        show_pending
        ;;
    "applied")
        show_applied
        ;;
    "create")
        create_migration "$2"
        ;;
    "run")
        run_migrations
        ;;
    "help"|*)
        show_help
        ;;
esac
