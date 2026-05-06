#!/bin/bash
# Setup script for Staging to Production workflow
# Run: bash scripts/setup-staging.sh

set -e

echo "🚀 Setting up Staging to Production Workflow..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install puppeteer @supabase/supabase-js dotenv --save-dev

echo "✓ Dependencies installed"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo ""
    echo "⚠️  .env.local not found. Please create it with:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Execute migrations in Supabase SQL Editor:"
echo "   - migrations/002_staging_products.sql"
echo "   - migrations/002_staging_rpc_functions.sql"
echo ""
echo "2. Run the scraper:"
echo "   npx ts-node scripts/scrape-luxurysouq.ts"
echo ""
echo "3. Access admin dashboard:"
echo "   http://localhost:3000/admin/staging"
echo ""
echo "📖 For detailed docs, see STAGING_TO_PRODUCTION.md"
