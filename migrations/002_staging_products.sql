-- Staging table for raw scraped product data
CREATE TABLE IF NOT EXISTS staging_products (
  id SERIAL PRIMARY KEY,
  scraped_ref_no TEXT NOT NULL UNIQUE,
  scraped_name TEXT NOT NULL,
  scraped_price NUMERIC(12, 2),
  raw_brand_name TEXT NOT NULL,
  raw_category_name TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'new_product', 'price_updated', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scraped_at TIMESTAMP,
  error_message TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staging_products_status ON staging_products(sync_status);
CREATE INDEX IF NOT EXISTS idx_staging_products_ref_no ON staging_products(scraped_ref_no);
CREATE INDEX IF NOT EXISTS idx_staging_products_created_at ON staging_products(created_at DESC);

-- Log table for audit trail
CREATE TABLE IF NOT EXISTS product_sync_log (
  id SERIAL PRIMARY KEY,
  staging_id INT REFERENCES staging_products(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approved', 'rejected', 'error'
  product_id INT REFERENCES product(id) ON DELETE SET NULL,
  brand_id INT REFERENCES brand(id) ON DELETE SET NULL,
  category_id INT REFERENCES category(id) ON DELETE SET NULL,
  details JSONB,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_staging_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staging_products_timestamp_trigger
BEFORE UPDATE ON staging_products
FOR EACH ROW
EXECUTE FUNCTION update_staging_products_timestamp();
