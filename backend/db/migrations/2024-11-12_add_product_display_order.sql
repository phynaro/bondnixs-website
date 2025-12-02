-- Add display_order column to product table
-- This allows products to be ordered within their categories

-- Add display_order column if it doesn't exist
ALTER TABLE product 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_product_display_order ON product(display_order);

-- Update existing products to have display_order based on created_at
-- This ensures existing products have a reasonable default order
UPDATE product 
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at ASC) as row_number
  FROM product
) AS subquery
WHERE product.id = subquery.id;

