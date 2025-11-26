import React, { useState, useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "react-toastify";
import WalletCard from "./WalletCard";
import WalletAddress from "./WalletAddress";
import SendCryptoForm from "./SendCryptoForm";
import CryptoValueWidget from "./CryptoValueWidget";
import TokenTransactionTabs from "./TokenTransactionTabs";

import { ethers } from "ethers"
import { useCreateWallet } from "@/hooks/mutations";

// Sample crypto transactions data (kept for reference)
const sampleTransactions = [
  {
    id: "CTX-001",
    type: "receive",
    amount: 0.25,
    token: "BTC",
    date: "2023-11-28",
    address: "0x3a8b7c9d2e1f4a5b6c8d9e0f1a2b3c4d5e6f7a8b",
    status: "confirmed",
    hash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
  },
];

type CryptoRate = {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
};

// Update TokenBalance type to match WalletCard props
type TokenBalance = {
  symbol: string;
  balance: number; // Changed from string to number to match WalletCard.tsx
  value: string;
  iconPath: string;
  rate?: number;
  address?: string;
};

const CryptoWallet = () => {
  const { wallet, setWallet } = useUserStore();
  const [cryptoRates, setCryptoRates] = useState<CryptoRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const {mutate} = useCreateWallet()

  useEffect(() => {
    mutate(undefined,
      {onSuccess: (data) => {
      setWallet(data.wallet)
    }})
  }, [])
  
  // Fetch crypto rates from CoinGecko
  const fetchCryptoRates = async () => {
    setIsLoadingRates(true);
    try {
      const tokenIds = ["tether", "usd-coin", "bitcoin", "ethereum"];
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
      );
      const data = await response.json();
      
      const formattedRates = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
      }));
      
      setCryptoRates(formattedRates);
    } catch (error) {
      console.error("Error fetching crypto rates:", error);
    } finally {
      setIsLoadingRates(false);
    }
  };
  console.log(wallet)
  // Fetch rates on component mount and set up refresh interval
  useEffect(() => {
    fetchCryptoRates();
    
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchCryptoRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate token values based on current rates
  const getTokenValue = (symbol: string, rawBalance: string, decimals = 6): string => {
    try {
      const rate = cryptoRates.find((r) => r.symbol === symbol)?.price ?? 1;
      // Parse the balance directly if it's already formatted
      const formatted = rawBalance.includes('.') 
        ? parseFloat(rawBalance) 
        : parseFloat(ethers.formatUnits(rawBalance, decimals));
      return `${(formatted * rate).toFixed(2)}`;
    } catch (error) {
      console.error("Error formatting token value:", error);
      return "0.00";
    }
  };

  // Prepare data for wallet card
  const tokens: TokenBalance[] = [
    {
      symbol: "USDT",
      balance: parseFloat(wallet?.usdt?.balance?.includes('.') 
        ? wallet?.usdt?.balance || "0" 
        : ethers.formatUnits(wallet?.usdt?.balance || "0", 6)),
      value: getTokenValue("USDT", wallet?.usdt?.balance || "0", 6),
      iconPath: "/images/Virtual-Coin-Crypto-Tether--Streamline-Ultimate.png",
      rate: cryptoRates.find((r) => r.symbol === "USDT")?.price ?? 1,
      address: wallet?.address ?? "",
    },
    {
      symbol: "USDC",
      balance: parseFloat(wallet?.usdc?.balance?.includes('.') 
        ? wallet?.usdc?.balance || "0" 
        : ethers.formatUnits(wallet?.usdc?.balance || "0", 6)),
      value: getTokenValue("USDC", wallet?.usdc?.balance || "0", 6),
      iconPath: "/images/Virtual-Coin-Crypto-Usd--Streamline-Ultimate.png",
      rate: cryptoRates.find((r) => r.symbol === "USDC")?.price ?? 1,
      address: wallet?.address ?? "",
    },
  ];
  
  // Calculate total balance based on current rates
  const totalBalance = tokens.reduce((sum, token) => {
    const rate = cryptoRates.find(rate => rate.symbol === token.symbol)?.price || 1;
    return sum + (token.balance * rate);
  }, 0);

  // Prepare data for wallet addresses
  const addresses = [
    {
      symbol: "USDT",
      iconPath: "/images/Virtual-Coin-Crypto-Tether--Streamline-Ultimate.png",
      address: wallet?.address || "",
      status: "Active",
    },
    {
      symbol: "USDC",
      iconPath: "/images/Virtual-Coin-Crypto-Usd--Streamline-Ultimate.png",
      address: wallet?.address || "",
      status: "Active",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("Text copied");
  };

  return (
    <div>
      {/* Crypto Wallet Content */}
      <div className="grid md:grid-cols-6 xl:grid-cols-12 gap-5 mb-8 md:justify-items-end wallet-card">
        <div className="w-full h-full md:col-span-8 md:order-2 xl:order-1">
          <WalletCard
            totalBalance={totalBalance}
            monthlyChange="+ $3,245.50 this month"
            tokens={tokens}
            gradientColors={{
              from: "blue-600",
              to: "blue-900",
            }}
          />
        </div>
        <div className="w-full md:col-span-4 md:order-1 xl:order-2 self-end">
          <WalletAddress
            addresses={addresses}
            copyToClipboard={copyToClipboard}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-6">
          {/* Send Crypto Form */}
          <SendCryptoForm 
            availableTokens={tokens}
            cryptoRates={cryptoRates}
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          {/* Crypto Value Widget */}
          <CryptoValueWidget
            tokens={["tether", "usd-coin", "bitcoin", "ethereum"]}
            rates={cryptoRates}
            isLoading={isLoadingRates}
            onRefresh={fetchCryptoRates}
          />
        </div>
      </div>

      {/* Token-specific Transaction Tabs */}
      <TokenTransactionTabs />
    </div>
  );
};

export default CryptoWallet;