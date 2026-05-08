import Banner from "@/components/banner";
import CardsSection from "@/components/cards-section";
import { createClient } from "@supabase/supabase-js";
import { calculateFinalPriceUSD, formatUSD } from "@/lib/pricing";

export default async function CardsSectionWrapper({
  queryString,
  brand,
}: {
  queryString: string;
  brand: string | null;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [resbags, resBrandInfo, settingsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${queryString}`),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands/${brand}/information`),
    supabase.from('store_settings').select('*').eq('id', 1).single(),
  ]);

  const [brandProductList, brandInfo] = await Promise.all([
    resbags.json(),
    resBrandInfo.json(),
  ]);

  // Extract rates with defaults
  const usdRate = settingsRes.data?.usd_to_aed_rate || 3.67;
  const markup = settingsRes.data?.markup_percentage || 10;

  // Convert prices for all products
  const rawProducts = brandProductList.products || [];
  const productsWithConvertedPrice = rawProducts.map((product: any) => {
    const basePrice = product.price_aed || product.price || 0;
    const finalUSD = calculateFinalPriceUSD(basePrice, usdRate, markup);
    const displayPrice = formatUSD(finalUSD);
    return {
      ...product,
      display_price: displayPrice,
    };
  });

  return (
    <>
      <Banner
        title={brandInfo.name}
        classnameForBgSrc="bg-[url(/banners/watches.webp)] bg-[center_top_10%] "
      />
      <CardsSection
        products={productsWithConvertedPrice}
        pageInfo={brandProductList.page ?? null}
        brandsList={null}
        colorsList={brandProductList.colors ?? null}
        subCategoryList={null}
        subBrandsList={brandProductList.subBrands}
      />
    </>
  );
}
