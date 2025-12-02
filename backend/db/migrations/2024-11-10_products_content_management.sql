-- Products Content Management Migration
-- Creates table for managing dynamic content on Products page (Engineering Services, After-Sales Services, Industry Applications)

-- Create products_content table
CREATE TABLE IF NOT EXISTS products_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL CHECK (section_type IN ('engineering_service', 'after_sales_service', 'industry_application', 'hero', 'cta')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  content JSONB, -- Flexible JSON for additional data
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_content_section_type ON products_content(section_type);
CREATE INDEX IF NOT EXISTS idx_products_content_display_order ON products_content(display_order);
CREATE INDEX IF NOT EXISTS idx_products_content_published ON products_content(published);
CREATE INDEX IF NOT EXISTS idx_products_content_image_url ON products_content(image_url) WHERE image_url IS NOT NULL;

-- Insert seed data for Engineering & System Design
INSERT INTO products_content (section_type, title, description, image_url, display_order, published) VALUES
  ('engineering_service', 'Drawing', 'Professional technical drawings and specifications for your projects', NULL, 1, true),
  ('engineering_service', 'Part Fabrication', 'Custom parts and components manufactured to your specifications', NULL, 2, true),
  ('engineering_service', 'System Integration', 'Complete system integration and optimization for maximum efficiency', NULL, 3, true)
ON CONFLICT DO NOTHING;

-- Insert seed data for After-Sales Service
INSERT INTO products_content (section_type, title, description, image_url, display_order, published) VALUES
  ('after_sales_service', 'Maintenance', 'Regular maintenance services to keep your systems running smoothly', NULL, 1, true),
  ('after_sales_service', 'Troubleshooting', 'Expert troubleshooting and diagnostic services', NULL, 2, true),
  ('after_sales_service', 'Overhaul', 'Complete system overhaul and refurbishment services', NULL, 3, true),
  ('after_sales_service', 'Upgrade Systems', 'System upgrades and modernization services', NULL, 4, true),
  ('after_sales_service', 'Spare Parts', 'Genuine spare parts and replacement components', NULL, 5, true)
ON CONFLICT DO NOTHING;

-- Insert seed data for Industry Applications
INSERT INTO products_content (section_type, title, description, image_url, display_order, published) VALUES
  ('industry_application', 'Potting', 'Protective potting applications for electronic components', NULL, 1, true),
  ('industry_application', 'Conformal Coating', 'Protective coating applications for circuit boards', NULL, 2, true),
  ('industry_application', 'Solder Paste', 'Precise solder paste dispensing for PCB assembly', NULL, 3, true)
ON CONFLICT DO NOTHING;

