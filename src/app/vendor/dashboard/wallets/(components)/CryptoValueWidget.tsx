import React, { useState, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

type CryptoRate = {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
};

type CryptoValueWidgetProps = {
  tokens: string[];
  rates?: CryptoRate[];
  isLoading?: boolean;
  onRefresh?: () => void;
};

const CryptoValueWidget = ({ tokens, rates = [], isLoading = false, onRefresh }: CryptoValueWidgetProps) => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (rates.length > 0) {
      setLastUpdated(new Date());
    }
  }, [rates]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-8 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm md:text-lg font-semibold">Current Crypto Prices</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={onRefresh}
            className="text-gray-500 hover:text-blue-600"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <a 
            href="https://www.coingecko.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Powered by CoinGecko <ExternalLink size={12} />
          </a>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Token</th>
              <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Price (USD)</th>
              <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && rates.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">Loading rates...</td>
              </tr>
            ) : rates.length > 0 ? (
              rates.map((crypto) => (
                <tr key={crypto.symbol} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium">{crypto.symbol}</td>
                  <td className="py-3 px-4 text-sm text-right">${crypto.price.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-sm text-right ${
                    crypto.change24h >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {crypto.change24h >= 0 ? "+" : ""}{crypto.change24h.toFixed(2)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">No rates available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {lastUpdated && (
        <div className="text-xs text-gray-500 mt-2 text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default CryptoValueWidget;