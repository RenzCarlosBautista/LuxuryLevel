import { chromium } from "playwright";
import { scrapeProduct } from "./scrapeProduct";
import { ScrapedProduct } from "../types/product";
import { delay } from "../utils/delay";
import { logger } from "../utils/logger";

export interface ScrapeProductUrlsOptions {
  headless: boolean;
  debug: boolean;
  concurrency: number;
  limit?: number;
}

export async function scrapeProductUrls(
  urls: string[],
  options: ScrapeProductUrlsOptions
): Promise<ScrapedProduct[]> {
  const uniqueUrls = Array.from(new Set(urls)).filter(Boolean);
  const limitedUrls = options.limit ? uniqueUrls.slice(0, options.limit) : uniqueUrls;

  if (limitedUrls.length === 0) {
    return [];
  }

  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const results: ScrapedProduct[] = [];
  await runWithConcurrency(limitedUrls, options.concurrency, async (url) => {
    const page = await context.newPage();
    const product = await scrapeProduct(page, url, { debug: options.debug });
    await page.close();
    results.push(product);
    await delay(300);
  });

  await browser.close();

  logger.info(`Scraped ${results.length} products from URL list.`);
  return results;
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
