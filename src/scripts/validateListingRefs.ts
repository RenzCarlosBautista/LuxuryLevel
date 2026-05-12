import { extractRefFromSlug, normalizeRef } from "../utils/normalize";
import { logger } from "../utils/logger";

interface RefCase {
  slug: string;
  expected: string;
}

const cases: RefCase[] = [
  {
    slug: "/rolex-datejust-279381rbr-chdo/",
    expected: "279381RBRCHDO",
  },
  {
    slug: "/rolex-sky-dweller-326238-wi/",
    expected: "326238WI",
  },
  {
    slug: "/rolex-yacht-master-126621-0001/",
    expected: "1266210001",
  },
  {
    slug: "/blancpain-fifty-fathoms-bathyscaphe-5200-1110-b52a/",
    expected: "52001110B52A",
  },
];

function main(): void {
  let failures = 0;

  for (const testCase of cases) {
    const normalized = extractRefFromSlug(testCase.slug);
    const expected = normalizeRef(testCase.expected);

    if (normalized !== expected) {
      failures += 1;
      logger.warn(
        `Ref mismatch for ${testCase.slug}: got ${normalized ?? "null"}, expected ${expected}`
      );
      continue;
    }

    logger.info(`OK ${testCase.slug} => ${normalized}`);
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
