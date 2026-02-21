import { useState, useEffect } from "react";

const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Module-level cache shared across all hook instances
let ratesCache: { rates: Record<string, number>; expiry: number } | null = null;

/**
 * Fetches the USD → userCurrency rate.
 * - To convert user currency → USD: divide by rate
 * - To convert USD → user currency: multiply by rate
 * Caches the full rates response for 1 hour.
 */
export const useBidCurrencyRate = (userCurrency: string | undefined) => {
  const [rate, setRate] = useState<number>(() => {
    if (!userCurrency || userCurrency === "USD") return 1;
    return ratesCache && ratesCache.expiry > Date.now()
      ? ratesCache.rates[userCurrency] || 1
      : 1;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userCurrency || userCurrency === "USD") {
      setRate(1);
      return;
    }

    // Check cache first
    if (ratesCache && ratesCache.expiry > Date.now()) {
      setRate(ratesCache.rates[userCurrency] || 1);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(EXCHANGE_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.rates) return;
        ratesCache = { rates: data.rates, expiry: Date.now() + CACHE_TTL };
        setRate(data.rates[userCurrency] || 1);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userCurrency]);

  return { rate, loading };
};
