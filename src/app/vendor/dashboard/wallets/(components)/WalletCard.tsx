import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTokenBalance } from "@/hooks/useTokenBalance";

type TokenBalance = {
  symbol: string;
  balance: number;
  value: string;
  iconPath: string;
  rate?: number;
  address?: string; // Wallet address for this token
};

type WalletCardProps = {
  totalBalance: number;
  monthlyChange: string;
  tokens: TokenBalance[];
  gradientColors: {
    from: string;
    to: string;
  };
};

const WalletCard = ({
  totalBalance,
  monthlyChange,
  tokens,
  gradientColors,
}: WalletCardProps) => {
  // State to track balance updates
  const [updatedTokens, setUpdatedTokens] = useState(tokens);
  const [updatedTotalBalance, setUpdatedTotalBalance] = useState(totalBalance);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  
  // Get wallet address from the first token (assuming all tokens use the same wallet)
  const walletAddress = tokens[0]?.address || '';
  
  // Initial balances object for useTokenBalance
  const initialBalances = tokens.reduce((acc, token) => {
    acc[token.symbol] = token.balance.toString();
    return acc;
  }, {} as Record<string, string>);
  
  // Use the token balance hook to listen for balance changes
  const { balances, lastTransaction } = useTokenBalance(walletAddress, initialBalances);
  
  // Update tokens when balances change
  useEffect(() => {
    // Check if we have a new transaction
    if (lastTransaction && lastTransaction !== lastTx) {
      setIsUpdating(true);
      setLastTx(lastTransaction);
      
      // Update tokens with new balances
      const updated = updatedTokens.map(token => {
        const newBalance = parseFloat(balances[token.symbol] || '0');
        if (newBalance !== token.balance) {
          return {
            ...token,
            balance: newBalance,
            value: `${(newBalance * (token.rate || 1)).toFixed(2)}`
          };
        }
        return token;
      });
      
      setUpdatedTokens(updated);
      
      // Recalculate total balance
      const newTotal = updated.reduce((sum, token) => {
        return sum + (token.balance * (token.rate || 1));
      }, 0);
      
      setUpdatedTotalBalance(newTotal);
      
      // Reset updating state after animation
      setTimeout(() => setIsUpdating(false), 1000);
    }
  }, [balances, lastTransaction, lastTx, updatedTokens]);
  
  // Update local state when props change
  useEffect(() => {
    setUpdatedTokens(tokens);
    setUpdatedTotalBalance(totalBalance);
  }, [tokens, totalBalance]);
  
  // Determine which gradient to use based on props
  const bgClass = gradientColors.from === "green-600" 
    ? "bg-gradient-to-r from-green-600 to-green-900" 
    : "bg-gradient-to-r from-blue-600 to-blue-900";

  return (
    <div className={`w-full h-full ${bgClass} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex flex-col gap-y-5 h-full">
        <div>
          <p className="mb-1">Total Balance</p>
          <div className="flex items-center gap-2">
            <h2 className={`text-white text-2xl md:text-3xl font-semibold ${isUpdating ? 'animate-pulse text-green-300' : ''}`}>
              ${updatedTotalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </h2>
            <p className="text-green-300 text-xs bg-green-900/30 px-2 py-1 rounded-full">
              {monthlyChange}
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-y-4 md:gap-x-10 md:items-center">
          {updatedTokens.map((token, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm text-white px-5 py-2 pb-5 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20 shadow-sm"
            >
              <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center">
                <Image
                  src={token.iconPath}
                  width={24}
                  height={24}
                  alt={`${token.symbol} image`}
                  className="text-white"
                />
              </div>
              <div>
                <p className="text-sm">{token.symbol}</p>
                <p className={`text-white text-xl ${isUpdating && token.balance !== tokens.find(t => t.symbol === token.symbol)?.balance ? 'animate-pulse text-green-300' : ''}`}>
                  {token.balance} {token.symbol}
                </p>
                <p className="text-xs text-gray-100">≈ {parseFloat(token.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;