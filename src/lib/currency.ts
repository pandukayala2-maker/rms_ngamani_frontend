const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", KWD: "KD " };

export function currencySymbol(code?: string | null): string {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}
