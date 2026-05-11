import { chromium, Page } from "playwright";
import { logger } from "../utils/logger";
import { delay } from "../utils/delay";
import { retry } from "../utils/retry";

export interface DiscoverCategoryOptions {
  headless: boolean;
  debug: boolean;
  category: string;
}

const CATEGORY_URLS: Record<string, string> = {
  watches: "https://luxurysouq.com/watches/",
  jewelry: "https://luxurysouq.com/jewellery/",
  jewellery: "https://luxurysouq.com/jewellery/",
  bags: "https://luxurysouq.com/bags/",
};

const JEWELRY_MENU_URL = "https://luxurysouq.com/staticblocks/jewelry-category-menu/";
const JEWELLERY_LIST_URL = "https://luxurysouq.com/jewellery/";
const JEWELRY_FALLBACK_URLS = [
  "https://luxurysouq.com/bracelet/",
  "https://luxurysouq.com/cufflinks/",
  "https://luxurysouq.com/ls-diamond-rings/",
  "https://luxurysouq.com/ls-bridal-jewelries/",
];
const JEWELRY_ALLOWED_PATHS = new Set([
  "/bracelet/",
  "/cufflinks/",
  "/ls-diamond-rings/",
  "/ls-bridal-jewelries/",
]);

export async function discoverCategoryUrls(options: DiscoverCategoryOptions): Promise<string[]> {
  const normalized = options.category.toLowerCase();
  if (!CATEGORY_URLS[normalized]) {
    logger.warn(`Unknown category: ${options.category}`);
    return [];
  }

  if (normalized === "jewelry" || normalized === "jewellery") {
    return discoverJewelrySubcategories(options);
  }

  return [CATEGORY_URLS[normalized]];
}

async function discoverJewelrySubcategories(options: DiscoverCategoryOptions): Promise<string[]> {
  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const page = await context.newPage();
  const urls = await retry(() => extractJewelryLinks(page, options), {
    retries: 2,
    delayMs: 1000,
  });

  await browser.close();
  return urls;
}

async function extractJewelryLinks(page: Page, options: DiscoverCategoryOptions): Promise<string[]> {
  logger.info("Opening jewelry category menu...");
  await page.goto(JEWELRY_MENU_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await delay(500);

  const unique = await collectCategoryLinks(page);

  if (unique.length === 0) {
    logger.warn("No links found in jewelry menu. Falling back to /jewellery/ page.");
    await page.goto(JEWELLERY_LIST_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await delay(500);
    const fallbackLinks = await collectCategoryLinks(page);
    const filteredFallback = filterJewelryLinks(fallbackLinks);
    if (filteredFallback.length > 0) {
      return filteredFallback;
    }
    logger.warn("No jewelry sub-category links found on /jewellery/. Using known jewelry sub-categories.");
    return JEWELRY_FALLBACK_URLS;
  }

  const filtered = filterJewelryLinks(unique);
  if (filtered.length > 0) {
    if (options.debug) {
      logger.debug(`Discovered ${filtered.length} jewelry sub-categories.`);
    }
    return filtered;
  }

  if (options.debug) {
    logger.debug(`Discovered ${unique.length} jewelry sub-categories.`);
  }

  return JEWELRY_FALLBACK_URLS;
}

function filterJewelryLinks(urls: string[]): string[] {
  const normalized = urls.map((url) => normalizeUrl(url));
  return Array.from(new Set(normalized)).filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === "luxurysouq.com" && JEWELRY_ALLOWED_PATHS.has(parsed.pathname);
    } catch {
      return false;
    }
  });
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

async function collectCategoryLinks(page: Page): Promise<string[]> {
  const urls = await page
    .$$eval("a[href]", (links) =>
      Array.from(links)
        .map((link) => (link as HTMLAnchorElement).href)
        .filter((href) => href.startsWith("https://luxurysouq.com/"))
    )
    .catch(() => [] as string[]);

  const excludedFragments = [
    "/brand/",
    "/product-category/",
    "/product-tag/",
    "/page/",
    "/cart",
    "/checkout",
    "/my-account",
    "/account",
    "/wishlist",
    "/luxury-souq/",
  ];

  return Array.from(new Set(urls)).filter(
    (href) => !excludedFragments.some((fragment) => href.includes(fragment))
  );
}
