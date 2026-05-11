export interface ScrapedProduct {
  product_url: string;

  scraped_ref_no: string | null;
  normalized_ref_no: string | null;

  scraped_name: string;
  scraped_price: number | null;
  currency: string | null;

  raw_brand_name: string | null;
  raw_category_name: string | null;

  description: string | null;

  color: string | null;
  gender: string | null;

  stock_status: string | null;

  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;

  all_images: string[];

  specifications: Record<string, string>;

  scraped_at: string;

  scrape_success: boolean;

  error_message?: string | null;
}
