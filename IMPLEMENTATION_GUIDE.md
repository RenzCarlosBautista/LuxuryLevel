# Complete Implementation Guide - Brand Management & Product Sync

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This will install:
- `cron` - For scheduled product synchronization
- `@types/cron` - TypeScript types for cron

### 2. Update Database Schema

Run the SQL migration in your Supabase SQL Editor:

**File**: `migrations/002_product_sync.sql`

This creates:
- `product_sync_pending` - Stores products pending admin review
- `product_sync_history` - Audit trail of sync operations
- `sync_runs` - Tracks each sync execution

## Feature 1: Brand Management System

### Admin Features

**Access**: `/admin/brands` (requires admin login)

**Capabilities**:
✅ Create brands with name, description, logo
✅ Upload brand logos to Cloudflare R2
✅ Edit brand details
✅ Delete brands (with safety checks)
✅ Mark brands as featured for homepage
✅ Create sub-brands with parent brand relationship
✅ Search and filter brands
✅ View statistics (total, featured, sub-brands)

### Store Display

**Homepage** (`/`)
- Features first 3 featured brands from database
- Displays brand logo and 6 related products
- Completely dynamic - no hard-coded brands
- Updated content appears immediately after admin changes

**Brands Page** (`/brands`)
- Shows all main brands in grid
- Clickable brand cards with logos
- Links to brand-specific product listings

**Brand Page** (`/brands/:id`)
- Products filtered by brand
- Full product details and filtering
- Add to comparison or cart

## Feature 2: Product Synchronization System

### Admin Sync Dashboard

**Access**: `/admin/sync` (requires admin login)

**Features**:
- Manual sync trigger button
- Three sync categories:
  - **Missing**: Products on reference site but not in your database
  - **Price Differences**: Same products with different prices
  - **Extra**: Products in your database not on reference site

- For each category:
  - View pending items
  - Preview product details
  - Add admin notes
  - Approve and import
  - Reject with reason

### Automatic Sync

- Runs every Sunday at 8 AM Kuwait time
- Checks all 6 reference categories:
  - Bags
  - Watches
  - Cufflinks
  - Bracelets
  - Diamond Rings
  - Bridal Jewelries

- Creates sync records for differences
- Admin reviews and approves in dashboard

### Sync Workflow

1. **Scraper** fetches products from luxurysouq.com
2. **Comparison Engine** matches with your database
3. **Pending Records** created for differences
4. **Admin Reviews** in `/admin/sync` dashboard
5. **Approval Actions**:
   - Import new product
   - Update existing price
   - Archive extra product
   - Delete product

## Implementation Steps

### Step 1: Database Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy content from `migrations/002_product_sync.sql`
4. Run the migration
5. Verify tables created

### Step 2: Environment Variables

Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
NEXT_PUBLIC_R2_DOMAIN=your_r2_domain
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your_bucket
```

### Step 3: Initialize Background Jobs (Optional but Recommended)

In your `app/layout.tsx` or create a middleware file:

```typescript
import { initializeBackgroundJobs } from '@/lib/background-jobs';

// Call once during app initialization
await initializeBackgroundJobs();
```

This enables automatic Sunday sync scheduling.

### Step 4: Test Admin Features

1. **Test Brand Management**:
   - Go to `/admin/brands`
   - Create test brand with logo
   - Mark as featured
   - Check homepage for brand display
   - Edit and delete brand

2. **Test Product Sync**:
   - Go to `/admin/sync`
   - Click "Trigger Manual Sync Now"
   - Wait for sync to complete
   - Review pending items
   - Approve/reject some items

## File Structure

```
New/Modified Files:
├── app/admin/brands/                           # Brand management
│   └── page.tsx
├── app/api/admin/brands/                       # Brand API endpoints
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/logo/route.ts
├── components/admin/
│   ├── brand-form.tsx                         # Brand form component
│   └── sidebar.tsx                            # Updated with brands menu
├── components/homepage/
│   ├── dynamic-featured-brands.tsx            # New dynamic component
│   └── featured-brands.tsx                    # Existing featured brands
├── app/admin/sync/
│   └── page.tsx                               # Sync dashboard
├── app/api/admin/sync/                        # Sync API endpoints
│   ├── manual-trigger/route.ts
│   ├── pending/route.ts
│   ├── approve/[id]/route.ts
│   └── reject/[id]/route.ts
├── lib/scraping/                              # Scraper & sync modules
│   ├── scraper.ts
│   ├── compare-products.ts
│   ├── scheduler.ts
│   └── types.ts
├── lib/
│   ├── background-jobs.ts
│   └── r2.ts                                  # Updated with uploadFileToR2
├── migrations/
│   └── 002_product_sync.sql                   # Database schema
└── package.json                               # Updated dependencies
```

## API Endpoints

### Brand Management

**Admin Only** (requires JWT token):
- `GET /api/admin/brands?limit=50&offset=0` - List brands
- `POST /api/admin/brands` - Create brand
- `GET /api/admin/brands/:id` - Get brand details
- `PUT /api/admin/brands/:id` - Update brand
- `DELETE /api/admin/brands/:id` - Delete brand
- `POST /api/admin/brands/:id/logo` - Upload logo

**Public**:
- `GET /api/brands` - Get all main brands
- `GET /api/brands/featured` - Get featured brands

### Product Sync

**Admin Only**:
- `POST /api/admin/sync/manual-trigger` - Start manual sync
- `GET /api/admin/sync/pending?syncType=missing` - Get pending items
- `POST /api/admin/sync/approve/:id` - Approve sync item
- `POST /api/admin/sync/reject/:id` - Reject sync item

## Troubleshooting

### Issue: Brands not showing on homepage
**Solution**:
1. Verify at least one brand marked as "featured"
2. Check `/api/brands/featured` returns data
3. Check R2 domain configured correctly

### Issue: Logo upload fails
**Solution**:
1. Verify R2 credentials valid
2. Check file is actual image (check MIME type)
3. Ensure R2 bucket has proper permissions

### Issue: Sync not running automatically
**Solution**:
1. Ensure `initializeBackgroundJobs()` called on app start
2. Check server timezone (scheduler uses Kuwait time)
3. Verify cron package installed (`npm list cron`)

### Issue: Admin endpoints return 401
**Solution**:
1. Verify user logged in and token stored
2. Check token hasn't expired
3. Verify admin_token in localStorage

## Security Notes

- All admin endpoints protected with JWT verification
- Logo uploads validated for image MIME types
- Brand deletion prevented if dependencies exist
- Sync operations logged in audit trail
- Rate limiting recommended for production

## Performance Optimization

- Brand listings cached 60 seconds
- Logos stored on CDN (Cloudflare R2)
- Pagination on admin listing (50 per page)
- Lazy loading for featured brands
- Indexing on frequently queried columns

## Next Steps

1. **Category-Brand Relationships**: Create bridge table to associate brands with specific categories
2. **Bulk Import**: Add CSV upload for importing multiple brands
3. **Advanced Analytics**: Track product performance by brand
4. **Social Integration**: Add brand social media links
5. **Brand Stories**: Rich content pages for brand narratives

## Support

For issues or questions:
1. Check documentation files (BRAND_MANAGEMENT.md)
2. Review API endpoint documentation
3. Check console logs for errors
4. Verify database schema applied correctly
5. Ensure all environment variables configured

## Testing Checklist

Before going to production:
- [ ] Create brand with logo
- [ ] Mark brand as featured
- [ ] Homepage displays featured brands
- [ ] Brands page shows all brands
- [ ] Brand product filtering works
- [ ] Manual sync completes without errors
- [ ] Admin can approve/reject sync items
- [ ] Automatic sync scheduled (check logs)
- [ ] Logo upload to R2 works
- [ ] Search/filter in admin dashboard works

Good luck! 🚀
