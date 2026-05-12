import { useExchangeRate } from '@/hooks/useExchangeRate';

export const useWalletDisplay = (usdBalance: number | undefined, localCurrency: string | undefined) => {
  const balance = usdBalance ?? 0;
  const currency = localCurrency?.toUpperCase() || 'USD';

  const { formatConverted } = useExchangeRate(currency);

  const usdDisplay = `${balance.toFixed(2)}`;
  const approxDisplay = balance > 0 && currency !== 'USD'
    ? formatConverted(balance)
    : null;

  return { usdDisplay, approxDisplay };
};
