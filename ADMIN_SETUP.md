# Admin Panel Setup Guide

## Overview
This admin panel provides comprehensive product management features including:
- Add new products with multiple images
- Edit existing products (details, photos, pricing)
- Set sales prices with custom date/time
- Disable/archive products
- Delete products
- Search and filter products

## Prerequisites

1. **Dependencies Installation**
```bash
npm install
# or
yarn install
```

The following packages have been added:
- `jose` - JWT token handling
- `bcrypt` - Password hashing

2. **Database Setup**

You need to create the following table in your Supabase database:

```sql
-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add new columns to product table (if not already present)
ALTER TABLE product ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP;
```

3. **Create Admin User**

You can create an admin user using the Supabase dashboard or by running this script:

```sql
-- Insert admin user (password: admin123, hashed with bcrypt)
INSERT INTO admin_users (email, password_hash) VALUES (
  'admin@luxurylevel.com',
  '$2b$10$YourHashedPasswordHere'
);
```

To generate a bcrypt hash for a password, you can use Node.js:
```javascript
const bcrypt = require('bcrypt');
const password = 'your-password';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Existing Supabase vars
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Existing R2/Cloudflare vars
R2_ENDPOINT_DEFAULT_URL=your_r2_endpoint
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name

# NEW: Admin JWT Secret (generate a strong random string)
ADMIN_JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-this

# Node environment
NODE_ENV=production
```

**Important:** Change the `ADMIN_JWT_SECRET` to a strong, random string of at least 32 characters.

## Login

1. Navigate to `/admin/login`
2. Enter your admin email and password
3. You'll be redirected to the dashboard upon successful login

**Default Demo Credentials:**
- Email: `admin@luxurylevel.com`
- Password: `admin123` (change after first login)

## Features

### 1. Add New Product
- Navigate to Admin Dashboard → Products → Add Product
- Fill in required fields:
  - Product Name
  - SKU/Ref No.
  - Gender (Men/Women/Unisex)
  - Color
  - Description
  - Brand
  - Stock
  - Price
  - Upload up to 3 product images (automatically uploaded to Cloudflare R2)

### 2. Edit Product
- Navigate to Admin Products list
- Click the edit icon on any product
- Modify any field including:
  - Basic details
  - Pricing
  - Stock
  - Active/Inactive status
  - Sale price with date ranges
  - Product images

### 3. Manage Stock & Status
- View stock level in the products list
- Set `Active` checkbox to disable products
- Low stock items are highlighted in yellow/red

### 4. Sales Pricing
- Set a `Sale Price` different from regular price
- Set `Sale Start Date` and `Sale End Date`
- Schedule sales in advance

### 5. Delete Products
- Click the delete icon on any product
- Confirm deletion (this action cannot be undone)

### 6. Search Products
- Use the search bar to find products by:
  - Product name
  - SKU/Ref number
  - Color

## Security

- All admin routes are protected by JWT middleware
- Tokens are stored securely in HTTP-only cookies
- Token expiration: 24 hours
- Admins are automatically logged out when token expires
- All API endpoints verify admin authentication

## Database Columns Reference

The `product` table now includes:

| Column | Type | Description |
|--------|------|-------------|
| is_active | BOOLEAN | Whether product is visible/available |
| sale_price | DECIMAL | Discounted price (optional) |
| sale_start_date | TIMESTAMP | When sale pricing begins |
| sale_end_date | TIMESTAMP | When sale pricing ends |

## API Endpoints

### Authentication
- `POST /api/admin/login` - Login with email/password
- `POST /api/admin/logout` - Logout

### Products
- `GET /api/admin/products/list` - Get all products (paginated)
- `POST /api/admin/products/create` - Create new product
- `GET /api/admin/products/[id]` - Get single product
- `PUT /api/admin/products/[id]/update` - Update product
- `DELETE /api/admin/products/[id]/delete` - Delete product

## Troubleshooting

### "Unauthorized" error
- Check if you're logged in
- Verify the token in your cookies (browser dev tools)
- Token may have expired; try logging in again

### Image upload fails
- Check R2 credentials
- Ensure bucket exists
- Verify file size (keep under 5MB)

### Admin user not found
- Verify admin user exists in Supabase `admin_users` table
- Check email spelling
- Verify password hash is correct

## Next Steps

1. Create your first admin user
2. Log in to `/admin/login`
3. Go to `/admin/dashboard` to see overview
4. Start managing products at `/admin/products`
