import path from "path";
import { fileURLToPath } from "url";
import { compareProducts } from "./compareProducts";
import { getReportsDir, saveReport } from "./jsonStorage";
import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";
import { fileExists, readJson } from "../utils/file";

export interface SummaryReport {
  total_brands: number;
  total_products: number;
  successful_scrapes: number;
  failed_scrapes: number;
  duplicate_count: number;
  missing_ref_count: number;
  generated_at: string;
}

export async function generateReports(
  products: ScrapedProduct[],
  totalBrands: number,
  referenceFile?: string
): Promise<void> {
  await saveReport("all-products.json", products);

  const duplicates = findDuplicates(products);
  await saveReport("duplicate-products.json", duplicates);

  const missingRefs = products.filter((product) => !product.normalized_ref_no);
  await saveReport("missing-ref-products.json", missingRefs);

  const errors = products.filter((product) => !product.scrape_success);
  await saveReport("scrape-errors.json", errors);

  const summary: SummaryReport = {
    total_brands: totalBrands,
    total_products: products.length,
    successful_scrapes: products.filter((product) => product.scrape_success).length,
    failed_scrapes: errors.length,
    duplicate_count: duplicates.length,
    missing_ref_count: missingRefs.length,
    generated_at: new Date().toISOString(),
  };
  await saveReport("summary-report.json", summary);

  await generateComparisonReports(products, referenceFile);
}

function findDuplicates(products: ScrapedProduct[]): ScrapedProduct[] {
  const seen = new Map<string, ScrapedProduct>();
  const duplicates: ScrapedProduct[] = [];

  for (const product of products) {
    if (!product.normalized_ref_no) {
      continue;
    }

    if (seen.has(product.normalized_ref_no)) {
      duplicates.push(product);
    } else {
      seen.set(product.normalized_ref_no, product);
    }
  }

  return duplicates;
}

async function generateComparisonReports(
  products: ScrapedProduct[],
  referenceFile?: string
): Promise<void> {
  const reportsDir = getReportsDir();
  const referencePath = referenceFile
    ? path.resolve(referenceFile)
    : path.join(reportsDir, "reference-products.json");

  const hasReference = await fileExists(referencePath);
  if (!hasReference) {
    logger.warn("Reference file not found. Skipping comparison reports.");
    return;
  }

  const referenceProducts = await readJson<ScrapedProduct[]>(referencePath).catch(() => null);
  if (!referenceProducts) {
    logger.warn("Reference file could not be loaded. Skipping comparison reports.");
    return;
  }

  const { newProducts, changedProducts, missingFromReference } = compareProducts(
    products,
    referenceProducts
  );

  await saveReport("new-products.json", newProducts);
  await saveReport("changed-products.json", changedProducts);
  await saveReport("missing-from-reference.json", missingFromReference);

  logger.report(
    `Comparison reports generated. New: ${newProducts.length}, Changed: ${changedProducts.length}, Missing: ${missingFromReference.length}`
  );
}

async function main(): Promise<void> {
  const reportsDir = getReportsDir();
  const allProductsPath = path.join(reportsDir, "all-products.json");
  const hasAllProducts = await fileExists(allProductsPath);
  if (!hasAllProducts) {
    logger.warn("all-products.json not found. Run the scraper first.");
    return;
  }

  const products = await readJson<ScrapedProduct[]>(allProductsPath);
  await generateReports(products, 0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((error) => {
    logger.error(`Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
