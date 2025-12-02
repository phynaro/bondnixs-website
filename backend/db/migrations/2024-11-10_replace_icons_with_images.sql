-- Replace icon system with image uploads
-- Adds image_url column to content tables and removes icon column

-- Add image_url to home_content table
ALTER TABLE home_content 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to solutions_content table
ALTER TABLE solutions_content 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  DROP COLUMN IF EXISTS icon;

-- Add image_url to about_content table  
ALTER TABLE about_content 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  DROP COLUMN IF EXISTS icon;

-- Create indexes for image_url if needed
CREATE INDEX IF NOT EXISTS idx_home_content_image_url ON home_content(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solutions_content_image_url ON solutions_content(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_about_content_image_url ON about_content(image_url) WHERE image_url IS NOT NULL;

