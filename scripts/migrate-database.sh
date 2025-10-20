#!/bin/bash

# Database Migration Script for BONDNIXS
# This script handles database schema migrations safely

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

# Configuration
MIGRATIONS_DIR="backend/db/migrations"
DATABASE_URL="postgresql://bondnixs:${POSTGRES_PASSWORD}@postgres:5432/bondnixs_db"

log "Starting database migration process..."

# Check if PostgreSQL container is running
if ! docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    error "PostgreSQL container is not running"
    exit 1
fi

# Create migrations table if it doesn't exist
log "Setting up migrations tracking table..."
docker compose -f docker-compose.prod.yml exec postgres psql -U bondnixs -d bondnixs_db -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT now()
);
"

# Get list of applied migrations
log "Checking applied migrations..."
APPLIED_MIGRATIONS=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U bondnixs -d bondnixs_db -t -c "SELECT migration_name FROM schema_migrations ORDER BY id;" 2>/dev/null | tr -d ' \n' || echo "")

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    warning "Migrations directory not found: $MIGRATIONS_DIR"
    log "Creating migrations directory..."
    mkdir -p "$MIGRATIONS_DIR"
fi

# Get list of migration files
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

if [ -z "$MIGRATION_FILES" ]; then
    log "No migration files found in $MIGRATIONS_DIR"
    log "Migration process completed (no migrations to apply)"
    exit 0
fi

# Process each migration file
MIGRATIONS_APPLIED=0
for migration_file in $MIGRATION_FILES; do
    migration_name=$(basename "$migration_file" .sql)
    
    # Check if migration was already applied
    if echo "$APPLIED_MIGRATIONS" | grep -q "$migration_name"; then
        log "Migration $migration_name already applied, skipping..."
        continue
    fi
    
    log "Applying migration: $migration_name"
    
    # Apply migration
    if docker compose -f docker-compose.prod.yml exec -T postgres psql -U bondnixs -d bondnixs_db < "$migration_file"; then
        # Record migration as applied
        docker compose -f docker-compose.prod.yml exec postgres psql -U bondnixs -d bondnixs_db -c "INSERT INTO schema_migrations (migration_name) VALUES ('$migration_name');"
        log "✅ Migration $migration_name applied successfully"
        MIGRATIONS_APPLIED=$((MIGRATIONS_APPLIED + 1))
    else
        error "❌ Failed to apply migration: $migration_name"
        exit 1
    fi
done

if [ $MIGRATIONS_APPLIED -eq 0 ]; then
    log "No new migrations to apply"
else
    log "✅ Applied $MIGRATIONS_APPLIED migration(s) successfully"
fi

log "Database migration process completed"
