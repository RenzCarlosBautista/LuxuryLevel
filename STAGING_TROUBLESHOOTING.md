# Staging Workflow - Troubleshooting Guide

## 🔴 Error: "Failed to load staging products"

### What This Means
The admin dashboard cannot connect to or query the `staging_products` table.

### Solution Checklist

**Step 1:** Open browser console (F12 → Console tab)
- Look for detailed error message
- Note the exact error text

**Step 2:** Check if migrations were run

Go to **Supabase Dashboard > SQL Editor** and run:

```sql
SELECT COUNT(*) FROM staging_products;
```

- ✅ If it returns a number → Table exists, continue to Step 3
- ❌ If it says `relation "staging_products" does not exist` → Run migrations:

```
1. Copy contents of: migrations/002_staging_products.sql
2. Paste in SQL Editor → Run
3. Copy contents of: migrations/002_staging_rpc_functions.sql
4. Paste in SQL Editor → Run
```

**Step 3:** Check environment variables

Open `.env.local` and verify:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

All three should have values.

**Step 4:** Restart dev server

```bash
# Stop: Ctrl+C
npm run dev
```

---

## 🔴 Error: "npm run scrape:luxurysouq" exits with code 1

### Possible Causes

| Error | Fix |
|-------|-----|
| `NEXT_PUBLIC_SUPABASE_URL is not set` | Add to `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=...` |
| `SUPABASE_SERVICE_ROLE_KEY is not set` | Add to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=...` |
| `staging_products table not found` | Run migrations (see above) |
| `No products were scraped` | Website structure changed, update selectors |
| `Browser launch failed` | Puppeteer issue, try: `npm install puppeteer --force` |

### To Debug the Scraper

Run with verbose output:

```bash
npm run scrape:luxurysouq 2>&1 | tee scraper.log
```

This saves output to `scraper.log` file.

Look for:
- ✅ "Inserting into staging table..." → Success
- ❌ "staging_products table not found" → Run migrations
- ❌ "No products were scraped" → Website issue
- ❌ "Error inserting into staging" → Database issue

---

## 🔴 Error: "Approve" button does nothing

### Possible Causes

1. **RPC function not found**
   - Check migrations ran properly (see above)
   
2. **Product data not loading**
   - Refresh page (F5)
   - Check browser console for errors

3. **Permission issue**
   - Verify `.env.local` has correct Supabase keys
   - Try with fresh browser session (clear cookies)

### To Fix

1. Verify RPC functions exist in Supabase:

```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('approve_and_map_product', 'reject_staging_product');
```

Should return both functions.

2. Check browser console (F12):
   - Look for error messages
   - Screenshot and note exact error

3. Restart dev server

---

## 🔴 Error: Scraper runs but inserts 0 products

### Possible Causes

1. **Fragrance filtering too aggressive**
   - Products might match excluded keywords
   - Edit `config/scraper.config.ts` to adjust

2. **Website selectors changed**
   - luxurysouq.com may have updated HTML structure
   - Need to update selectors in `config/scraper.config.ts`

3. **Network timeout**
   - Website too slow to load
   - Increase timeout in `SCRAPE_CONFIG`

### Solution

Edit `config/scraper.config.ts`:

```typescript
excludeKeywords: [
  'fragrance',
  'perfume',
  // Add more here if needed
],

timeout: 60000, // Increase from 30000
```

Then retry:
```bash
npm run scrape:luxurysouq
```

---

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] `.env.local` has all three Supabase variables
- [ ] Migrations both executed in Supabase (2 SQL files)
- [ ] RPC functions exist (query shown above)
- [ ] `staging_products` table exists (query shown above)
- [ ] Browser cache cleared (F12 → Storage → Clear Everything)
- [ ] Dev server restarted after env changes
- [ ] Browser console checked for detailed errors (F12)

---

## 🔧 Advanced Debugging

### Check RPC Function Details

```sql
-- View approve_and_map_product function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'approve_and_map_product';
```

### Check Staging Table Data

```sql
-- View all staging products
SELECT * FROM staging_products LIMIT 5;

-- View pending products
SELECT * FROM staging_products 
WHERE sync_status = 'pending' 
LIMIT 5;

-- View sync log
SELECT * FROM product_sync_log LIMIT 10;
```

### Reset Staging Table (Caution: Deletes Data)

```sql
-- Remove all staging data
DELETE FROM staging_products;

-- Clear sync log
DELETE FROM product_sync_log;

-- Reset sequences
ALTER SEQUENCE staging_products_id_seq RESTART WITH 1;
ALTER SEQUENCE product_sync_log_id_seq RESTART WITH 1;
```

---

## 📞 Still Stuck?

1. **Screenshot browser console** (F12) showing error
2. **Check scraper.log** if exists
3. **Run this query** in Supabase SQL Editor:

```sql
SELECT 
  'staging_products' as table_name,
  COUNT(*) as row_count
FROM staging_products
UNION ALL
SELECT 
  'brand',
  COUNT(*) 
FROM brand
UNION ALL
SELECT 
  'category',
  COUNT(*) 
FROM category;
```

Share the results showing what data exists.

---

**Most issues are solved by:** ✅ Running migrations + ✅ Restarting dev server + ✅ Clearing browser cache
