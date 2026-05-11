import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";
import { saveReport } from "./jsonStorage";
import { DbProductSummary, loadDbProductSummaries } from "./dbCompare";
import { collectListingProducts, ListingProduct } from "../scrapers/collectListingProducts";
import { scrapeProductUrls } from "../scrapers/scrapeProductUrls";
import { chromium } from "playwright";

export interface ReferenceSiteCompareOptions {
  headless: boolean;
  debug: boolean;
  concurrency: number;
  limit?: number;
  categories?: string[];
}

export interface ReferenceSiteCompareResult {
  referenceListings: ListingProduct[];
  dbProducts: DbProductSummary[];
  missingListings: ListingProduct[];
  missingInDb: ScrapedProduct[];
  inBoth: DbProductSummary[];
  onlyInDb: DbProductSummary[];
}

export async function compareDatabaseToReferenceSite(
  options: ReferenceSiteCompareOptions
): Promise<ReferenceSiteCompareResult> {
  const categories = options.categories && options.categories.length > 0
    ? options.categories
    : ["watches", "jewelry", "bags"];

  const referenceListings = await scrapeReferenceSite(categories, options);
  await saveReport("reference-listings.partial.json", referenceListings);
  const dbProducts = await loadDbProductSummaries();
  await saveReport("db-products.partial.json", dbProducts);

  const dbRefs = new Set(
    dbProducts
      .map((product) => product.normalized_ref_no)
      .filter((ref): ref is string => Boolean(ref))
  );

  const dbNameKeys = new Set(
    dbProducts
      .map((product) => normalizeNameKey(product.name))
      .filter((key): key is string => Boolean(key))
  );

  const referenceRefs = new Set(
    referenceListings
      .map((product) => product.normalized_ref_no)
      .filter((ref): ref is string => Boolean(ref))
  );

  const referenceNameKeys = new Set(
    referenceListings
      .map((product) => normalizeNameKey(product.scraped_name))
      .filter((key): key is string => Boolean(key))
  );

  const missingListings = referenceListings.filter((product) => {
    if (!product.normalized_ref_no) {
      return false;
    }
    if (dbRefs.has(product.normalized_ref_no)) {
      return false;
    }
    const nameKey = normalizeNameKey(product.scraped_name);
    if (nameKey && dbNameKeys.has(nameKey)) {
      return false;
    }
    return true;
  });
  await saveReport("missing-in-db-listings.partial.json", missingListings);

  const onlyInDb = dbProducts.filter((product) => {
    if (!matchesCategoryFilter(product.category_name, categories)) {
      return false;
    }
    const nameKey = normalizeNameKey(product.name);
    if (product.normalized_ref_no) {
      if (referenceRefs.has(product.normalized_ref_no)) {
        return false;
      }
      if (nameKey && referenceNameKeys.has(nameKey)) {
        return false;
      }
      return true;
    }

    if (nameKey && referenceNameKeys.has(nameKey)) {
      return false;
    }

    return Boolean(nameKey);
  });

  const missingUrls = missingListings.map((product) => product.product_url);
  const missingInDb = await scrapeProductUrls(missingUrls, {
    headless: options.headless,
    debug: options.debug,
    concurrency: options.concurrency,
    limit: options.limit,
  });

  const inBoth = dbProducts.filter((product) => {
    if (!matchesCategoryFilter(product.category_name, categories)) {
      return false;
    }
    const nameKey = normalizeNameKey(product.name);
    if (product.normalized_ref_no && referenceRefs.has(product.normalized_ref_no)) {
      return true;
    }
    return Boolean(nameKey && referenceNameKeys.has(nameKey));
  });

  await saveReport("reference-listings.json", referenceListings);
  await saveReport("db-products.json", dbProducts);
  await saveReport("missing-in-db-listings.json", missingListings);
  await saveReport("missing-in-db.json", missingInDb);
  await saveReport("in-both.json", inBoth);
  await saveReport("only-in-db.json", onlyInDb);
  await saveReport("reference-compare-summary.json", {
    reference_count: referenceListings.length,
    db_count: dbProducts.length,
    missing_in_db: missingListings.length,
    missing_in_db_scraped: missingInDb.length,
    in_both: inBoth.length,
    only_in_db: onlyInDb.length,
    generated_at: new Date().toISOString(),
  });

  logger.report(
    `Reference comparison complete. Reference: ${referenceListings.length}, DB: ${dbProducts.length}, Missing: ${missingListings.length}, Only in DB: ${onlyInDb.length}`
  );

  return { referenceListings, dbProducts, missingListings, missingInDb, inBoth, onlyInDb };
}

async function scrapeReferenceSite(
  categories: string[],
  options: ReferenceSiteCompareOptions
): Promise<ListingProduct[]> {
  const allProducts: ListingProduct[] = [];
  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  for (const category of categories) {
    logger.info(`Scraping reference listings for category: ${category}`);
    const page = await context.newPage();
    const listings = await collectListingProducts(page, getCategoryUrl(category), {
      debug: options.debug,
      limit: options.limit,
      category,
    });
    await page.close();
    allProducts.push(...listings);
  }

  await browser.close();

  return dedupeProducts(allProducts);
}

function dedupeProducts(products: ListingProduct[]): ListingProduct[] {
  const seenRefs = new Set<string>();
  const seenUrls = new Set<string>();
  const unique: ListingProduct[] = [];

  for (const product of products) {
    if (product.normalized_ref_no && seenRefs.has(product.normalized_ref_no)) {
      continue;
    }

    if (product.product_url && seenUrls.has(product.product_url)) {
      continue;
    }

    if (product.normalized_ref_no) {
      seenRefs.add(product.normalized_ref_no);
    }

    if (product.product_url) {
      seenUrls.add(product.product_url);
    }

    unique.push(product);
  }

  return unique;
}

function getCategoryUrl(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized === "jewelry") {
    return "https://luxurysouq.com/jewellery/";
  }
  return `https://luxurysouq.com/${normalized}/`;
}

function matchesCategoryFilter(categoryName: string | null, categories: string[]): boolean {
  if (!categoryName) {
    return false;
  }

  const normalizedCategory = normalizeCategoryName(categoryName);
  return categories.some((category) => {
    const normalizedFilter = normalizeCategoryName(category);
    if (!normalizedFilter) {
      return false;
    }
    return normalizedCategory.includes(normalizedFilter);
  });
}

function normalizeCategoryName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace("jewellery", "jewelry")
    .trim();
}

function normalizeNameKey(name: string | null | undefined): string | null {
  if (!name) {
    return null;
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
