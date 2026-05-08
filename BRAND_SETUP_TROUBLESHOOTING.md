# Brand Management Setup Troubleshooting

## Error: "Failed to fetch brands"

This error occurs when the admin panel cannot load the brands. Here are the solutions:

### Step 1: Verify You're Logged In

1. Go to `/admin/login`
2. Enter your admin credentials
3. You should be redirected to `/admin/dashboard`
4. Then try accessing `/admin/brands`

**If you're not logged in**: The page will show "You are not authenticated. Redirecting to login..."

### Step 2: Create the Brand Table (Critical!)

The `brand` table must exist in your Supabase database. Follow these steps:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL below:

```sql
-- Create brand table
CREATE TABLE IF NOT EXISTS brand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  parent_id UUID REFERENCES brand(id) ON DELETE RESTRICT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS brand_parent_id_idx ON brand(parent_id);
CREATE INDEX IF NOT EXISTS brand_featured_idx ON brand(featured);
CREATE INDEX IF NOT EXISTS brand_name_idx ON brand(name);

-- Enable Row Level Security
ALTER TABLE brand ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Enable read access for all users" ON brand FOR SELECT USING (true);

-- Create policy to allow authenticated admin write access
CREATE POLICY "Enable write access for authenticated users" ON brand FOR INSERT, UPDATE, DELETE
  USING (auth.role() = 'authenticated');
```

6. Click "Run" button
7. You should see "Success" message
8. Go back to your app and refresh the `/admin/brands` page

#### Option B: Using Migrations

If you prefer using migration files:

1. The migration is in: `migrations/002_product_sync.sql`
2. Copy relevant brand table creation SQL from there
3. Run in Supabase SQL Editor

### Step 3: Verify Table Creation

To check if the table was created successfully:

1. In Supabase Dashboard, go to "Table Editor"
2. Look for "brand" in the left sidebar under "public" schema
3. You should see columns: id, name, description, logo_url, parent_id, featured, created_at, updated_at

If you don't see it, the table wasn't created. Go back to Step 2 and run the SQL again.

### Step 4: Disable Row Level Security (Development Only!)

**IMPORTANT**: For development, you may need to disable RLS or add proper policies.

If you still get errors after creating the table:

1. Go to Supabase Dashboard → Authentication → Policies
2. Look for the `brand` table
3. Click on it and review the policies
4. If no policies exist, click "Add policy" and choose:
   - **Policy for SELECT**: "Enable read access for all users"
   - Click "Use this template"
   - Click "Review" then "Create policy"
5. Repeat for INSERT, UPDATE, DELETE if needed

Or run this SQL to allow everything (development only):

```sql
-- DEVELOPMENT ONLY - Remove these policies before production!
ALTER TABLE brand DISABLE ROW LEVEL SECURITY;
```

### Step 5: Check Database Credentials

Verify your `.env.local` file has correct Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (from Settings → General)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (from Settings → API)

**WARNING**: The service role key is sensitive! Never commit it to git. Use `.env.local` (which is in `.gitignore`)

### Step 6: Check Browser Console

Open your browser's Developer Tools and look for errors:

1. Press `F12` or right-click → "Inspect"
2. Go to "Console" tab
3. Look for red error messages
4. Common errors:
   - "Unauthorized - No token provided" → You're not logged in
   - "Unauthorized - Invalid token" → Your token expired (log in again)
   - "Database error: relation 'brand' does not exist" → Table not created (Step 2)

### Step 7: Check Server Logs

If using `npm run dev`:

1. Look at the terminal where Next.js is running
2. Search for `[API]` messages
3. Look for lines like:
   - `[API] Supabase error fetching brands:`
   - `[API] Invalid token for brand fetch`

These will show exactly what's failing.

## Common Issues and Solutions

### Issue: "Database error: relation 'brand' does not exist"

**Solution**: Create the brand table (Step 2 above)

### Issue: "Unauthorized - Invalid token"

**Solution**: 
1. Log out from `/admin/login`
2. Log in again with admin credentials
3. The token should be refreshed

### Issue: "Unauthorized - No token provided"

**Solution**:
1. You're trying to access the page without logging in
2. Go to `/admin/login` first
3. Enter admin email and password

### Issue: Page is loading forever

**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. If no errors but loading, the API might be slow
4. Wait 10+ seconds
5. If still loading, refresh page (Ctrl+R or Cmd+R)
6. If that doesn't work, check if API endpoint is responding:
   - Open Network tab in DevTools
   - Refresh page
   - Look for request to `/api/admin/brands`
   - Check if it returns 200 (success) or another status code

### Issue: Logo upload fails

**Solution**:
1. Verify R2 credentials in `.env.local`:
   - `NEXT_PUBLIC_R2_DOMAIN`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

2. Check file size (images should be < 5MB)
3. Ensure file is a valid image (PNG, JPG, WebP)

## Quick Test

Once everything is set up, test it:

### Test 1: Create a Brand

1. Go to `/admin/brands`
2. Click "Add New Brand" button
3. Fill in:
   - Brand Name: "Test Brand"
   - Description: "A test brand"
4. Click "Create Brand"
5. You should see a success message

### Test 2: Brand appears on homepage

1. Mark the brand as "Featured"
2. Go to `/`
3. You should see the brand in the featured section

### Test 3: API Endpoint

Test the API directly in your browser:

1. Go to `/api/brands` (public endpoint, no auth needed)
2. Should show: `{"brands":[...]}` with your brands

2. For admin endpoint (requires login):
   - Get your token from browser console:
     ```javascript
     localStorage.getItem('admin_token')
     ```
   - Use it to test: Open browser console and run:
     ```javascript
     fetch('/api/admin/brands', {
       headers: { Authorization: `Bearer YOUR_TOKEN_HERE` }
     }).then(r => r.json()).then(console.log)
     ```

## Need More Help?

1. Check server logs (`npm run dev` terminal)
2. Check browser console (F12 → Console tab)
3. Check Supabase dashboard for:
   - Table exists in Table Editor
   - SQL queries succeed in SQL Editor
   - Authentication status

4. Review the BRAND_MANAGEMENT.md for system overview
5. Review the IMPLEMENTATION_GUIDE.md for setup steps

Remember: The brand table MUST exist before the admin panel will work!
