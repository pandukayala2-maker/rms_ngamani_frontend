import { useMemo } from "react";
import { useSettings } from "./useSettings";
import { currencySymbol } from "../lib/currency";

// Every page previously hardcoded Intl.NumberFormat("en-IN", { currency: "INR" }),
// so amounts always showed ₹ no matter what currency the branch is actually
// configured with. This reads the branch's real currency (e.g. KWD) instead.
export function useCurrencyFormatter(options?: { maximumFractionDigits?: number }) {
  const { data: settings } = useSettings();
  const symbol = currencySymbol(settings?.currency);
  const isKwd = settings?.currency === "KWD" || symbol.trim() === "KD";
  const maximumFractionDigits = options?.maximumFractionDigits ?? (isKwd ? 3 : 2);

  return useMemo(
    () => ({
      format: (amount: number | string) => {
        const n = typeof amount === "string" ? Number(amount) : amount;
        const value = Number.isFinite(n) ? n : 0;
        return `${symbol}${value.toLocaleString(undefined, {
          minimumFractionDigits: maximumFractionDigits,
          maximumFractionDigits,
        })}`;
      },
    }),
    [symbol, maximumFractionDigits]
  );
}
