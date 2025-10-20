# Database Migrations for BONDNIXS

This directory contains database migration scripts that handle schema changes safely.

## Migration Naming Convention

Use this format: `YYYY-MM-DD_HH-MM-SS_description.sql`

Examples:
- `2024-01-15_10-30-00_add_user_table.sql`
- `2024-01-20_14-45-00_add_product_reviews.sql`
- `2024-02-01_09-15-00_add_indexes_for_performance.sql`

## How Migrations Work

1. **Migration Tracking**: The system tracks which migrations have been applied in the `schema_migrations` table
2. **Sequential Application**: Migrations are applied in chronological order
3. **Idempotent**: Running migrations multiple times is safe
4. **Rollback**: Each migration should include both UP and DOWN changes

## Migration Template

```sql
-- Migration: YYYY-MM-DD_HH-MM-SS_description
-- Description: Brief description of what this migration does

-- UP Migration (applying the change)
BEGIN;

-- Your schema changes here
-- Example:
-- CREATE TABLE new_table (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT now()
-- );

-- CREATE INDEX idx_new_table_name ON new_table(name);

COMMIT;

-- DOWN Migration (reverting the change) - Optional
-- Uncomment and modify if you need rollback capability
/*
BEGIN;
DROP TABLE IF EXISTS new_table CASCADE;
COMMIT;
*/
```

## Running Migrations

### During Deployment
Migrations are automatically run during deployment via the deployment script.

### Manual Migration
```bash
# Run migrations manually
./scripts/migrate-database.sh

# Check migration status
docker compose -f docker-compose.prod.yml exec postgres psql -U bondnixs -d bondnixs_db -c "SELECT * FROM schema_migrations ORDER BY applied_at;"
```

## Best Practices

1. **Always test migrations** on a copy of production data first
2. **Keep migrations small** and focused on single changes
3. **Include rollback scripts** for critical changes
4. **Never modify existing migrations** - create new ones instead
5. **Use transactions** to ensure atomicity
6. **Add indexes** for new columns that will be queried frequently
