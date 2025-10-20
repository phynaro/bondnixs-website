# PostgreSQL Setup for Product Catalog Management

This document describes how to use **PostgreSQL** as the backend database to manage a structured product catalog for the company website. It supports dynamic product pages with **Header, Features, and Specification Table** sections while allowing admin users to add, edit, or remove products over time.

---

## 1. Database Schema

### Table: `product`
Stores core product information (stable fields).

```sql
CREATE TABLE product (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model        TEXT NOT NULL UNIQUE,          -- Product model (e.g., AVC-2100)
  name         TEXT NOT NULL,                 -- Product name (e.g., Auger Valve Controller)
  short_brief  TEXT,                          -- Short description
  description  TEXT,                          -- Long description
  image_url    TEXT,                          -- Product image path/URL
  features     TEXT[],                        -- Features as an array of text
  specs        JSONB,                         -- Specifications as key/value pairs
  published    BOOLEAN DEFAULT TRUE,          -- Visibility flag
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

### Example Data
```sql
INSERT INTO product (model, name, short_brief, description, image_url, features, specs)
VALUES (
  'AVC-2100',
  'Auger Valve Controller',
  'Suit with Auger Valve, accurately dispense.',
  'A single controller can match DT screw valve or other brand, with teaching memory function.',
  '/uploads/avc2100.png',
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
  }'::jsonb
);
```

---

## 2. Query Examples

### Fetch All Products
```sql
SELECT id, model, name, short_brief, image_url FROM product WHERE published = TRUE;
```

### Fetch Product by Model
```sql
SELECT * FROM product WHERE model = 'AVC-2100';
```

### Search Products by Spec Key
```sql
-- Products that define an 'Air Input' spec
SELECT * FROM product WHERE specs ? 'Air Input';
```

### Search Products by Spec Value
```sql
-- Products with a Program Capacity of 20 programs
SELECT * FROM product WHERE specs->>'Program Capacity' = '20 programs';
```

### Full-Text Search on Name/Description
```sql
SELECT * FROM product
WHERE to_tsvector('simple', name || ' ' || coalesce(description,''))
      @@ plainto_tsquery('auger controller');
```

---

## 3. Indexes for Performance

```sql
-- Index for searching by model
CREATE INDEX idx_product_model ON product(model);

-- Index for JSONB specs
CREATE INDEX idx_product_specs_gin ON product USING GIN (specs jsonb_path_ops);

-- Full-text index for name and description
CREATE INDEX idx_product_ft ON product USING GIN (to_tsvector('simple', name || ' ' || coalesce(description,'')));
```

---

## 4. Admin Panel Integration

- Backend can expose REST/GraphQL APIs:
  - `GET /api/products` → list all products
  - `GET /api/products/:id` → fetch one product
  - `POST /api/products` → add new product
  - `PUT /api/products/:id` → update product
  - `DELETE /api/products/:id` → remove product

- Admin UI can:
  - Add/edit header fields (model, name, brief, description, image)
  - Add/edit features (stored as array)
  - Add/edit specifications (stored as JSON)

---

## 5. Why PostgreSQL + JSONB
- **Relational safety** for core fields (model, name, references).
- **Flexibility** for specs (no need to change schema for new fields).
- **Fast querying** with GIN indexes.
- **Future-proof** for reporting and analytics.

---

## 6. Extension (Optional)
If fast filtering across specs becomes critical, introduce a helper table:

```sql
CREATE TABLE product_spec_kv (
  product_id UUID REFERENCES product(id) ON DELETE CASCADE,
  name       TEXT,
  value      TEXT,
  PRIMARY KEY (product_id, name)
);
```
This can be auto-populated from `product.specs` via triggers for faceted search.

---

## 7. Summary
- Use **Postgres** as the main product database.
- Store fixed info in relational columns.
- Store **Features** as an array and **Specs** as JSONB.
- Add proper indexes for speed.
- Provide an API for the frontend and admin panel to manage products.

This structure balances **flexibility (easy to add/change specs)** with **strong relational integrity** for long-term maintainability.

