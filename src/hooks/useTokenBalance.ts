import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface TokenBalance {
  address: string;
  token: string;
  balance: string;
  txHash?: string;
}

export const useTokenBalance = (walletAddress: string, initialBalances: Record<string, string>) => {
  const [balances, setBalances] = useState<Record<string, string>>(initialBalances);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !walletAddress) return;

    // Listen for balance changes
    const handleBalanceChange = (data: TokenBalance) => {
      if (data.address.toLowerCase() === walletAddress.toLowerCase()) {
        setBalances(prev => ({
          ...prev,
          [data.token]: data.balance
        }));
        
        if (data.txHash) {
          setLastTransaction(data.txHash);
        }
      }
    };

    socket.on('balance-changed', handleBalanceChange);

    return () => {
      socket.off('balance-changed', handleBalanceChange);
    };
  }, [socket, walletAddress]);

  return { balances, lastTransaction };
};