# Staging to Production Web Scraping Workflow

## Overview

This is a complete staging-to-production system for importing products via web scraping. The workflow includes:

1. **Web Scraper** (Puppeteer) - Extracts products from luxurysouq.com
2. **Staging Table** - Holds raw scraped data temporarily
3. **Smart RPC Functions** - Intelligent brand/category mapping
4. **Admin Dashboard** - Review & approve products before production sync
5. **Audit Logging** - Complete action history

## Architecture

```
luxurysouq.com (Watches, Jewelry, Bags)
          ↓
    Puppeteer Scraper
          ↓
staging_products table (raw data)
          ↓
Admin Dashboard (Review)
          ↓
approve_and_map_product() RPC
          ↓
product table (production)
+ Auto-creates new brands/categories
+ Updates existing products
+ Logs all actions
```

## Setup Instructions

### 1. Database Setup

Run the migrations in this order:

```bash
# Terminal or Supabase SQL Editor

# Migration 1: Create staging tables
psql -h your-db-host -U postgres -d your-db -f migrations/002_staging_products.sql

# Migration 2: Create RPC functions
psql -h your-db-host -U postgres -d your-db -f migrations/002_staging_rpc_functions.sql
```

Or execute directly in Supabase dashboard > SQL Editor.

### 2. Install Dependencies

```bash
npm install puppeteer @supabase/supabase-js
```

### 3. Environment Variables

Add to `.env.local`:

```env
# Already existing
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For scraper (if running outside Next.js)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
```

### 4. Update Admin Sidebar Navigation

Add link to staging dashboard in your admin sidebar:

```tsx
// components/admin/sidebar.tsx
<a href="/admin/staging" className="menu-item">
  📦 Staging & Approval
</a>
```

## Usage

### Running the Scraper

```bash
# Compile and run
npx ts-node scripts/scrape-luxurysouq.ts

# Or if TypeScript is configured:
node --loader ts-node/esm scripts/scrape-luxurysouq.ts
```

**What it does:**
- Scrapes watches, jewelry, and bags from luxurysouq.com
- Excludes fragrances/perfumes automatically
- Extracts brand name from product title
- Inserts raw data into `staging_products` table
- Logs status to console

**Output:**
```
🚀 Starting LuxurySouq Scraper

📍 Scraping: https://luxurysouq.com/watches/
✓ Found 12 products on this page

📊 Total products scraped: 47

💾 Inserting into staging table...
✓ Inserted 47 products into staging table

✅ Scraping completed successfully!
```

### Approving Products

1. Navigate to `/admin/staging` in your dashboard
2. View pending products in the table
3. Review each product:
   - Product name
   - Extracted brand
   - Detected category
   - Price
4. Click **Approve** to:
   - Map to existing brand/category or create new ones
   - Upsert into production `product` table
   - Log the action
   - Remove from staging
5. Click **Reject** to remove without syncing

### Filtering & Stats

- **Pending** tab: Shows only products awaiting approval
- **All** tab: Shows all staged products + history
- **Refresh**: Reload data from database

## API Reference

### Scraper Configuration

Edit `SCRAPE_CONFIG` in `scripts/scrape-luxurysouq.ts`:

```typescript
const SCRAPE_CONFIG = {
  targetUrls: [
    'https://luxurysouq.com/watches/',
    'https://luxurysouq.com/jewelry/',
    'https://luxurysouq.com/bags/',
  ],
  excludeKeywords: ['fragrance', 'perfume', 'cologne', 'eau de'],
  timeout: 30000,
  headless: true,
  maxProducts: 100, // Limit per category
};
```

### RPC Functions

#### `approve_and_map_product(p_staging_id INT, p_approved_by TEXT)`

**Parameters:**
- `p_staging_id`: ID of staging product row
- `p_approved_by`: User/system identifier (default: 'system')

**Returns JSON:**
```json
{
  "success": true,
  "staging_id": 1,
  "product_id": 42,
  "brand_id": 5,
  "category_id": 3,
  "sync_status": "new_product", // or "price_updated"
  "message": "Product successfully synced from staging"
}
```

**Logic:**
1. Fetches staging row
2. Looks up brand (case-insensitive)
3. Creates brand if not found
4. Looks up category (case-insensitive)
5. Creates category if not found
6. Upserts product using brand_id, category_id, scraped_ref_no
7. Logs to `product_sync_log`
8. Deletes staging row

#### `reject_staging_product(p_staging_id INT, p_rejected_by TEXT, p_rejection_reason TEXT)`

**Parameters:**
- `p_staging_id`: ID of staging product to reject
- `p_rejected_by`: User/system identifier
- `p_rejection_reason`: Rejection reason (optional)

**Returns JSON:**
```json
{
  "success": true,
  "staging_id": 1,
  "message": "Staging product rejected and removed"
}
```

## Database Schema

### `staging_products` Table

```sql
id              SERIAL PRIMARY KEY
scraped_ref_no  TEXT UNIQUE NOT NULL
scraped_name    TEXT NOT NULL
scraped_price   NUMERIC(12, 2)
raw_brand_name  TEXT NOT NULL
raw_category_name TEXT NOT NULL
sync_status     TEXT DEFAULT 'pending'  -- pending, new_product, price_updated, error, rejected
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
scraped_at      TIMESTAMP
error_message   TEXT
```

### `product_sync_log` Table

```sql
id              SERIAL PRIMARY KEY
staging_id      INT REFERENCES staging_products(id)
action          TEXT  -- 'approved', 'rejected', 'error'
product_id      INT REFERENCES product(id)
brand_id        INT REFERENCES brand(id)
category_id     INT REFERENCES category(id)
details         JSONB
created_by      TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

## Troubleshooting

### Scraper returns 0 products

**Cause:** Website structure changed or selectors don't match

**Solution:**
```typescript
// Update SELECTORS in scrape-luxurysouq.ts
const SELECTORS = {
  productCard: 'li.product, li.woo-product-item, .product-item', // Add more
  productName: 'h2.woocommerce-loop-product__title, .product-title, h3.product-name', // Add more
  // ... etc
};
```

### RPC function not found

**Cause:** Migration not executed properly

**Solution:**
```bash
# Check if function exists:
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('approve_and_map_product', 'reject_staging_product');

# Re-run migration
psql -h your-db-host -U postgres -d your-db -f migrations/002_staging_rpc_functions.sql
```

### Brand/category creation fails

**Cause:** Duplicate unique constraint or missing parent_id

**Solution:**
- Check `brand` and `category` tables for duplicates
- Verify `parent_id` is nullable in schema

### Scraper runs but hangs

**Cause:** Page load timeout or network issue

**Solution:**
```typescript
// Increase timeout in SCRAPE_CONFIG
timeout: 60000, // 60 seconds
```

## Performance Tips

1. **Run scraper during off-hours** to avoid database load
2. **Approve products in batches** of 10-20
3. **Monitor staging table size:**
   ```sql
   SELECT COUNT(*) FROM staging_products WHERE sync_status = 'pending';
   ```
4. **Archive old logs** periodically:
   ```sql
   DELETE FROM product_sync_log 
   WHERE created_at < NOW() - INTERVAL '30 days';
   ```

## Security Notes

- ✅ Service role key used for scraper (server-side only)
- ✅ Anon key used for admin dashboard (respects RLS)
- ✅ All actions logged for audit
- ✅ Fragrance filter prevents brand pollution
- ✅ Case-insensitive brand matching prevents duplicates

**Recommended:** Add admin RLS policy to staging tables:

```sql
ALTER TABLE staging_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY staging_products_admin_only ON staging_products
FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');
```

## Advanced: Custom Scrapers

To add scraping for other sites:

1. Create new file: `scripts/scrape-{sitename}.ts`
2. Extend `LuxurySouqScraper` class pattern
3. Update selectors for target site
4. Add to automation schedule (cron, GitHub Actions, etc.)

## Next Steps

- [ ] Set up scheduled scraping (e.g., weekly via GitHub Actions)
- [ ] Add email notifications for approval queue
- [ ] Implement bulk approval with filtering
- [ ] Add product image downloading from scraped URLs
- [ ] Create price history tracking
- [ ] Build comparison reports (staged vs. current)

---

**Last Updated:** May 2026  
**Status:** Production Ready ✅
