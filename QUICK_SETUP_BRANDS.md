# ⚡ Quick Setup: Brand Management

## Prerequisites

✅ Admin account created at `/admin/login`
✅ Logged into Supabase dashboard

## Step-by-Step Setup

### 1️⃣ Create the Brand Table (5 minutes)

Go to [Supabase Dashboard](https://app.supabase.com) → Select your project → **SQL Editor** → Click **New Query**

Copy and paste this SQL:

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

-- Create indexes
CREATE INDEX IF NOT EXISTS brand_parent_id_idx ON brand(parent_id);
CREATE INDEX IF NOT EXISTS brand_featured_idx ON brand(featured);
CREATE INDEX IF NOT EXISTS brand_name_idx ON brand(name);

-- Enable security
ALTER TABLE brand ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Enable read access for all users" ON brand FOR SELECT USING (true);

-- Allow authenticated write
CREATE POLICY "Enable write access for authenticated users" ON brand 
  FOR INSERT, UPDATE, DELETE USING (auth.role() = 'authenticated');
```

Click **Run** ✓

### 2️⃣ Verify the Table Exists

In Supabase Dashboard → **Table Editor** → Look for "brand" table in sidebar

You should see 8 columns: `id`, `name`, `description`, `logo_url`, `parent_id`, `featured`, `created_at`, `updated_at`

### 3️⃣ If RLS Issues

**Development Only** - If you get errors, disable RLS:

Go to Supabase → **SQL Editor** → New Query:

```sql
-- DEVELOPMENT ONLY - Remove before production!
ALTER TABLE brand DISABLE ROW LEVEL SECURITY;
```

Click **Run** ✓

### 4️⃣ Test Your Setup

1. Go to your app → `/admin/login`
2. Login with your admin account
3. Go to `/admin/brands`
4. Click "Add New Brand"
5. Create a test brand

**Success** = You should see the brand in the list! 🎉

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch brands" | Run SQL from Step 1 in Supabase |
| "You are not authenticated" | Go to `/admin/login` first |
| Page loads forever | Check browser console (F12) for errors |
| Logo upload fails | Verify R2 credentials in `.env.local` |

For detailed help → See `BRAND_SETUP_TROUBLESHOOTING.md`

## What's Next?

1. ✅ Create your luxury brands
2. ✅ Upload brand logos
3. ✅ Mark top brands as "Featured"
4. ✅ Check homepage to see featured brands displayed
5. ✅ Link products to brands

Done! 🚀
