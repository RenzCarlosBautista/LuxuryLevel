import "dotenv/config";
import { chromium } from "playwright";
import { scrapeProduct } from "../scrapers/scrapeProduct";
import { logger } from "../utils/logger";

const PRODUCT_URL = "https://luxurysouq.com/rolex-day-date-228206-blrp/";

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const page = await context.newPage();
  const product = await scrapeProduct(page, PRODUCT_URL, { debug: true });
  await page.close();
  await browser.close();

  console.log(JSON.stringify(product, null, 2));
}

main().catch((error) => {
  logger.error(`Single product scrape failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
