import Link from "next/link";
import ProductCard from "../product-card";
import Image from "next/image";
import { FeaturedResponse } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";
import { calculateFinalPriceUSD, formatUSD } from "@/lib/pricing";

// 1. Ang UI Component
export default async function FeaturedBrandProducts({
  brandInfo,
  products,
}: FeaturedResponse) {
  return (
    <div className="section-style bg-white py-10 px-5 w-full h-fit flex flex-col gap-10 border-b border-black">
      <div className="flex w-full items-center flex-col">
        <Image
          src={brandInfo?.logo_url || "/placeholder-image.webp"}
          alt={brandInfo?.name || "Brand"}
          height={180}
          width={180}
          className="object-contain"
        />
      </div>
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {products.map((prod, idx) => (
            <ProductCard
              key={idx}
              imgSrc={prod.image_1 || "/placeholder-image.webp"}
              hoverImgSrc={prod.image_3 || prod.image_2 || prod.image_1}
              href={`/products/${prod.id}`}
              productName={prod.name}
              price={prod.price} // Nakasalo na ito ng string format na $
              salePrice={prod.sale_price} // Nakasalo rin ng string format na $
              className="border-none"
            />
          ))}
        </div>
      </div>

      <Link href={`/brands/${brandInfo?.id}`} className="flex justify-center">
        <div className="cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block">
          Explore More
        </div>
      </Link>
    </div>
  );
}

// 2. Ang Data Fetcher at Pricing Converter
export async function FeaturedBrandProductsWrapper({
  category,
  brandName,
  limit,
}: {
  category: string;
  brandName: string;
  limit?: string;
}) {
  try {
    const params = new URLSearchParams();

    if (brandName) params.set("brand", brandName);
    if (limit) params.set("limit", limit);

    const queryString = params.toString();

    const dataRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${category}/featured?${queryString}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!dataRes.ok) {
      throw new Error(`Failed to fetch: ${dataRes.statusText}`);
    }

    const data: FeaturedResponse = await dataRes.json();

    // --- PRICING ENGINE LOGIC ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: settings } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();

    const usdRate = settings?.usd_to_aed_rate || 3.67;
    const markup = settings?.markup_percentage || 10;

    const productsWithConvertedPrice = data.products.map((prod: any) => {
      const basePrice = prod.price || 0;
      const finalUSD = calculateFinalPriceUSD(basePrice, usdRate, markup);

      let finalSaleUSD = null;
      if (prod.sale_price) {
        finalSaleUSD = calculateFinalPriceUSD(prod.sale_price, usdRate, markup);
      }

      return {
        ...prod,
        price: formatUSD(finalUSD), // Override natin yung number ng formatted string
        sale_price: finalSaleUSD ? formatUSD(finalSaleUSD) : null,
      };
    });
    // ----------------------------

    return (
      <FeaturedBrandProducts
        brandInfo={data.brandInfo}
        products={productsWithConvertedPrice}
      />
    );
  } catch (error) {
    console.error("Error fetching featured brand products:", error);
    return null;
  }
}

// 3. Ang Main Wrapper Loop
/**
 * Fetches all featured brands and their products dynamically
 * Replaces hard-coded brand sections with database-driven content
 */
export async function DynamicFeaturedBrandsWrapper({
  category,
  limit = "6",
}: {
  category: string;
  limit?: string;
}) {
  try {
    // Fetch featured brands
    const brandsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/brands/featured`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!brandsRes.ok) {
      throw new Error("Failed to fetch featured brands");
    }

    const featuredBrands = await brandsRes.json();

    if (!featuredBrands || featuredBrands.length === 0) {
      return null;
    }

    // Render first 3 featured brands with their products
    return (
      <>
        {featuredBrands.slice(0, 3).map((brand: any) => (
          <div key={brand.id}>
            <FeaturedBrandProductsWrapper
              category={category}
              brandName={brand.name}
              limit={limit}
            />
          </div>
        ))}
      </>
    );
  } catch (error) {
    console.error("Error fetching dynamic featured brands:", error);
    return null;
  }
}