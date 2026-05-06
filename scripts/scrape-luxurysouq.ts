/**
 * Web Scraper Script - LuxurySouq.com
 * Targets: Watches, Jewelry, Bags
 * Excludes: Fragrances, Perfumes
 * 
 * Run: npm run scrape:luxurysouq
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Scraper configuration
const SCRAPE_CONFIG = {
  targetUrls: [
    'https://luxurysouq.com/watches/',
    'https://luxurysouq.com/jewelry/',
    'https://luxurysouq.com/bags/',
  ],
  excludeKeywords: ['fragrance', 'perfume', 'cologne', 'eau de'],
  timeout: 30000,
  headless: true,
  maxProducts: 100, // Limit per category
};

// Selectors for WooCommerce theme
const SELECTORS = {
  productCard: 'li.product, li.woo-product-item',
  productName: 'h2.woocommerce-loop-product__title, .product-title, h3.product-name',
  productPrice: '.woocommerce-Price-amount, .price, .product-price',
  productLink: 'a.woocommerce-LoopProduct-link, a.product-url',
  pagination: 'a.next.page-numbers, a[rel="next"]',
};

interface ScrapedProduct {
  scraped_ref_no: string;
  scraped_name: string;
  scraped_price: number | null;
  raw_brand_name: string;
  raw_category_name: string;
}

class LuxurySouqScraper {
  private browser: Browser | null = null;
  private scrapedProducts: ScrapedProduct[] = [];
  private processedRefs: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: SCRAPE_CONFIG.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      console.log('✓ Puppeteer browser initialized');
    } catch (error) {
      console.error('✗ Failed to initialize browser:', error);
      throw error;
    }
  }

  private isExcluded(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SCRAPE_CONFIG.excludeKeywords.some(keyword => lowerText.includes(keyword));
  }

  private extractPrice(priceText: string): number | null {
    try {
      // Remove currency symbols and extract numbers
      const match = priceText.match(/[\d,]+\.?\d*/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ''));
      }
    } catch (error) {
      console.warn('Price extraction failed:', priceText);
    }
    return null;
  }

  private generateRef(name: string, brand: string): string {
    // Generate reference number from name and brand
    const timestamp = Date.now().toString().slice(-6);
    const nameSlug = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const brandSlug = brand.substring(0, 2).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${brandSlug}${nameSlug}${timestamp}`;
  }

  private extractBrandFromName(productName: string): string {
    // Common luxury brands - expand as needed
    const knownBrands = [
      'Rolex', 'Omega', 'Cartier', 'Patek Philippe', 'Hublot', 'Tag Heuer',
      'Breitling', 'Panerai', 'IWC', 'Longines', 'Tissot', 'Seiko',
      'Burberry', 'Gucci', 'Louis Vuitton', 'Prada', 'Hermès', 'Chanel',
      'Dior', 'Fendi', 'Celine', 'Bottega Veneta', 'Saint Laurent',
      'Tiffany', 'Van Cleef & Arpels', 'Bvlgari', 'Chopard', 'Graff',
    ];

    for (const brand of knownBrands) {
      if (productName.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Fallback: use first 2 words as brand
    return productName.split(' ').slice(0, 2).join(' ');
  }

  async scrapePage(page: Page, url: string, category: string): Promise<void> {
    try {
      console.log(`\n📍 Scraping: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: SCRAPE_CONFIG.timeout });

      // Wait for products to load
      await page.waitForSelector(SELECTORS.productCard, { timeout: 5000 }).catch(() => {
        console.warn('⚠ Product cards not found, retrying...');
      });

      // Extract products
      const products = await page.evaluate((selectors, categoryName, config) => {
        const items: ScrapedProduct[] = [];
        const productElements = document.querySelectorAll(selectors.productCard);

        productElements.forEach((el) => {
          try {
            const nameEl = el.querySelector(selectors.productName);
            const priceEl = el.querySelector(selectors.productPrice);
            const linkEl = el.querySelector(selectors.productLink) as HTMLAnchorElement;

            const name = nameEl?.textContent?.trim() || '';
            const priceText = priceEl?.textContent?.trim() || '';
            const productUrl = linkEl?.href || '';

            if (!name || config.excludeKeywords.some(kw => name.toLowerCase().includes(kw))) {
              return;
            }

            items.push({
              scraped_ref_no: productUrl.split('/').filter(Boolean).pop() || name.slice(0, 20),
              scraped_name: name,
              scraped_price: priceText ? parseFloat(priceText.replace(/[^\d.]/g, '')) : null,
              raw_brand_name: '', // Will be extracted in main function
              raw_category_name: categoryName,
            });
          } catch (error) {
            console.warn('Error parsing product element:', error);
          }
        });

        return items;
      }, SELECTORS, category, SCRAPE_CONFIG);

      // Extract brand names and filter
      products.forEach((product) => {
        if (!this.isExcluded(product.scraped_name)) {
          product.raw_brand_name = this.extractBrandFromName(product.scraped_name);
          this.scrapedProducts.push(product);
        }
      });

      console.log(`✓ Found ${products.length} products on this page`);

      // Handle pagination (simple: just follow next link once)
      const nextButton = await page.$(SELECTORS.pagination);
      if (nextButton && this.scrapedProducts.length < SCRAPE_CONFIG.maxProducts) {
        const nextUrl = await page.evaluate(
          (selector) => document.querySelector(selector)?.getAttribute('href'),
          SELECTORS.pagination
        );
        if (nextUrl && !nextUrl.includes('/page/')) {
          // Avoid infinite loops
          await this.scrapePage(page, nextUrl, category);
        }
      }
    } catch (error) {
      console.error(`✗ Error scraping ${url}:`, error);
    }
  }

  async scrapeAll(): Promise<ScrapedProduct[]> {
    try {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();

      // Set user agent to mimic real browser
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      for (const url of SCRAPE_CONFIG.targetUrls) {
        const category = url.split('/').filter(Boolean).pop() || 'uncategorized';
        await this.scrapePage(page, url, category.charAt(0).toUpperCase() + category.slice(1));
      }

      await page.close();
      return this.scrapedProducts;
    } catch (error) {
      console.error('✗ Scraping failed:', error);
      throw error;
    }
  }

  async insertIntoStaging(products: ScrapedProduct[]): Promise<void> {
    if (products.length === 0) {
      console.log('ℹ No products to insert');
      return;
    }

    try {
      // Filter duplicates
      const uniqueProducts = products.filter((product) => {
        if (this.processedRefs.has(product.scraped_ref_no)) {
          return false;
        }
        this.processedRefs.add(product.scraped_ref_no);
        return true;
      });

      console.log(`  Inserting ${uniqueProducts.length} unique products...`);

      const { data, error } = await supabase
        .from('staging_products')
        .insert(
          uniqueProducts.map((p) => ({
            ...p,
            sync_status: 'pending',
            scraped_at: new Date().toISOString(),
          }))
        )
        .select();

      if (error) {
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.error('✗ Error: staging_products table not found in database');
          console.error('  Fix: Run the migrations in Supabase SQL Editor:');
          console.error('    1. migrations/002_staging_products.sql');
          console.error('    2. migrations/002_staging_rpc_functions.sql');
        } else {
          console.error('✗ Error inserting into staging:', error.message || error);
        }
        throw error;
      }

      console.log(`✓ Inserted ${data?.length || 0} products into staging table`);
    } catch (error: any) {
      console.error('✗ Staging insert failed:', error.message || error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('✓ Browser closed');
    }
  }
}

async function main() {
  const scraper = new LuxurySouqScraper();

  try {
    console.log('🚀 Starting LuxurySouq Scraper\n');
    await scraper.initialize();

    const products = await scraper.scrapeAll();
    console.log(`\n📊 Total products scraped: ${products.length}`);

    if (products.length > 0) {
      console.log('\n💾 Inserting into staging table...');
      await scraper.insertIntoStaging(products);
      console.log('\n✅ Scraping completed successfully!');
    } else {
      console.log('\n⚠️  No products were scraped');
      console.log('   This could mean:');
      console.log('   - Website structure has changed');
      console.log('   - DOM selectors need updating');
      console.log('   - Network issue accessing website');
    }
  } catch (error: any) {
    console.error('\n❌ Scraper Error:');
    if (error.message) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${JSON.stringify(error)}`);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('   2. Verify staging_products table exists in Supabase');
    console.error('   3. Check internet connection and website is accessible');
    process.exit(1);
  } finally {
    await scraper.cleanup();
  }
}

main();
