import { chromium, Page } from "playwright";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger";
import { retry } from "../utils/retry";
import { delay } from "../utils/delay";

export interface DiscoverBrandsOptions {
  headless: boolean;
  debug: boolean;
}

const HOME_URL = "https://luxurysouq.com/";

export async function discoverBrands(options: DiscoverBrandsOptions): Promise<string[]> {
  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const page = await context.newPage();
  const brandUrls = await retry(() => extractBrandLinks(page, options), {
    retries: 2,
    delayMs: 1000,
  });

  await browser.close();
  return brandUrls;
}

async function extractBrandLinks(page: Page, options: DiscoverBrandsOptions): Promise<string[]> {
  logger.info("Opening homepage for brand discovery...");
  await page.goto(HOME_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await delay(800);

  const urls = await page.$$eval("a[href*='/brand/']", (links) =>
    Array.from(links)
      .map((link) => (link as HTMLAnchorElement).href)
      .filter((href) => href.includes("/brand/"))
  );

  const uniqueUrls = Array.from(new Set(urls)).filter((href) =>
    href.startsWith("https://luxurysouq.com/")
  );

  const filteredUrls = uniqueUrls.filter((href) => !href.includes("/luxury-souq/"));

  if (options.debug) {
    logger.debug(`Discovered ${filteredUrls.length} brand URLs.`);
  }

  return filteredUrls;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  discoverBrands({ headless: true, debug: true })
    .then((brands) => {
      logger.info(`Brands found: ${brands.length}`);
      brands.forEach((brand) => logger.info(brand));
    })
    .catch((error) => logger.error(String(error)));
}
