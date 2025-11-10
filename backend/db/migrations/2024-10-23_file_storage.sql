-- File Storage System Migration
-- Creates tables for file storage and activity tracking

-- Create file_storage table
CREATE TABLE IF NOT EXISTS file_storage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT NOT NULL,                        -- Stored filename (with unique suffix)
  original_name TEXT NOT NULL,                        -- Original filename from user
  file_url      TEXT NOT NULL,                        -- File path/URL
  file_size     BIGINT NOT NULL,                      -- File size in bytes
  mime_type     TEXT,                                 -- MIME type of the file
  description   TEXT,                                 -- Optional description
  uploaded_by   TEXT NOT NULL,                        -- Email of user who uploaded
  uploaded_by_name TEXT,                              -- Name of user who uploaded
  uploaded_at   TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Create file_activities table for activity history
CREATE TABLE IF NOT EXISTS file_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id       UUID NOT NULL REFERENCES file_storage(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('uploaded', 'deleted', 'viewed', 'downloaded', 'link_copied', 'updated')),
  performed_by  TEXT NOT NULL,                        -- Email of user who performed the action
  performed_by_name TEXT,                             -- Name of user who performed the action
  performed_at  TIMESTAMPTZ DEFAULT now(),
  details       JSONB                                 -- Additional details (e.g., IP address, user agent)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_storage_uploaded_at ON file_storage(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_storage_uploaded_by ON file_storage(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_storage_original_name ON file_storage(original_name);
CREATE INDEX IF NOT EXISTS idx_file_activities_file_id ON file_activities(file_id);
CREATE INDEX IF NOT EXISTS idx_file_activities_performed_at ON file_activities(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_activities_activity_type ON file_activities(activity_type);

