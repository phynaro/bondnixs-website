-- Product Multiple Images Migration
-- Migrates from single image_url to multiple images support via product_images table

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;

-- Migrate existing image_url values to product_images table
-- For each product with an image_url, create a corresponding row in product_images
INSERT INTO product_images (product_id, image_url, display_order, is_primary, created_at, updated_at)
SELECT 
  id as product_id,
  image_url,
  0 as display_order,
  TRUE as is_primary,
  created_at,
  updated_at
FROM product
WHERE image_url IS NOT NULL AND image_url != '';

-- Verify migration: count products with images
DO $$
DECLARE
  products_with_images_count INTEGER;
  migrated_images_count INTEGER;
BEGIN
  -- Count products that had images
  SELECT COUNT(*) INTO products_with_images_count
  FROM product
  WHERE image_url IS NOT NULL AND image_url != '';
  
  -- Count migrated images
  SELECT COUNT(*) INTO migrated_images_count
  FROM product_images;
  
  -- Log migration results
  RAISE NOTICE 'Migration completed: % products with images, % images migrated', 
    products_with_images_count, migrated_images_count;
END $$;

-- Remove image_url column from product table
ALTER TABLE product DROP COLUMN IF EXISTS image_url;

-- Add comment to table
COMMENT ON TABLE product_images IS 'Stores multiple images for each product with ordering and primary image support';

