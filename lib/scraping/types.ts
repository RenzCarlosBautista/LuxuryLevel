/**
 * Types for Product Synchronization Feature
 */

export interface ReferenceProductData {
  name: string;
  brand: string;
  price: number;
  currency?: string;
  description?: string;
  image_url?: string;
  color?: string;
  gender?: string;
  sku?: string;
  reference_source: string; // URL where it was scraped from
  reference_id?: string; // ID from reference site if available
}

export interface SyncPendingRecord {
  id: string;
  sync_type: 'missing' | 'price_diff' | 'extra';
  product_category: string;
  reference_data: ReferenceProductData | null;
  local_product_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  action_type?: 'import' | 'update_price' | 'archive' | 'delete';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

export interface SyncRunStats {
  products_scanned: number;
  products_found_missing: number;
  products_with_price_diff: number;
  products_marked_extra: number;
  started_at: string;
  completed_at?: string;
}

export type ProductCategory = 'bags' | 'watches' | 'cufflinks' | 'bracelet' | 'diamond_rings' | 'bridal_jewelries';

export const REFERENCE_URLS: Record<ProductCategory, string> = {
  bags: 'https://luxurysouq.com/bags/',
  watches: 'https://luxurysouq.com/watches/',
  cufflinks: 'https://luxurysouq.com/cufflinks/',
  bracelet: 'https://luxurysouq.com/bracelet/',
  diamond_rings: 'https://luxurysouq.com/ls-diamond-rings/',
  bridal_jewelries: 'https://luxurysouq.com/ls-bridal-jewelries/',
};
