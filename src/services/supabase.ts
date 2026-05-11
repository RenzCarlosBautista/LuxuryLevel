import { createClient } from "@supabase/supabase-js";
import { ScrapedProduct } from "../types/product";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// const supabase = createClient(supabaseUrl, supabaseKey);

export async function insertProducts(_products: ScrapedProduct[]): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  // Database insertion is disabled for now.
  // const { error } = await supabase
  //   .from("staging_products")
  //   .upsert(
  //     _products.map((product) => ({
  //       scraped_ref_no: product.scraped_ref_no,
  //       scraped_name: product.scraped_name,
  //       scraped_price: product.scraped_price,
  //       raw_brand_name: product.raw_brand_name,
  //       raw_category_name: product.raw_category_name,
  //       scraped_at: product.scraped_at,
  //       error_message: product.error_message,
  //       image_url: product.image_url,
  //       image_url_2: product.image_url_2,
  //       image_url_3: product.image_url_3,
  //       description: product.description,
  //       color: product.color,
  //       gender: product.gender,
  //     })),
  //     { onConflict: "scraped_ref_no" }
  //   );

  // if (error) {
  //   throw new Error(`Supabase insert failed: ${error.message}`);
  // }
}
