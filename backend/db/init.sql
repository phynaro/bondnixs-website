-- PostgreSQL Schema for Product Catalog Management
-- Based on postgres.md specification

-- Create category table
CREATE TABLE IF NOT EXISTS category (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,         -- Category name (e.g., Desktop Robots)
  description   TEXT,                         -- Category description
  display_order INTEGER DEFAULT 0,            -- For sorting categories
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Create product table
CREATE TABLE IF NOT EXISTS product (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model        TEXT NOT NULL UNIQUE,          -- Product model (e.g., AVC-2100)
  name         TEXT NOT NULL,                 -- Product name (e.g., Auger Valve Controller)
  short_brief  TEXT,                          -- Short description
  description  TEXT,                          -- Long description
  image_url    TEXT,                          -- Product image path/URL
  features     TEXT[],                        -- Features as an array of text
  specs        JSONB,                         -- Specifications as key/value pairs
  category_id  UUID NOT NULL REFERENCES category(id) ON DELETE RESTRICT, -- Required category
  published    BOOLEAN DEFAULT TRUE,          -- Visibility flag
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_display_order ON category(display_order);
CREATE INDEX IF NOT EXISTS idx_product_model ON product(model);
CREATE INDEX IF NOT EXISTS idx_product_specs_gin ON product USING GIN (specs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_product_ft ON product USING GIN (to_tsvector('simple', name || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS idx_product_published ON product(published);
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);

-- Insert default categories
INSERT INTO category (name, description, display_order)
VALUES 
  ('Desktop Robots', 'High-precision desktop dispensing robots and automation systems', 1),
  ('Controllers', 'Valve controllers and dispensing control systems', 2),
  ('Valves', 'Dispensing valves and valve accessories', 3),
  ('Accessories', 'Spare parts, tools, and system accessories', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert example products with categories
INSERT INTO product (model, name, short_brief, description, image_url, features, specs, category_id)
VALUES (
  'AVC-2100',
  'Auger Valve Controller',
  'Suit with Auger Valve, accurately dispense.',
  'A single controller can match DT screw valve or other brand, with teaching memory function.',
  '/uploads/products/avc2100.png',
  ARRAY[
    'Teaching memory function',
    'Combine motor and air control',
    'Digital pressure display shows output'
  ],
  '{
    "Air Input": "70 ~ 100 psi (5 ~ 7 bar)",
    "Air Output": "1 ~ 50 psi (0.1 ~ 4 bar)",
    "Program Capacity": "20 programs",
    "Control": "Steady, Time, Suck back, Sequence",
    "Input Voltage": "30 VDC / 2A"
  }'::jsonb,
  (SELECT id FROM category WHERE name = 'Controllers')
) ON CONFLICT (model) DO NOTHING;

-- Create product_documents table
CREATE TABLE IF NOT EXISTS product_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,                        -- User-friendly document name
  document_type TEXT NOT NULL,                        -- Document type (e.g., "Brochure", "Manual", "Datasheet")
  file_url      TEXT NOT NULL,                        -- File path/URL
  file_size     BIGINT NOT NULL,                      -- File size in bytes
  uploaded_at   TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for product_documents
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_product_documents_type ON product_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_product_documents_uploaded_at ON product_documents(uploaded_at);

-- Insert more example products
INSERT INTO product (model, name, short_brief, description, image_url, features, specs, category_id)
VALUES 
(
  'DT-FN-200',
  'DT-FN series Desktop Dispensing Robot',
  'High-precision desktop dispensing robot',
  'Advanced desktop dispensing robot with precision control and flexible programming capabilities.',
  '/uploads/products/dtfns200.png',
  ARRAY[
    'High precision positioning',
    'Flexible programming',
    'Easy operation interface',
    'Compact desktop design'
  ],
  '{
    "Positioning Accuracy": "±0.01mm",
    "Repeatability": "±0.005mm",
    "Working Area": "200 x 200 x 50mm",
    "Speed": "200mm/s",
    "Weight": "15kg"
  }'::jsonb,
  (SELECT id FROM category WHERE name = 'Desktop Robots')
),
(
  'VC-1000',
  'VC-1000 Valve Controller',
  'Precision valve controller for dispensing applications',
  'Advanced valve controller with digital pressure control and programmable sequences.',
  '/uploads/products/vc1000.png',
  ARRAY[
    'Digital pressure control',
    'Programmable sequences',
    'Real-time monitoring',
    'Easy calibration'
  ],
  '{
    "Pressure Range": "0-100 psi",
    "Control Accuracy": "±1%",
    "Response Time": "<10ms",
    "Input Voltage": "24 VDC",
    "Communication": "RS485, Ethernet"
  }'::jsonb,
  (SELECT id FROM category WHERE name = 'Controllers')
) ON CONFLICT (model) DO NOTHING;
