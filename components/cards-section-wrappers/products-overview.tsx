import CardsSection from "@/components/cards-section";
import { createClient } from "@supabase/supabase-js";
import { calculateFinalPriceUSD, formatUSD } from "@/lib/pricing";

export default async function CardsSectionWrapper({
  queryString,
}: {
  queryString: string;
}) {
  // 1. I-setup ang Supabase para kunin ang Store Settings
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. I-fetch nang SABAY-SABAY ang Products, Brands, at Settings para mabilis!
  const [resbags, brandsRes, settingsRes] = await Promise.all([
    // Note: Tinanggal ko yung double slash (//) bago ang products para malinis ang URL
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${queryString}`, {
      next: { revalidate: 60 },
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands`, {
      next: { revalidate: 60 },
    }),
    supabase.from('store_settings').select('*').eq('id', 1).single(),
  ]);

  const [productData, brandsList] = await Promise.all([
    resbags.json(),
    brandsRes.json(),
  ]);

  // 3. I-extract ang rates (Kung walang makuha, gagamitin ang default na 3.67 at 10%)
  const usdRate = settingsRes.data?.usd_to_aed_rate || 3.67;
  const markup = settingsRes.data?.markup_percentage || 10;

  // 4. I-MAP ANG PRODUCTS: Dito natin isisingit ang Math Computation!
  const rawProducts = productData.products || [];
  
  const productsWithConvertedPrice = rawProducts.map((product: any) => {
    // Tawagin natin yung formula na ginawa natin sa lib/pricing.ts
    // (Siguraduhing 'price_aed' ang pangalan ng column mo sa DB, kung 'price' lang, palitan mo ito ng product.price)
    const basePrice = product.price_aed || product.price || 0; 
    
    const finalUSD = calculateFinalPriceUSD(basePrice, usdRate, markup);
    const displayPrice = formatUSD(finalUSD);

    // I-return ang product pero may kasama nang bagong "display_price" property
    return {
      ...product,
      display_price: displayPrice, 
    };
  });

  return (
    <CardsSection
      products={productsWithConvertedPrice} // Ipasa ang updated na listahan!
      subBrandsList={productData.subBrand || []}
      pageInfo={productData.page ?? null}
      brandsList={brandsList.brands}
      colorsList={productData.colors ?? null}
      subCategoryList={null}
    />
  );
}