# Staging Setup Verification Checklist

## ❌ If You See: "Failed to load staging products"

Follow this checklist to fix the issue:

### Step 1: Verify Migrations Were Run

**In Supabase Dashboard:**

1. Go to: https://supabase.com → Your Project
2. Click: **SQL Editor** (left sidebar)
3. Click: **New Query**
4. Paste this query:

```sql
-- Check if staging_products table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'staging_products'
);
```

5. Click **Run**
6. If result is **`true`** → Table exists ✅
7. If result is **`false`** → Run migrations (see Step 2)

---

### Step 2: Run the Migrations

**In Supabase SQL Editor:**

1. Create a **New Query**
2. Copy and paste the entire contents of: `migrations/002_staging_products.sql`
3. Click **Run**
4. Wait for success ✅

Then:

1. Create another **New Query**
2. Copy and paste the entire contents of: `migrations/002_staging_rpc_functions.sql`
3. Click **Run**
4. Wait for success ✅

---

### Step 3: Verify RPC Functions Exist

**In Supabase SQL Editor:**

Create a **New Query** and paste:

```sql
-- Check if RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('approve_and_map_product', 'reject_staging_product')
ORDER BY routine_name;
```

Click **Run**

You should see both functions listed:
```
approve_and_map_product
reject_staging_product
```

If empty → Re-run migration: `migrations/002_staging_rpc_functions.sql`

---

### Step 4: Check Environment Variables

Open `.env.local` and verify you have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

All three should have values (not empty).

---

### Step 5: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## If You Still Get an Error

### Check Browser Console

1. Open your browser
2. Press **F12** (DevTools)
3. Click **Console** tab
4. Look for the detailed error message
5. Screenshot and share the error

### Common Errors

| Error | Fix |
|-------|-----|
| `relation "staging_products" does not exist` | Run migration `002_staging_products.sql` |
| `function approve_and_map_product does not exist` | Run migration `002_staging_rpc_functions.sql` |
| `supabaseUrl is required` | Check `.env.local` for NEXT_PUBLIC_SUPABASE_URL |
| `The API returned an error with status 401` | Check .env.local - anon key may be expired |

---

## Quick Test: Try the Scraper

Once migrations are verified, test with:

```bash
npm run scrape:luxurysouq
```

This will:
1. ✅ Scrape luxurysouq.com
2. ✅ Insert data into `staging_products` table
3. ✅ Show how many products were scraped

---

## Still Stuck?

Check these files to ensure they exist:

- ✅ `migrations/002_staging_products.sql` 
- ✅ `migrations/002_staging_rpc_functions.sql`
- ✅ `scripts/scrape-luxurysouq.ts`
- ✅ `components/admin/staging-approval-dashboard.tsx`
- ✅ `app/admin/staging/page.tsx`

If any are missing, regenerate them.

---

**Status:** This checklist should resolve 95% of setup issues. If not, the error message in browser console will tell you exactly what's wrong.
