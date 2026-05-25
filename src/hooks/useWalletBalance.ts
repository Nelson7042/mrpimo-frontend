import { useWalletBalance } from '@/hooks/useWallet';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', CAD: 'C$', AUD: 'A$',
  ZAR: 'R', GHS: '₵', KES: 'KSh', JPY: '¥', CNY: '¥', INR: '₹',
  NZD: 'NZ$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr',
};

/**
 * Formats wallet balance for display using the wallet's actual currency.
 * Falls back to the provided parameters if wallet data isn't loaded yet.
 */
export const useWalletDisplay = (fallbackBalance: number | undefined, fallbackCurrency: string | undefined) => {
  const { data: walletData } = useWalletBalance();

  // Use wallet's actual currency and balance if available
  const balance = walletData?.wallet?.balances?.available ?? fallbackBalance ?? 0;
  const currency = (walletData?.wallet?.currency || fallbackCurrency || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';

  const usdDisplay = `${symbol}${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // No approximate conversion needed — we're showing the actual wallet currency
  const approxDisplay = null;

  return { usdDisplay, approxDisplay };
};
