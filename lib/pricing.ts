// lib/pricing.ts

// Ito ang mismong math formula
export function calculateFinalPriceUSD(basePriceAED: number, rate: number, markupPercent: number) {
  // Kapag walang presyo (0), ibalik na agad ang 0 para hindi na mag-compute
  if (!basePriceAED || basePriceAED === 0) return 0;

  const priceWithMarkupAED = basePriceAED + (basePriceAED * (markupPercent / 100));
  const finalPriceUSD = priceWithMarkupAED / rate;
  
  return finalPriceUSD;
}

export function formatUSD(amount: number | null | undefined) {
  // MAGIC TRICK: Kapag ang amount ay 0, null, o undefined, ibalik ang NULL imbes na "$0.00"
  if (!amount || amount === 0) return null;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}