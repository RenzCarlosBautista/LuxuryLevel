import { chromium } from "playwright";
import cliProgress from "cli-progress";
import { discoverBrands } from "./discoverBrands";
import { discoverCategoryUrls } from "./discoverCategories";
import { scrapeBrand } from "./scrapeBrand";
import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";

export interface ScrapeAllOptions {
  brandFilter?: string;
  categoryFilter?: string;
  limit?: number;
  headless: boolean;
  debug: boolean;
  concurrency: number;
}

export interface ScrapeAllResult {
  products: ScrapedProduct[];
  totalBrands: number;
}

export async function scrapeAll(options: ScrapeAllOptions): Promise<ScrapeAllResult> {
  const sources = options.categoryFilter
    ? await discoverCategoryUrls({
        headless: options.headless,
        debug: options.debug,
        category: options.categoryFilter,
      })
    : await discoverBrands({ headless: options.headless, debug: options.debug });
  const filteredSources = options.categoryFilter
    ? sources
    : filterBrands(sources, options.brandFilter);

  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const progress = new cliProgress.SingleBar({
    format: "[SCRAPED] {bar} {value}/{total} {brand}",
  });

  const products: ScrapedProduct[] = [];
  let totalScraped = 0;

  progress.start(filteredSources.length || 1, 0, { brand: "" });

  for (const [index, brandUrl] of filteredSources.entries()) {
    if (options.limit && totalScraped >= options.limit) {
      break;
    }

    const remaining = options.limit ? options.limit - totalScraped : undefined;
    const brandProducts = await scrapeBrand(context, brandUrl, {
      debug: options.debug,
      limit: remaining,
      concurrency: options.concurrency,
      brandFilter: options.categoryFilter ? options.brandFilter : undefined,
    });

    products.push(...brandProducts);
    totalScraped += brandProducts.length;

    progress.update(index + 1, { brand: brandUrl });
    logger.scraped(`Total products scraped so far: ${totalScraped}`);
  }

  progress.stop();
  await browser.close();

  logger.info(`Scraped ${products.length} products across ${filteredSources.length} sources.`);

  return { products, totalBrands: filteredSources.length };
}

function filterBrands(brands: string[], brandFilter?: string): string[] {
  if (!brandFilter) {
    return brands;
  }

  const filterLower = brandFilter.toLowerCase();
  return brands.filter((brand) => brand.toLowerCase().includes(filterLower));
}
