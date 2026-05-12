import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";
import { saveReport } from "./jsonStorage";
import { DbProductSummary, loadDbProductSummaries } from "./dbCompare";
import { collectListingProducts, ListingProduct } from "../scrapers/collectListingProducts";
import { scrapeProductUrls } from "../scrapers/scrapeProductUrls";
import { chromium } from "playwright";
import { insertMissingInDbToStaging } from "./stagingInsert";

export interface ReferenceSiteCompareOptions {
  headless: boolean;
  debug: boolean;
  concurrency: number;
  limit?: number;
  categories?: string[];
  writeStagingMissing?: boolean;
}

export interface ReferenceSiteCompareResult {
  referenceListings: ListingProduct[];
  dbProducts: DbProductSummary[];
  missingListings: ListingProduct[];
  missingInDb: ScrapedProduct[];
  inBoth: DbProductSummary[];
  onlyInDb: DbProductSummary[];
  priceMismatches: PriceMismatch[];
}

export interface PriceMismatch {
  ref_no: string | null;
  name: string;
  db_price: number;
  reference_price: number;
  product_url: string | null;
  category_name: string | null;
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

  const referenceByRef = new Map<string, ListingProduct>();
  const referenceByName = new Map<string, ListingProduct>();
  for (const listing of referenceListings) {
    if (listing.normalized_ref_no && !referenceByRef.has(listing.normalized_ref_no)) {
      referenceByRef.set(listing.normalized_ref_no, listing);
    }
    const nameKey = normalizeNameKey(listing.scraped_name);
    if (nameKey && !referenceByName.has(nameKey)) {
      referenceByName.set(nameKey, listing);
    }
  }

  const missingListings = referenceListings.filter((product) => {
    const nameKey = normalizeNameKey(product.scraped_name);
    if (nameKey && dbNameKeys.has(nameKey)) {
      return false;
    }
    if (product.normalized_ref_no && dbRefs.has(product.normalized_ref_no)) {
      return false;
    }
    return Boolean(nameKey || product.normalized_ref_no);
  });
  await saveReport("missing-in-db-listings.partial.json", missingListings);

  const onlyInDb = dbProducts.filter((product) => {
    if (!matchesCategoryFilter(product.category_name, categories)) {
      return false;
    }
    const nameKey = normalizeNameKey(product.name);
    if (nameKey && referenceNameKeys.has(nameKey)) {
      return false;
    }
    if (product.normalized_ref_no && referenceRefs.has(product.normalized_ref_no)) {
      return false;
    }
    return Boolean(nameKey || product.normalized_ref_no);
  });

  const missingUrls = missingListings.map((product) => product.product_url);
  const missingInDb = await scrapeProductUrls(missingUrls, {
    headless: options.headless,
    debug: options.debug,
    concurrency: options.concurrency,
    limit: options.limit,
  });

  if (options.writeStagingMissing) {
    await insertMissingInDbToStaging(missingInDb);
  }

  const inBoth = dbProducts.filter((product) => {
    if (!matchesCategoryFilter(product.category_name, categories)) {
      return false;
    }
    const nameKey = normalizeNameKey(product.name);
    if (nameKey && referenceNameKeys.has(nameKey)) {
      return true;
    }
    if (product.normalized_ref_no && referenceRefs.has(product.normalized_ref_no)) {
      return true;
    }
    return false;
  });

  const priceMismatches = findPriceMismatches(inBoth, referenceByRef, referenceByName);

  await saveReport("reference-listings.json", referenceListings);
  await saveReport("db-products.json", dbProducts);
  await saveReport("missing-in-db-listings.json", missingListings);
  await saveReport("missing-in-db.json", missingInDb);
  await saveReport("in-both.json", inBoth);
  await saveReport("only-in-db.json", onlyInDb);
  await saveReport("price-mismatches.json", priceMismatches);
  await saveReport("reference-compare-summary.json", {
    reference_count: referenceListings.length,
    db_count: dbProducts.length,
    missing_in_db: missingListings.length,
    missing_in_db_scraped: missingInDb.length,
    in_both: inBoth.length,
    only_in_db: onlyInDb.length,
    price_mismatches: priceMismatches.length,
    generated_at: new Date().toISOString(),
  });

  logger.report(
    `Reference comparison complete. Reference: ${referenceListings.length}, DB: ${dbProducts.length}, Missing: ${missingListings.length}, Only in DB: ${onlyInDb.length}`
  );

  return {
    referenceListings,
    dbProducts,
    missingListings,
    missingInDb,
    inBoth,
    onlyInDb,
    priceMismatches,
  };
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
    if (normalizedCategory.includes(normalizedFilter)) {
      return true;
    }

    const keywords = getCategoryKeywords(normalizedFilter);
    return keywords.some((keyword) => normalizedCategory.includes(keyword));
  });
}

function getCategoryKeywords(category: string): string[] {
  if (category === "jewelry") {
    return ["jewel", "ring", "bracelet", "necklace", "earring", "pendant", "cufflink", "brooch", "bangle"];
  }
  if (category === "bags") {
    return ["bag", "handbag", "purse", "wallet", "clutch"];
  }
  if (category === "watches") {
    return ["watch"];
  }
  return [];
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

function getEffectiveDbPrice(product: DbProductSummary): number | null {
  if (typeof product.sale_price === "number") {
    return product.sale_price;
  }
  if (typeof product.price === "number") {
    return product.price;
  }
  return null;
}

function findPriceMismatches(
  dbProducts: DbProductSummary[],
  referenceByRef: Map<string, ListingProduct>,
  referenceByName: Map<string, ListingProduct>
): PriceMismatch[] {
  const mismatches: PriceMismatch[] = [];

  for (const product of dbProducts) {
    const dbPrice = getEffectiveDbPrice(product);
    if (dbPrice === null) {
      continue;
    }

    let listing: ListingProduct | undefined;
    if (product.normalized_ref_no) {
      listing = referenceByRef.get(product.normalized_ref_no);
    }
    if (!listing) {
      const nameKey = normalizeNameKey(product.name);
      if (nameKey) {
        listing = referenceByName.get(nameKey);
      }
    }

    if (!listing || listing.scraped_price === null) {
      continue;
    }

    if (Math.abs(dbPrice - listing.scraped_price) > 0.01) {
      mismatches.push({
        ref_no: product.ref_no,
        name: product.name,
        db_price: dbPrice,
        reference_price: listing.scraped_price,
        product_url: listing.product_url || null,
        category_name: product.category_name,
      });
    }
  }

  return mismatches;
}
