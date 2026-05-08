import CardsSection from "@/components/cards-section";
import { createClient } from "@supabase/supabase-js";
import { calculateFinalPriceUSD, formatUSD } from "@/lib/pricing";

export default async function CardsSectionWrapper({
  queryString,
  sub_category,
  tableName,
}: {
  queryString: string;
  sub_category: string | null;
  tableName: string;
}) {
  const [dataRes, brandListRes, subCategoriesRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${
        sub_category || tableName
      }?${queryString}`
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${tableName}/available-brands`
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${tableName}/sub-categories`
    ),
  ]);

  const [data, brandList, catList] = await Promise.all([
    dataRes.json(),
    brandListRes.json(),
    subCategoriesRes.json(),
  ]);

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

  const rawProducts = data.products || [];
  
  const productsWithConvertedPrice = rawProducts.map((prod: any) => {
    const basePrice = prod.price || 0;
    const finalUSD = calculateFinalPriceUSD(basePrice, usdRate, markup);

    return {
      ...prod,
      display_price: formatUSD(finalUSD), // Ipasa natin as display_price para saluhin ng CardsSection
    };
  });
  // ----------------------------

  return (
    <CardsSection
      products={productsWithConvertedPrice} // Gamitin ang converted list
      subBrandsList={data.subBrands || []}
      pageInfo={data.page ?? null}
      brandsList={brandList}
      colorsList={data.colors ?? null}
      subCategoryList={catList}
    />
  );
}