# Product Comparison Feature Documentation

## Overview
The product comparison feature allows customers to compare multiple luxury products side-by-side with a modern, user-friendly interface.

## Features

### 1. **Comparison Context** (`contexts/ComparisonContext.tsx`)
- Manages comparison state globally
- Persists comparison data in localStorage
- Supports up to 4 products in comparison
- Methods:
  - `addToComparison(product)` - Add product to comparison
  - `removeFromComparison(productId)` - Remove product from comparison
  - `clearComparison()` - Clear all comparison products
  - `isInComparison(productId)` - Check if product is in comparison

### 2. **Comparison Modal** (`components/product-specification/comparison-modal.tsx`)
- Modal dialog for selecting products to compare
- Features:
  - Search by product name or SKU
  - Filter by category
  - Shows product images, names, and prices
  - Visual indication of selected products
  - Limit to 4 products maximum
  - Easy product selection/deselection

### 3. **Comparison Table** (`components/product-specification/comparison-table.tsx`)
- Displays selected products in a comprehensive table
- Features:
  - Side-by-side product comparison
  - Product images, names, and prices
  - All specifications extracted from product descriptions
  - Color indicators for color specifications
  - Easy removal of products from comparison
  - Link to individual product pages
  - Responsive design

### 4. **Comparison Page** (`app/compare/page.tsx`)
- Dedicated comparison view page
- Client-side rendering for dynamic comparison updates
- URL: `/compare`

### 5. **Compare Button** (`components/product-specification/compare-button.tsx`)
- Floating button on product detail pages
- Opens comparison modal when clicked
- Location: Below email inquiry button

### 6. **Comparison Badge** (`components/comparison-badge.tsx`)
- Shows number of products in comparison
- Link to comparison page
- Appears in navigation when items are added

### 7. **API Endpoint** (`app/api/products/all/route.ts`)
- Fetches all products with full details
- Returns: id, name, ref_no, color, gender, price, sale_price, images, description, brand, category
- Used by comparison modal for product selection

## User Flow

1. **User navigates to product detail page** (`/products/[id]`)
2. **Clicks "Compare with Other Products" button**
3. **Comparison Modal opens** showing:
   - Search bar (search by name/SKU)
   - Category filter
   - List of available products (excluding current product)
4. **User selects up to 4 products** to compare
5. **Clicks "View Comparison" button** or navigates to `/compare`
6. **Comparison page displays:**
   - Side-by-side table with all selected products
   - Product images, basic info, price
   - All specifications extracted from descriptions
   - Color indicators for color specs
   - Link to individual product pages
   - Ability to remove products from comparison

## Technical Implementation

### State Management
- Uses React Context API for global state
- localStorage for persistence across sessions
- Client-side only (no backend storage)

### Components Used
- Next.js Image component for optimized images
- Lucide React icons (ScaleIcon, X, Check, ArrowRight)
- Tailwind CSS for styling
- Dynamic specification extraction from product descriptions

### Responsive Design
- Mobile: Single column, scrollable table
- Tablet: Adjusted grid layout
- Desktop: Full side-by-side comparison table

## Integration Points

### Layout Integration (`app/layout.tsx`)
```tsx
<ComparisonProvider>
  {/* All app content */}
</ComparisonProvider>
```

### Product Page Integration
- Compare button added below email inquiry button
- Uses CompareButton component

### Navbar Integration (Optional)
- ComparisonBadge component can be added to navbar
- Shows count of items in comparison

## Customization

### Modify Maximum Comparison Items
In `contexts/ComparisonContext.tsx`:
```tsx
const maxComparisonItems = 4; // Change this number
```

### Styling
All components use Tailwind CSS classes that can be customized:
- Color scheme: Change from blue (primary) to preferred color
- Border radius: Adjust rounded corners
- Shadow effects: Modify shadow values

### Specification Display
In `components/product-specification/comparison-table.tsx`:
- Add/remove specification rows
- Customize specification formatting
- Add computed specifications

## Browser Support
- All modern browsers supporting:
  - ES6+ JavaScript
  - localStorage API
  - CSS Grid and Flexbox

## Performance Considerations
- Lazy loading of product images
- localStorage caching of comparison data
- Efficient context updates with proper memoization
- Optimized modal rendering

## Future Enhancements
- Export comparison to PDF
- Share comparison link
- Email comparison
- Save favorite comparisons
- Advanced filtering in modal
- Comparison history tracking
