import { useState, useEffect } from 'react';
import { convertFromUSD, getCurrencySymbol } from '@/utils/currencyService';

export const useWalletDisplay = (usdBalance: number | undefined, localCurrency: string | undefined) => {
  const [localAmount, setLocalAmount] = useState<number | null>(null);

  const balance = usdBalance ?? 0;
  const currency = localCurrency?.toUpperCase() || 'USD';

  useEffect(() => {
    if (balance <= 0 || currency === 'USD') {
      setLocalAmount(null);
      return;
    }
    convertFromUSD(balance, currency).then(setLocalAmount).catch(() => setLocalAmount(null));
  }, [balance, currency]);

  const usdDisplay = `$${balance.toFixed(2)}`;
  const localSymbol = getCurrencySymbol(currency);
  const approxDisplay = localAmount !== null && currency !== 'USD'
    ? `≈ ${localSymbol}${localAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
    : null;

  return { usdDisplay, approxDisplay };
};
