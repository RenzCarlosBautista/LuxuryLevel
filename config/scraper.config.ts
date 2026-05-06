/**
 * Scraper Configuration File
 * Customize target URLs, filters, and extraction rules here
 */

export const SCRAPER_CONFIG = {
  // Target URLs to scrape
  targetUrls: [
    'https://luxurysouq.com/watches/',
    'https://luxurysouq.com/jewelry/',
    'https://luxurysouq.com/bags/',
    // Add more categories as needed:
    // 'https://luxurysouq.com/shoes/',
    // 'https://luxurysouq.com/accessories/',
  ],

  // Keywords to exclude from scraping
  excludeKeywords: [
    'fragrance',
    'perfume',
    'cologne',
    'eau de',
    'scent',
    'fragrant',
    'aromatic',
  ],

  // Puppeteer launch options
  puppeteerOptions: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 30000,
  },

  // DOM selector configuration (supports multiple selectors for resilience)
  selectors: {
    productCard: 'li.product, li.woo-product-item, .product-item',
    productName:
      'h2.woocommerce-loop-product__title, .product-title, h3.product-name, .product-name',
    productPrice: '.woocommerce-Price-amount, .price, .product-price, .woo-price',
    productLink: 'a.woocommerce-LoopProduct-link, a.product-url, a.product-link',
    pagination: 'a.next.page-numbers, a[rel="next"]',
  },

  // Brand extraction configuration
  brandConfig: {
    // List of known brands for quick extraction
    knownBrands: [
      // Watches
      'Rolex',
      'Omega',
      'Patek Philippe',
      'Hublot',
      'Tag Heuer',
      'Breitling',
      'Panerai',
      'IWC',
      'Longines',
      'Tissot',
      'Seiko',
      'Grand Seiko',
      'Chopard',
      'Cartier',
      // Jewelry
      'Tiffany & Co',
      'Van Cleef & Arpels',
      'Bvlgari',
      'Graff',
      'Harry Winston',
      'Messika',
      'Piaget',
      // Bags
      'Louis Vuitton',
      'Hermès',
      'Gucci',
      'Prada',
      'Burberry',
      'Chanel',
      'Dior',
      'Fendi',
      'Celine',
      'Bottega Veneta',
      'Saint Laurent',
      'Balenciaga',
      'Givenchy',
      'Loewe',
    ],
    // Fallback: if brand not found, use first N words
    fallbackWords: 2,
  },

  // Scraping behavior
  scraping: {
    maxProductsPerCategory: 100,
    pageLoadWaitTime: 'networkidle2', // 'networkidle0', 'networkidle2', 'domcontentloaded'
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    followPagination: true,
    maxPagesToFollow: 3, // Prevent infinite loops
  },

  // Price extraction
  priceConfig: {
    currencySymbols: ['AED', 'USD', 'EUR', '€', '$', '؋'],
    decimalPlaces: 2,
  },

  // Logging
  logging: {
    verbose: true,
    saveScraperLog: true,
    logFile: 'logs/scraper.log',
  },

  // Database
  database: {
    stagingTable: 'staging_products',
    productTable: 'product',
    logTable: 'product_sync_log',
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
  },
};

export type ScraperConfig = typeof SCRAPER_CONFIG;
