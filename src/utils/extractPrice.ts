export interface PriceResult {
  value: number | null;
  currency: string | null;
}

const currencyMap: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
};

export function extractPrice(rawText: string | null): PriceResult {
  if (!rawText) {
    return { value: null, currency: null };
  }

  const text = rawText.replace(/\s+/g, " ").trim();
  const currencyMatch = text.match(/(AED|USD|EUR|GBP|SAR|QAR|KWD|BHD|OMR|CHF|JPY|CNY|HKD|SGD|INR|\$|€|£)/i);
  const currency = currencyMatch
    ? currencyMap[currencyMatch[0]] || currencyMatch[0].toUpperCase()
    : null;

  const numberMatch = text.replace(/[^0-9.]/g, "");
  if (!numberMatch) {
    return { value: null, currency };
  }

  const value = Number.parseFloat(numberMatch);
  return Number.isFinite(value) ? { value, currency } : { value: null, currency };
}
