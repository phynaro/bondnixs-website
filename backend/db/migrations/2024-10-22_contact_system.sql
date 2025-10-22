-- Contact System Migration
-- Creates tables for email recipients and contact messages

-- Create email_recipients table
CREATE TABLE IF NOT EXISTS email_recipients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                        -- Recipient name
  email         TEXT NOT NULL UNIQUE,                -- Recipient email address
  active        BOOLEAN DEFAULT TRUE,                 -- Whether recipient is active
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,                        -- Sender name
  email         TEXT NOT NULL,                        -- Sender email
  company       TEXT,                                 -- Sender company (nullable)
  phone         TEXT,                                 -- Sender phone (nullable)
  subject       TEXT NOT NULL,                        -- Message subject
  message       TEXT NOT NULL,                        -- Message content
  status        TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')), -- Message status
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(email);
CREATE INDEX IF NOT EXISTS idx_email_recipients_active ON email_recipients(active);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Insert default recipient
INSERT INTO email_recipients (name, email, active)
VALUES ('BONDNIXS Admin', 'Hathaipat.w@bondnixs.co.th', TRUE)
ON CONFLICT (email) DO NOTHING;
