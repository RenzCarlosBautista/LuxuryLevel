-- SQL Migration for Product Synchronization Feature
-- Manages scraping and syncing products from reference websites

-- ============================================
-- 1. Create product_sync_pending table
-- ============================================
-- Stores products pending admin review/approval
CREATE TABLE IF NOT EXISTS product_sync_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sync type: 'missing' (ref has, we don't), 'price_diff' (price different), 'extra' (we have, ref doesn't)
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('missing', 'price_diff', 'extra')),
  
  -- Product category from reference (bags, watches, cufflinks, bracelet, diamond_rings, bridal_jewelries)
  product_category VARCHAR(100) NOT NULL,
  
  -- Reference product data (stored as JSON for missing/price_diff items)
  reference_data JSONB NOT NULL,
  
  -- Local product ID (if syncing with existing product)
  local_product_id UUID REFERENCES product(id) ON DELETE SET NULL,
  
  -- Approval status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- If approved - what action taken
  action_type VARCHAR(50) CHECK (action_type IN ('import', 'update_price', 'archive', 'delete')),
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Who approved
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS product_sync_pending_status_idx ON product_sync_pending(status);
CREATE INDEX IF NOT EXISTS product_sync_pending_sync_type_idx ON product_sync_pending(sync_type);
CREATE INDEX IF NOT EXISTS product_sync_pending_product_category_idx ON product_sync_pending(product_category);
CREATE INDEX IF NOT EXISTS product_sync_pending_local_product_idx ON product_sync_pending(local_product_id);

-- ============================================
-- 2. Create product_sync_history table
-- ============================================
-- Audit trail of all sync operations
CREATE TABLE IF NOT EXISTS product_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to the sync record (if applicable)
  sync_pending_id UUID REFERENCES product_sync_pending(id) ON DELETE SET NULL,
  
  -- Action performed
  action VARCHAR(100) NOT NULL,
  
  -- Reference data before/after
  old_data JSONB,
  new_data JSONB,
  
  -- Admin who performed action
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- Timestamp
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Notes
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS product_sync_history_sync_pending_idx ON product_sync_history(sync_pending_id);
CREATE INDEX IF NOT EXISTS product_sync_history_admin_idx ON product_sync_history(admin_id);
CREATE INDEX IF NOT EXISTS product_sync_history_performed_at_idx ON product_sync_history(performed_at);

-- ============================================
-- 3. Create sync_runs table
-- ============================================
-- Track each sync run (manual or scheduled)
CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type: 'manual' or 'scheduled'
  run_type VARCHAR(50) NOT NULL CHECK (run_type IN ('manual', 'scheduled')),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Statistics
  products_scanned INTEGER DEFAULT 0,
  products_found_missing INTEGER DEFAULT 0,
  products_with_price_diff INTEGER DEFAULT 0,
  products_marked_extra INTEGER DEFAULT 0,
  
  -- Error message if failed
  error_message TEXT,
  
  -- Triggered by (admin ID if manual, NULL if scheduled)
  triggered_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS sync_runs_run_type_idx ON sync_runs(run_type);
CREATE INDEX IF NOT EXISTS sync_runs_status_idx ON sync_runs(status);
CREATE INDEX IF NOT EXISTS sync_runs_started_at_idx ON sync_runs(started_at);

-- ============================================
-- SUMMARY
-- ============================================
-- This migration creates:
-- 1. product_sync_pending - stores pending product imports/updates/deletes
-- 2. product_sync_history - audit trail of sync operations
-- 3. sync_runs - tracks each sync execution
--
-- All tables have proper constraints, indexes, and timestamps
-- Foreign keys reference existing tables (product, admin_users)
