import { supabase } from "../../lib/supabase";
import { ScrapedProduct } from "../types/product";
import { extractRefFromSlug, extractRefFromText, normalizeRef } from "../utils/normalize";
import { logger } from "../utils/logger";

interface StagingRow {
  scraped_ref_no: string;
  scraped_name: string;
  scraped_price: number | null;
  raw_brand_name: string;
  raw_category_name: string;
  sync_status: string;
  scraped_at: string | null;
  error_message: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  description: string | null;
  color: string | null;
  gender: string | null;
}

export async function insertMissingInDbToStaging(products: ScrapedProduct[]): Promise<void> {
  if (products.length === 0) {
    logger.info("No missing products to insert into staging.");
    return;
  }

  const rows = buildStagingRows(products);

  if (rows.length === 0) {
    logger.warn("No valid staging rows to insert.");
    return;
  }

  const { error } = await supabase
    .from("staging_products")
    .upsert(rows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${rows.length} missing products into staging.`);
}

export async function insertScrapedProductsToStaging(products: ScrapedProduct[]): Promise<void> {
  if (products.length === 0) {
    logger.info("No scraped products to insert into staging.");
    return;
  }

  const rows = buildStagingRows(products);
  if (rows.length === 0) {
    logger.warn("No valid staging rows to insert.");
    return;
  }

  const { error } = await supabase
    .from("staging_products")
    .upsert(rows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${rows.length} scraped products into staging.`);
}

function normalizeField(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function buildStagingRef(product: ScrapedProduct): string | null {
  const rawRef = product.scraped_ref_no || product.normalized_ref_no || "";
  const refFromName = product.scraped_name ? extractRefFromText(product.scraped_name) : null;
  const refFromUrl = product.product_url ? extractRefFromSlug(new URL(product.product_url).pathname) : null;
  const fallbackFromName = product.scraped_name ? normalizeRef(product.scraped_name) : null;

  const candidate =
    normalizeRef(rawRef) ||
    (refFromName ? normalizeRef(refFromName) : null) ||
    (refFromUrl ? normalizeRef(refFromUrl) : null) ||
    fallbackFromName;

  return candidate && candidate.length > 0 ? candidate : null;
}

function buildStagingRows(products: ScrapedProduct[]): StagingRow[] {
  const rows: StagingRow[] = [];
  const seenRefs = new Set<string>();
  for (const product of products) {
    const ref = buildStagingRef(product);
    if (!ref) {
      logger.warn(`Skipping staging insert without ref: ${product.product_url}`);
      continue;
    }

    if (seenRefs.has(ref)) {
      continue;
    }
    seenRefs.add(ref);

    const name = normalizeField(product.scraped_name) || ref;
    const brand = normalizeField(product.raw_brand_name) || "Unknown";
    const category = normalizeField(product.raw_category_name) || "Unknown";

    rows.push({
      scraped_ref_no: ref,
      scraped_name: name,
      scraped_price: product.scraped_price,
      raw_brand_name: brand,
      raw_category_name: category,
      sync_status: "pending",
      scraped_at: product.scraped_at || null,
      error_message: product.error_message || null,
      image_url: product.image_url,
      image_url_2: product.image_url_2,
      image_url_3: product.image_url_3,
      description: product.description,
      color: product.color,
      gender: product.gender,
    });
  }

  return rows;
}
// BAGONG FUNCTION PARA SA MGA I-A-ARCHIVE NA PRODUCTS
export async function insertMissingFromReferenceToStaging(localOrphans: any[]): Promise<void> {
  if (localOrphans.length === 0) {
    logger.info("No missing (orphan) products to insert into staging.");
    return;
  }

  // I-map ang local database items papunta sa StagingRow format
  const rows: StagingRow[] = localOrphans.map(product => ({
    scraped_ref_no: product.ref_no,
    scraped_name: product.name,
    scraped_price: null, // 🚨 IMPORTANTE: Gawing null para pumasok sa "To Archive" tab
    raw_brand_name: product.brand?.name || product.brand || "Unknown",
    raw_category_name: product.category?.name || product.category || "Unknown",
    sync_status: "missing", // 🚨 IMPORTANTE: Set status to 'missing'
    scraped_at: new Date().toISOString(),
    error_message: null,
    image_url: null,
    image_url_2: null,
    image_url_3: null,
    description: null,
    color: null,
    gender: null,
  }));

  const { error } = await supabase
    .from("staging_products")
    .upsert(rows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Orphan staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${rows.length} missing products (for archiving) into staging.`);
}