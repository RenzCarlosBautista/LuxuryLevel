-- SQL Migrations for Admin Panel
-- Run these commands in your Supabase SQL Editor

-- ============================================
-- VERIFICATION: Check existing schema
-- ============================================
-- Your database already has:
-- ✓ product table with: id, ref_no, name, description, color, gender, stock, price, brand_id, category_id, images, timestamps
-- ✓ category table with: id, name, description, parent_id
-- ✓ brand table with: id, name, description, logo_url, parent_id, featured

-- ============================================
-- 1. Verify Foreign Key Constraints
-- ============================================
-- Note: Constraints may already exist, errors are safe to ignore
-- Ensure product.brand_id references brand.id
DO $$ 
BEGIN
  ALTER TABLE product
  ADD CONSTRAINT fk_product_brand_id 
  FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, ignore
END $$;

-- Ensure product.category_id references category.id
DO $$ 
BEGIN
  ALTER TABLE product
  ADD CONSTRAINT fk_product_category_id 
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN
  -- Constraint already exists, ignore
END $$;

-- ============================================
-- 2. Create admin_users table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email);

-- ============================================
-- 3. Add admin-related columns to product table
-- ============================================
ALTER TABLE product ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS product_is_active_idx ON product(is_active);
CREATE INDEX IF NOT EXISTS product_sale_dates_idx ON product(sale_start_date, sale_end_date);
CREATE INDEX IF NOT EXISTS product_brand_id_idx ON product(brand_id);
CREATE INDEX IF NOT EXISTS product_category_id_idx ON product(category_id);

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
-- This migration:
-- 1. Creates admin_users table for authentication
-- 2. Adds admin columns to product: is_active, sale_price, sale_start_date, sale_end_date
-- 3. Verifies and adds foreign key constraints
-- 4. Creates indexes for better performance
--
-- ✅ Your existing data is NOT affected
-- ✅ All changes use "IF NOT EXISTS" for safety
-- ✅ No columns will be dropped
-- ============================================
