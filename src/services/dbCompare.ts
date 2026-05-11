import path from "path";
import { supabase } from "../../lib/supabase";
import { normalizeRef } from "../utils/normalize";
import { getReportsDir, saveReport } from "./jsonStorage";
import { fileExists, readJson } from "../utils/file";
import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";

export interface DbProductSummary {
  ref_no: string | null;
  normalized_ref_no: string | null;
  name: string;
  category_name: string | null;
  product_url: string | null;
}

export interface DbCompareResult {
  dbProducts: DbProductSummary[];
  missingFromDb: ScrapedProduct[];
}

export async function compareDatabaseToReference(
  referenceFile?: string
): Promise<DbCompareResult> {
  const referenceProducts = await loadReferenceProducts(referenceFile);
  if (!referenceProducts) {
    return { dbProducts: [], missingFromDb: [] };
  }

  const dbProducts = await loadDbProductSummaries();
  const dbRefSet = new Set(
    dbProducts
      .map((product) => product.normalized_ref_no)
      .filter((ref): ref is string => Boolean(ref))
  );

  const missingFromDb = referenceProducts.filter((product) => {
    if (!product.normalized_ref_no) {
      return false;
    }
    return !dbRefSet.has(product.normalized_ref_no);
  });

  await saveReport("db-products.json", dbProducts);
  await saveReport("missing-in-db.json", missingFromDb);

  logger.report(
    `DB comparison complete. DB: ${dbProducts.length}, Missing: ${missingFromDb.length}`
  );

  return { dbProducts, missingFromDb };
}

async function loadReferenceProducts(referenceFile?: string): Promise<ScrapedProduct[] | null> {
  const reportsDir = getReportsDir();
  const referencePath = referenceFile
    ? path.resolve(referenceFile)
    : path.join(reportsDir, "reference-products.json");
  const fallbackPath = path.join(reportsDir, "all-products.json");

  const exists = await fileExists(referencePath);
  if (!exists) {
    logger.warn(`Reference file not found: ${referencePath}`);
    const fallbackExists = await fileExists(fallbackPath);
    if (!fallbackExists) {
      logger.warn("Provide --reference or add reference-products.json.");
      return null;
    }
    logger.warn(`Falling back to ${fallbackPath}`);
    return readJson<ScrapedProduct[]>(fallbackPath).catch(() => null);
  }

  const data = await readJson<ScrapedProduct[]>(referencePath).catch(() => null);
  if (!data) {
    logger.warn("Reference file could not be loaded.");
  }
  return data;
}

export async function loadDbProductSummaries(): Promise<DbProductSummary[]> {
  const categories = await loadCategoryMap();
  const { data, error } = await supabase
    .from("product")
    .select("ref_no,name,category_id")
    .order("id", { ascending: true });

  if (error) {
    logger.error(`Failed to load products from DB: ${error.message}`);
    return [];
  }

  return (data || []).map((row) => {
    const refNo = typeof row.ref_no === "string" ? row.ref_no : null;
    const normalized = refNo ? normalizeRef(refNo) : null;
    const categoryId = typeof row.category_id === "number" ? row.category_id : null;
    const category = categoryId ? categories.get(categoryId) || null : null;
    return {
      ref_no: refNo,
      normalized_ref_no: normalized,
      name: row.name,
      category_name: category,
      product_url: null,
    };
  });
}

async function loadCategoryMap(): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from("category")
    .select("id,name")
    .order("id", { ascending: true });

  if (error) {
    logger.error(`Failed to load categories from DB: ${error.message}`);
    return new Map();
  }

  const map = new Map<number, string>();
  (data || []).forEach((row) => {
    if (typeof row.id === "number" && typeof row.name === "string") {
      map.set(row.id, row.name);
    }
  });

  return map;
}
