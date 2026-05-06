# Quick Start Guide: Staging to Production Workflow

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install puppeteer
```

### Step 2: Run Database Migrations

Go to **Supabase Dashboard > SQL Editor** and run these two files in order:

1. **Copy & paste** `migrations/002_staging_products.sql`
2. **Copy & paste** `migrations/002_staging_rpc_functions.sql`

Click **Execute** for each.

### Step 3: Verify Environment Variables

Check `.env.local` has these:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 Running the Workflow

### Run the Scraper
```bash
npm run scrape:luxurysouq
```

**What happens:**
- ✅ Scrapes watches, jewelry, bags from luxurysouq.com
- ✅ Filters out fragrances automatically
- ✅ Inserts raw data into `staging_products` table
- ✅ Shows success message with count

### Review Products in Admin Dashboard
1. Go to http://localhost:3000/admin/staging
2. View pending products in table
3. See stats: Total, Pending, Refresh

### Approve Products
- Click **Approve** button:
  - ✅ Auto-maps brands (case-insensitive)
  - ✅ Creates new brands if needed
  - ✅ Creates new categories if needed
  - ✅ Adds to `product` table
  - ✅ Removes from staging
  - ✅ Logs action

### Reject Products
- Click **Reject** button:
  - ✅ Removes from staging
  - ✅ Logs rejection reason
  - ✅ No data synced to production

---

## 🎯 Common Workflows

### Workflow A: One-Time Import
```bash
# 1. Run scraper
npm run scrape:luxurysouq

# 2. Go to admin dashboard
# http://localhost:3000/admin/staging

# 3. Review and approve all 50 products manually
# (Click approve for each)

# ✅ Done! All products now in production
```

### Workflow B: Scheduled Daily Import
```bash
# 1. Set up GitHub Actions cron job (runs daily at 2 AM)
# 2. Scraper runs → inserts to staging
# 3. Admin reviews in morning → approves batch
# 4. Products sync to production
```

### Workflow C: Batch Approval (Future Enhancement)
```bash
# 1. Run scraper → 100 products in staging
# 2. Filter by brand, category
# 3. "Approve All" button
# 4. All synced at once
```

---

## 🔍 Monitoring

### Check Staging Queue
```bash
# Terminal/Database Console
SELECT COUNT(*) as pending_count 
FROM staging_products 
WHERE sync_status = 'pending';
```

### View Approval History
```bash
SELECT action, created_at, created_by 
FROM product_sync_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check for Errors
In admin dashboard, look for products with **Status: Error**

---

## ⚙️ Customization

### Add New Scraping Target
Edit `config/scraper.config.ts`:

```typescript
export const SCRAPER_CONFIG = {
  targetUrls: [
    'https://luxurysouq.com/watches/',
    'https://luxurysouq.com/jewelry/',
    'https://luxurysouq.com/bags/',
    'https://luxurysouq.com/shoes/', // ← Add here
  ],
  // ...
};
```

### Add Brand to Known List
Edit `config/scraper.config.ts`:

```typescript
knownBrands: [
  'Rolex',
  'Omega',
  // ... existing brands
  'MyNewBrand', // ← Add here
],
```

### Exclude Different Keywords
Edit `config/scraper.config.ts`:

```typescript
excludeKeywords: [
  'fragrance',
  'perfume',
  'vintage', // ← Add keyword to exclude
],
```

---

## 🐛 Troubleshooting

### **Scraper Returns 0 Products**

**Check:** Are you getting any console errors?

```bash
# If yes → Website structure changed
# Update selectors in config/scraper.config.ts

# If no → Network issue
# Try increasing timeout:
puppeteerOptions: {
  timeout: 60000, // Increase from 30000
}
```

### **Approval Button Does Nothing**

**Check:** Browser console for errors

```bash
# Likely cause: RPC function not found
# Solution: Re-run migrations in Supabase
```

### **Products Not Appearing in Production Table**

**Check:** 
1. Click "Refresh" in dashboard
2. Check for **Status: Error** products
3. Click product to see error details

---

## 📊 Dashboard Stats Explained

| Stat | Meaning |
|------|---------|
| **Total Staged** | Products waiting + rejected + error |
| **Pending Review** | Products awaiting your approval |
| **Approve/Reject** | Buttons to accept or discard product |

---

## 🔐 Security Notes

✅ **Best Practices Applied:**
- Service role key used only server-side
- Fragrance filter prevents brand pollution
- Case-insensitive matching prevents duplicates
- Full audit log of all actions
- Zero production data until approved

⚠️ **In Production:**
- Add RLS policies to staging tables
- Require admin role for approval
- Monitor approval queue size
- Set up alerts for errors

---

## 📈 Next Steps

Once comfortable with this workflow:

1. **Automate scraping** → GitHub Actions scheduled job
2. **Bulk approval** → Add "Approve All" button
3. **Image sync** → Download scraped images to R2
4. **Price tracking** → Keep history of price changes
5. **Multi-source** → Add more website scrapers

---

## 📞 Support

**For issues:**
1. Check logs: `logs/scraper.log`
2. Enable verbose mode: `logging.verbose: true`
3. Check Supabase dashboard for DB errors
4. Verify all migrations executed

**Documentation:** See `STAGING_TO_PRODUCTION.md` for full reference.

---

**Happy scraping! 🎉**
