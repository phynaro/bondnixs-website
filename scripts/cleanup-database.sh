#!/bin/bash

# Database Cleanup Script for BONDNIXS
# This script drops all tables and data from the database

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

log "Starting database cleanup..."

# Check if containers are running
if ! docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    error "PostgreSQL container is not running"
    exit 1
fi

# Confirm deletion
warning "This will delete ALL data from the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    log "Operation cancelled"
    exit 0
fi

log "Dropping all tables..."

# Drop all tables in the correct order (respecting foreign key constraints)
docker compose -f docker-compose.prod.yml exec postgres psql -U bondnixs -d bondnixs_db -c "
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS product_documents CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;

-- Drop any remaining tables
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;

-- Drop any sequences
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END \$\$;

-- Drop any functions
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
END \$\$;

-- Drop any views
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END \$\$;

-- Drop any indexes
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE';
    END LOOP;
END \$\$;
"

log "✅ All tables, sequences, functions, views, and indexes have been dropped"

# Verify cleanup
log "Verifying cleanup..."
TABLE_COUNT=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U bondnixs -d bondnixs_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' \n')

if [ "$TABLE_COUNT" = "0" ]; then
    log "✅ Database cleanup completed successfully - no tables remaining"
else
    warning "⚠️  $TABLE_COUNT tables still exist"
fi

log "Database is now ready for fresh initialization"
log "Run the following command to initialize with fresh data:"
echo ""
echo "docker compose -f docker-compose.prod.yml exec -T postgres psql -U bondnixs -d bondnixs_db < backend/db/init.sql"
echo ""
