/**
 * Web Scraper for luxurysouq.com
 * Fetches product data from reference website
 */

import puppeteer, { Browser } from 'puppeteer';
import { ReferenceProductData, ProductCategory, REFERENCE_URLS } from './types';

export class LuxurySouqScraper {
  private browser: Browser | null = null;

  /**
   * Initialize browser instance
   */
  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Reduce memory usage
        ],
      });
      console.log('[Scraper] Browser initialized');
    } catch (error) {
      console.error('[Scraper] Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Close browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[Scraper] Browser closed');
    }
  }

  /**
   * Scrape products from a specific category
   */
  async scrapeCategory(category: ProductCategory): Promise<ReferenceProductData[]> {
    if (!this.browser) {
      await this.initialize();
    }

    const url = REFERENCE_URLS[category];
    console.log(`[Scraper] Starting to scrape ${category} from ${url}`);

    try {
      const page = await this.browser!.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate with timeout
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for product listings to load
      await page.waitForSelector('[data-product]', { timeout: 10000 }).catch(() => {
        console.log(`[Scraper] No [data-product] found, trying alternative selector`);
      });

      // Extract product data using Puppeteer's evaluate
      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('[data-product], .product-item, .product-card, li[data-id]');
        const results: any[] = [];

        productElements.forEach((el) => {
          try {
            const product = {
              name: el.querySelector('h2, .product-name, .title')?.textContent?.trim() || '',
              price: parseFloat(
                el.querySelector('.price, [data-price], .product-price')?.textContent?.replace(/[^\d.]/g, '') || '0'
              ),
              currency: 'AED',
              description: el.querySelector('.description, .product-desc, p')?.textContent?.trim() || '',
              image_url: (el.querySelector('img')?.getAttribute('src') ||
                el.querySelector('img')?.getAttribute('data-src')) as string,
              brand: el.querySelector('.brand, [data-brand]')?.textContent?.trim() || 'Unknown',
              color: el.querySelector('.color, [data-color]')?.textContent?.trim() || '',
              gender: el.querySelector('.gender, [data-gender]')?.textContent?.trim() || '',
              sku: el.querySelector('.sku, [data-sku]')?.textContent?.trim() || '',
            };

            // Only include products with valid name and price
            if (product.name && product.price > 0) {
              results.push(product);
            }
          } catch (error) {
            console.error('Error extracting product:', error);
          }
        });

        return results;
      });

      console.log(`[Scraper] Found ${products.length} products in ${category}`);
      
      // Enhance with full reference source URL
      const enrichedProducts: ReferenceProductData[] = products.map((p) => ({
        ...p,
        reference_source: url,
      }));

      // Handle pagination if needed
      let hasNextPage = await page.evaluate(() => {
        const nextBtn = document.querySelector('a[rel="next"], .pagination .next, [aria-label="Next"]');
        return nextBtn && !nextBtn.getAttribute('disabled');
      });

      let pageNum = 1;
      while (hasNextPage && pageNum < 5) {
        // Limit to 5 pages per category
        pageNum++;
        
        await page.click('a[rel="next"], .pagination .next, [aria-label="Next"]').catch(() => {
          hasNextPage = false;
        });
        
        if (hasNextPage) {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
            hasNextPage = false;
          });

          const pageProducts = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-product], .product-item, .product-card, li[data-id]');
            return Array.from(elements).map((el) => ({
              name: el.querySelector('h2, .product-name, .title')?.textContent?.trim() || '',
              price: parseFloat(
                el.querySelector('.price, [data-price], .product-price')?.textContent?.replace(/[^\d.]/g, '') || '0'
              ),
              currency: 'AED',
              description: el.querySelector('.description, .product-desc, p')?.textContent?.trim() || '',
              image_url: (el.querySelector('img')?.getAttribute('src') ||
                el.querySelector('img')?.getAttribute('data-src')) as string,
              brand: el.querySelector('.brand, [data-brand]')?.textContent?.trim() || 'Unknown',
              color: el.querySelector('.color, [data-color]')?.textContent?.trim() || '',
              gender: el.querySelector('.gender, [data-gender]')?.textContent?.trim() || '',
              sku: el.querySelector('.sku, [data-sku]')?.textContent?.trim() || '',
            })).filter((p) => p.name && p.price > 0);
          });

          enrichedProducts.push(...pageProducts.map((p) => ({ ...p, reference_source: url })));
          console.log(`[Scraper] Page ${pageNum}: Found ${pageProducts.length} products`);
        }
      }

      await page.close();
      return enrichedProducts;
    } catch (error) {
      console.error(`[Scraper] Error scraping ${category}:`, error);
      return [];
    }
  }

  /**
   * Scrape all categories
   */
  async scrapeAll(): Promise<Map<ProductCategory, ReferenceProductData[]>> {
    const categories: ProductCategory[] = [
      'bags',
      'watches',
      'cufflinks',
      'bracelet',
      'diamond_rings',
      'bridal_jewelries',
    ];

    const results = new Map<ProductCategory, ReferenceProductData[]>();

    for (const category of categories) {
      try {
        const products = await this.scrapeCategory(category);
        results.set(category, products);
      } catch (error) {
        console.error(`[Scraper] Failed to scrape ${category}:`, error);
        results.set(category, []);
      }
    }

    return results;
  }
}

// Export singleton instance
export const scraper = new LuxurySouqScraper();
