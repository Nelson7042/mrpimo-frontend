import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/stores/useUserStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

type Transaction = {
  amount: string;
  type: 'incoming' | 'outgoing';
  createdAt: string;
};

type TokenData = {
  balance: string;
  transactions: Transaction[];
};

type WalletData = {
  usdt: TokenData;
  usdc: TokenData;
  address: string;
};

export const useWalletTransactions = () => {
  const { user } = useUserStore();

  const { data: walletData, isLoading, error } = useQuery<WalletData, Error>({
    queryKey: ['wallet', user?._id],
    queryFn: async () => {
      if (!user?._id) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetchWithAuth('http://localhost:5800/api/v1/wallets/crypto/get-wallet');
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      
      return response.json();
    },
    enabled: !!user?._id,
  });

  return { 
    walletData: walletData || null, 
    isLoading, 
    error: error ? error.message : null 
  };
};

export default useWalletTransactions;