-- Rate Limiting and Flood Protection Migration
-- Creates table for tracking contact form submissions

-- Create contact_submissions_tracking table
CREATE TABLE IF NOT EXISTS contact_submissions_tracking (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address    INET NOT NULL,                        -- IP address of submitter
  email         TEXT,                                 -- Email address (nullable for IP-only tracking)
  user_agent    TEXT,                                 -- User agent string
  submission_count INTEGER DEFAULT 1,                 -- Number of submissions from this IP/email
  first_submission TIMESTAMPTZ DEFAULT now(),        -- First submission timestamp
  last_submission TIMESTAMPTZ DEFAULT now(),         -- Last submission timestamp
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_tracking_ip ON contact_submissions_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_email ON contact_submissions_tracking(email);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_last_submission ON contact_submissions_tracking(last_submission);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_ip_email ON contact_submissions_tracking(ip_address, email);

-- Create a function to clean up old tracking records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_tracking_records()
RETURNS void AS $$
BEGIN
  DELETE FROM contact_submissions_tracking 
  WHERE last_submission < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_tracking_updated_at_trigger
  BEFORE UPDATE ON contact_submissions_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_tracking_updated_at();
