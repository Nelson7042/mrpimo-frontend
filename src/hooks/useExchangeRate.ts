import { useQuery } from '@tanstack/react-query';
import { getExchangeRates, getCurrencySymbol } from '@/utils/currencyService';

/**
 * Centralized exchange rate hook that provides a single cached rate
 * for all currency conversion display points.
 * 
 * Uses React Query with a stable cache key and 5-minute staleTime
 * so all components get the same rate within that window, preventing
 * inconsistent currency displays across the UI.
 */

export const EXCHANGE_RATE_QUERY_KEY = 'exchangeRate';

const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  const rates = await getExchangeRates();
  return rates;
};

export const useExchangeRate = (targetCurrency: string | undefined) => {
  const currency = targetCurrency?.toUpperCase() || 'USD';

  const { data: rates, isLoading, error } = useQuery({
    queryKey: [EXCHANGE_RATE_QUERY_KEY, currency],
    queryFn: fetchExchangeRates,
    staleTime: 5 * 60 * 1000, // 5 minutes - all components get the same rate within this window
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: currency !== 'USD', // No need to fetch if displaying in USD (storage currency)
  });

  const rate = currency === 'USD' ? 1 : (rates?.[currency] ?? null);

  /**
   * Convert a USD amount to the target currency using the cached rate.
   * Returns null if the rate is not yet available or currency is USD.
   */
  const convertFromUSD = (amountInUSD: number): number | null => {
    if (currency === 'USD') return null;
    if (rate === null) return null;
    return amountInUSD * rate;
  };

  /**
   * Format a converted amount with the appropriate currency symbol.
   */
  const formatConverted = (amountInUSD: number): string | null => {
    const converted = convertFromUSD(amountInUSD);
    if (converted === null) return null;
    const symbol = getCurrencySymbol(currency);
    return `≈ ${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  return {
    rate,
    currency,
    isLoading,
    error,
    convertFromUSD,
    formatConverted,
  };
};
