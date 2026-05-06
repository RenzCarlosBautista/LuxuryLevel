<!-- Admin Panel Features -->

# LuxuryLevel Admin Panel

A comprehensive admin dashboard for managing products with advanced features including inventory management, dynamic pricing, and bulk image uploads.

## 🎯 Features Implemented

### ✅ Product Management
- **Add Products**: Create new products with detailed information
  - Brand selection
  - SKU/Reference number
  - Gender classification
  - Color specification
  - Stock quantity
  - Pricing
  - Detailed description
  
- **Edit Products**: Modify any product details
  - Update all product information
  - Replace product images
  - Change pricing and stock levels
  - Modify sale pricing and dates
  
- **Delete Products**: Remove products permanently
  - Soft delete option (set inactive)
  - Hard delete for complete removal

### ✅ Image Management
- **Multiple Image Upload** (up to 3 images per product)
  - Automatic upload to Cloudflare R2
  - Real-time preview before upload
  - Replace individual images on edit
  - Automatic image optimization

### ✅ Pricing & Sales
- **Regular Pricing**: Set base product price
- **Sale Pricing**: Create discounted prices
- **Date/Time Scheduling**: Set start and end dates for sales
  - Future-dated sales scheduling
  - Automatic price switching based on dates
  - Multiple sales can be scheduled

### ✅ Inventory Management
- **Stock Tracking**: Monitor product inventory
- **Low Stock Alerts**: Visual indicators for stock levels
  - Green: > 10 units
  - Yellow: 1-10 units
  - Red: Out of stock
- **Active/Inactive Status**: Hide products without deleting

### ✅ Search & Filter
- **Search Functionality**:
  - By product name
  - By SKU/Reference number
  - By color
  - Case-insensitive search

- **Pagination**: Navigate through products
  - 10 products per page
  - Page navigation controls
  - Total count display

### ✅ Security
- **Admin Authentication**
  - JWT-based auth tokens
  - Secure password hashing (bcrypt)
  - 24-hour token expiration
  - HTTP-only cookie storage
  
- **Route Protection**
  - Middleware guards all `/admin` routes
  - Automatic redirect to login if unauthorized
  - Token validation on every request

## 📋 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
Run the SQL migrations in your Supabase dashboard:
```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to product table
ALTER TABLE product ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP WITH TIME ZONE;
```

See [migrations/001_admin_panel.sql](migrations/001_admin_panel.sql) for complete migration script.

### 3. Configure Environment
Copy `.env.example` to `.env.local` and fill in your credentials:
```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
R2_ENDPOINT_DEFAULT_URL=your_endpoint
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your_bucket
ADMIN_JWT_SECRET=your-secret-key-min-32-chars
```

### 4. Create Admin User
```bash
npm run create-admin admin@luxurylevel.com mypassword123
```

Or manually insert into Supabase:
```javascript
// In Node.js terminal
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('mypassword', 10);
console.log(hash); // Copy and paste the hash in SQL
```

```sql
INSERT INTO admin_users (email, password_hash) 
VALUES ('admin@luxurylevel.com', 'bcrypt_hash_here');
```

### 5. Run Development Server
```bash
npm run dev
```

### 6. Access Admin Panel
- Login: `http://localhost:3000/admin/login`
- Dashboard: `http://localhost:3000/admin/dashboard`
- Products: `http://localhost:3000/admin/products`

## 📁 Project Structure

```
app/
├── admin/                              # Admin section
│   ├── login/page.tsx                 # Login page
│   ├── dashboard/page.tsx             # Dashboard overview
│   ├── products/
│   │   ├── page.tsx                   # Products list
│   │   ├── add/page.tsx               # Add product form
│   │   └── [id]/edit/page.tsx         # Edit product form
│   └── layout.tsx                     # Admin layout
├── api/
│   ├── admin/
│   │   ├── login/route.ts             # Authentication
│   │   ├── logout/route.ts            # Logout
│   │   └── products/
│   │       ├── create/route.ts        # Create product
│   │       ├── list/route.ts          # Get products
│   │       └── [id]/
│   │           ├── route.ts           # Get product
│   │           ├── update/route.ts    # Update product
│   │           └── delete/route.ts    # Delete product
│   └── brands/route.ts                # Get brands list
components/
├── admin/
│   ├── sidebar.tsx                    # Navigation sidebar
│   └── product-form.tsx               # Reusable product form
lib/
├── admin-auth.ts                      # Auth utilities
└── types.ts                           # TypeScript types
middleware.ts                          # Route protection
```

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing with salt rounds
   - Never stored in plain text
   - Verified on each login

2. **Token Security**
   - JWT tokens with HS256 algorithm
   - Expires after 24 hours
   - Stored in HTTP-only cookies
   - CSRF protected by default in Next.js

3. **Route Protection**
   - Middleware validates all `/admin` routes
   - Invalid/expired tokens redirect to login
   - No unprotected admin endpoints

4. **Data Protection**
   - Service role key used for admin operations
   - Tokens never exposed to client-side
   - Secure image uploads to R2

## 📝 API Endpoints

### Authentication
```
POST /api/admin/login
  Body: { email: string, password: string }
  Returns: { success: true }

POST /api/admin/logout
  Returns: { success: true }
```

### Products
```
GET /api/admin/products/list?page=1&limit=10&search=query
  Returns: { products: [], pagination: {...} }

POST /api/admin/products/create
  Body: FormData with product data and images
  Returns: { success: true, product: {} }

GET /api/admin/products/[id]
  Returns: { success: true, product: {} }

PUT /api/admin/products/[id]/update
  Body: FormData with updated data
  Returns: { success: true, product: {} }

DELETE /api/admin/products/[id]/delete
  Returns: { success: true }
```

## 💡 Usage Examples

### Add a New Product
1. Go to Admin Dashboard
2. Click "Products" in sidebar
3. Click "Add Product" button
4. Fill in product details
5. Upload up to 3 images
6. Click "Add Product"

### Set Up a Sale
1. Edit the product
2. Enter "Sale Price" amount
3. Set "Sale Start Date" (when sale begins)
4. Set "Sale End Date" (when sale ends)
5. Click "Update Product"
- Sale price will automatically be used during the date range

### Disable Out-of-Stock Product
1. Edit the product
2. Uncheck "Active" checkbox
3. Click "Update Product"
- Product will be hidden from store but not deleted

### Search Products
1. Go to Products page
2. Use search bar to enter:
   - Product name (e.g., "Rolex")
   - SKU (e.g., "ROL-001")
   - Color (e.g., "Gold")
3. Results appear automatically

## 🐛 Troubleshooting

### "Unauthorized" on Admin Pages
- Check if logged in (cookie present)
- Try clearing cookies and logging in again
- Verify ADMIN_JWT_SECRET is set

### Product Upload Fails
- Check R2 credentials in `.env.local`
- Verify bucket name is correct
- Check image file size (max 5MB recommended)
- Ensure image format is supported (JPEG, PNG, WebP)

### Admin User Not Found
- Verify email exists in `admin_users` table
- Check password hash was created correctly
- Try creating a new admin user with `npm run create-admin`

### Can't Find Products
- Ensure products table has required columns
- Run migration script from `migrations/001_admin_panel.sql`
- Check database connection in `.env.local`

## 📚 Documentation

- [ADMIN_SETUP.md](ADMIN_SETUP.md) - Detailed setup guide
- [ADMIN_IMPLEMENTATION.md](ADMIN_IMPLEMENTATION.md) - Implementation details
- [migrations/001_admin_panel.sql](migrations/001_admin_panel.sql) - Database migrations

## 🚀 Production Deployment

Before deploying to production:

1. **Change Admin JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Use the generated secret in your production environment

2. **Set Secure Cookies**
   - Ensure `NODE_ENV=production` in deployment
   - Update CORS settings if needed

3. **Database Security**
   - Review RLS policies
   - Ensure admin_users table has appropriate access controls
   - Use service role key only from backend

4. **SSL/HTTPS**
   - Ensure all admin routes use HTTPS in production
   - Update cookie settings to `secure: true`

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation files
3. Check environment variables are set correctly
4. Verify database migrations ran successfully
5. Check browser console for error messages

## 📄 License

This admin panel is part of the LuxuryLevel e-commerce platform.
