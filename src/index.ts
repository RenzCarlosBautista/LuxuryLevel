import "dotenv/config";
import { scrapeAll } from "./scrapers/scrapeAll";
import { scrapeProductUrls } from "./scrapers/scrapeProductUrls";
import { generateReports } from "./services/reportGenerator";
import { compareDatabaseToReference } from "./services/dbCompare";
import { compareDatabaseToReferenceSite } from "./services/referenceSiteCompare";
import { logger } from "./utils/logger";

interface CliOptions {
  brand?: string;
  category?: string;
  limit?: number;
  headless: boolean;
  debug: boolean;
  report: boolean;
  reference?: string;
  compareDb: boolean;
  scrapeMissingDb: boolean;
  compareReferenceSite: boolean;
  categories?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    headless: true,
    debug: false,
    report: false,
    compareDb: false,
    scrapeMissingDb: false,
    compareReferenceSite: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--brand=")) {
      options.brand = arg.split("=")[1];
    } else if (arg.startsWith("--category=")) {
      options.category = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number.parseInt(arg.split("=")[1] || "", 10);
    } else if (arg.startsWith("--headless=")) {
      options.headless = arg.split("=")[1] !== "false";
    } else if (arg.startsWith("--debug=")) {
      options.debug = arg.split("=")[1] === "true";
    } else if (arg === "--report") {
      options.report = true;
    } else if (arg.startsWith("--reference=")) {
      options.reference = arg.split("=")[1];
    } else if (arg === "--compare-db") {
      options.compareDb = true;
    } else if (arg === "--scrape-missing-db") {
      options.scrapeMissingDb = true;
    } else if (arg === "--compare-reference-site") {
      options.compareReferenceSite = true;
    } else if (arg.startsWith("--categories=")) {
      options.categories = arg.split("=")[1];
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const concurrency = Number.parseInt(process.env.MAX_CONCURRENT_PAGES || "1", 10);

  if (options.compareReferenceSite) {
    const categories = options.categories
      ? options.categories.split(",").map((value) => value.trim()).filter(Boolean)
      : undefined;
    await compareDatabaseToReferenceSite({
      headless: options.headless,
      debug: options.debug,
      concurrency: Number.isFinite(concurrency) ? concurrency : 1,
      limit: options.limit,
      categories,
    });
    return;
  }

  if (options.compareDb) {
    logger.info("Comparing database to reference file...");
    const { missingFromDb } = await compareDatabaseToReference(options.reference);

    if (!options.scrapeMissingDb) {
      logger.info("DB comparison complete. Use --scrape-missing-db to scrape missing items.");
      return;
    }

    const missingUrls = missingFromDb
      .map((product) => product.product_url)
      .filter((url): url is string => Boolean(url));

    if (missingUrls.length === 0) {
      logger.info("No missing product URLs found to scrape.");
      return;
    }

    const products = await scrapeProductUrls(missingUrls, {
      headless: options.headless,
      debug: options.debug,
      concurrency: Number.isFinite(concurrency) ? concurrency : 1,
      limit: options.limit,
    });

    logger.info("Generating reports...");
    await generateReports(products, 0, options.reference);
    return;
  }

  logger.info("Starting LuxurySouq scraper...");
  const { products, totalBrands } = await scrapeAll({
    brandFilter: options.brand,
    categoryFilter: options.category,
    limit: options.limit,
    headless: options.headless,
    debug: options.debug,
    concurrency: Number.isFinite(concurrency) ? concurrency : 1,
  });

  logger.info("Generating reports...");
  await generateReports(products, totalBrands, options.reference);

  if (options.report) {
    logger.report("Report generation complete.");
  }
}

main().catch((error) => {
  logger.error(`Scraper failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
