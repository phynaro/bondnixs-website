-- Migration: 2024-10-21_02-30-00_add_user_management
-- Description: Add user management tables for admin authentication

-- UP Migration (applying the change)
BEGIN;

-- Create users table for admin management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Add audit columns to existing tables
ALTER TABLE product ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE product ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
ALTER TABLE category ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE category ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

COMMIT;

-- DOWN Migration (reverting the change)
/*
BEGIN;

-- Remove audit columns
ALTER TABLE product DROP COLUMN IF EXISTS created_by;
ALTER TABLE product DROP COLUMN IF EXISTS updated_by;
ALTER TABLE category DROP COLUMN IF EXISTS created_by;
ALTER TABLE category DROP COLUMN IF EXISTS updated_by;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_sessions_expires;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_users_google_id;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

COMMIT;
*/
