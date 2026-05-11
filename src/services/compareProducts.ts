import { ScrapedProduct } from "../types/product";

export interface DiffResult {
  ref: string;
  before: ScrapedProduct;
  after: ScrapedProduct;
  changes: Record<string, { before: unknown; after: unknown }>;
}

const fieldsToCompare: Array<keyof ScrapedProduct> = [
  "scraped_price",
  "description",
  "all_images",
  "gender",
  "color",
];

export function compareProducts(
  current: ScrapedProduct[],
  reference: ScrapedProduct[]
): {
  newProducts: ScrapedProduct[];
  changedProducts: DiffResult[];
  missingFromReference: ScrapedProduct[];
} {
  const referenceMap = new Map<string, ScrapedProduct>();
  for (const product of reference) {
    if (product.normalized_ref_no) {
      referenceMap.set(product.normalized_ref_no, product);
    }
  }

  const currentMap = new Map<string, ScrapedProduct>();
  for (const product of current) {
    if (product.normalized_ref_no) {
      currentMap.set(product.normalized_ref_no, product);
    }
  }

  const newProducts: ScrapedProduct[] = [];
  const changedProducts: DiffResult[] = [];
  const missingFromReference: ScrapedProduct[] = [];

  for (const product of current) {
    if (!product.normalized_ref_no) {
      continue;
    }

    const referenceProduct = referenceMap.get(product.normalized_ref_no);
    if (!referenceProduct) {
      newProducts.push(product);
      continue;
    }

    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const field of fieldsToCompare) {
      const beforeValue = referenceProduct[field];
      const afterValue = product[field];
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes[field] = { before: beforeValue, after: afterValue };
      }
    }

    if (Object.keys(changes).length > 0) {
      changedProducts.push({
        ref: product.normalized_ref_no,
        before: referenceProduct,
        after: product,
        changes,
      });
    }
  }

  for (const product of reference) {
    if (!product.normalized_ref_no) {
      continue;
    }

    if (!currentMap.has(product.normalized_ref_no)) {
      missingFromReference.push(product);
    }
  }

  return { newProducts, changedProducts, missingFromReference };
}
