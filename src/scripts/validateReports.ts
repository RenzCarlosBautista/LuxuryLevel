import { loadReportIfExists } from "../services/jsonStorage";
import { logger } from "../utils/logger";
import { ScrapedProduct } from "../types/product";

async function main(): Promise<void> {
  const products = await loadReportIfExists<ScrapedProduct[]>("all-products.json");
  if (!products) {
    logger.warn("all-products.json not found.");
    return;
  }

  const missingRefs = products.filter((product) => !product.normalized_ref_no);
  const failures = products.filter((product) => !product.scrape_success);

  logger.info(`Total products: ${products.length}`);
  logger.info(`Missing refs: ${missingRefs.length}`);
  logger.info(`Failed scrapes: ${failures.length}`);
}

main().catch((error) => {
  logger.error(`Report validation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
