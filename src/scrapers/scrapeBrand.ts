import { BrowserContext } from "playwright";
import { collectProductLinks } from "./collectProductLinks";
import { scrapeProduct } from "./scrapeProduct";
import { logger } from "../utils/logger";
import { delay } from "../utils/delay";
import { ScrapedProduct } from "../types/product";

export interface ScrapeBrandOptions {
  debug: boolean;
  limit?: number;
  concurrency: number;
  brandFilter?: string;
}

export async function scrapeBrand(
  context: BrowserContext,
  brandUrl: string,
  options: ScrapeBrandOptions
): Promise<ScrapedProduct[]> {
  const page = await context.newPage();
  const links = await collectProductLinks(page, brandUrl, {
    debug: options.debug,
    limit: options.limit,
  });
  await page.close();

  const filteredLinks = options.brandFilter
    ? links.filter((link) => matchBrandFilter(link, options.brandFilter as string))
    : links;
  const limitedLinks = options.limit ? filteredLinks.slice(0, options.limit) : filteredLinks;

  logger.info(`Scraping ${limitedLinks.length} products for ${brandUrl}`);

  const results: ScrapedProduct[] = [];
  await runWithConcurrency(limitedLinks, options.concurrency, async (link) => {
    const productPage = await context.newPage();
    const product = await scrapeProduct(productPage, link, { debug: options.debug });
    await productPage.close();
    results.push(product);
    await delay(300);
  });

  return results;
}

function matchBrandFilter(url: string, brandFilter: string): boolean {
  const needle = brandFilter.toLowerCase();
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes(`/${needle}-`) || lowerUrl.includes(`-${needle}-`)) {
    return true;
  }
  return lowerUrl.includes(`/${needle}`);
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) {
        return;
      }
      await worker(next);
    }
  });

  await Promise.all(workers);
}
