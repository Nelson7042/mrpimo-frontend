import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";

type CryptoRate = {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
};

type SendCryptoFormProps = {
  availableTokens: {
    symbol: string;
    balance: number;
    iconPath: string;
    rate?: number;
  }[];
  cryptoRates?: CryptoRate[];
};

const SendCryptoForm = ({ availableTokens, cryptoRates = [] }: SendCryptoFormProps) => {
  const [selectedToken, setSelectedToken] = useState(availableTokens[0]?.symbol || "");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [usdValue, setUsdValue] = useState("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate USD value based on amount and selected token
  useEffect(() => {
    if (!amount || !selectedToken) {
      setUsdValue("0.00");
      return;
    }
    
    // First check if the token has a rate in availableTokens
    const tokenData = availableTokens.find(token => token.symbol === selectedToken);
    if (tokenData?.rate) {
      setUsdValue((parseFloat(amount) * tokenData.rate).toFixed(2));
      return;
    }
    
    // Then check if we have the rate in cryptoRates
    const rateData = cryptoRates.find(rate => rate.symbol === selectedToken);
    if (rateData) {
      setUsdValue((parseFloat(amount) * rateData.price).toFixed(2));
      return;
    }
    
    // Fallback to API call if we don't have the rate
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${selectedToken.toLowerCase()}&vs_currencies=usd`
        );
        const data = await response.json();
        
        if (data[selectedToken.toLowerCase()]) {
          const price = data[selectedToken.toLowerCase()].usd;
          setUsdValue((parseFloat(amount) * price).toFixed(2));
        }
      } catch (error) {
        console.error("Error fetching price:", error);
      }
    };

    fetchPrice();
  }, [amount, selectedToken, availableTokens, cryptoRates]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate sending crypto
    setTimeout(() => {
      toast.success(`Successfully sent ${amount} ${selectedToken} to ${recipientAddress}`);
      setAmount("");
      setRecipientAddress("");
      setIsLoading(false);
    }, 1500);
  };

  const selectedTokenData = availableTokens.find(token => token.symbol === selectedToken);

  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-8 w-full border border-blue-100">
      <h2 className="text-xl font-semibold mb-5 text-blue-800 flex items-center">
        <Send size={20} className="mr-2 text-blue-600" />
        Send Crypto
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Token
            </label>
            <div className="relative" ref={dropdownRef}>
              <div 
                className="w-full border border-gray-300 rounded-md px-3 py-2 lg:px-1 bg-white flex items-center justify-between cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                tabIndex={0}
              >
                <div className="flex items-center">
                  {selectedTokenData && (
                    <div className="flex items-center">
                      <div className="relative h-6 w-6 mr-2 lg:hidden">
                        <Image
                          src={selectedTokenData.iconPath}
                          alt={selectedTokenData.symbol}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                      <span className="text-sm lg:text-xs">{selectedTokenData.symbol} <span className="md:hidden">- Balance</span>: {selectedTokenData.balance}</span>
                    </div>
                  )}
                </div>
                <svg className={`h-5 w-5 text-gray-500 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </div>
              
              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {availableTokens.map((token) => (
                    <div
                      key={token.symbol}
                      className={`px-3 py-2 cursor-pointer flex items-center hover:bg-blue-50 ${selectedToken === token.symbol ? 'bg-blue-100' : ''}`}
                      onClick={() => {
                        setSelectedToken(token.symbol);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="relative h-6 w-6 mr-2 lg:hidden">
                        <Image
                          src={token.iconPath}
                          alt={token.symbol}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                      <span className="text-sm lg:text-xs">{token.symbol} <span className="md:hidden">- Balance</span>: {token.balance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="0.00"
                required
                min="0.000001"
                step="0.000001"
                max={selectedTokenData?.balance || 0}
              />
              <div className="absolute right-3 top-0 text-xs text-gray-500">
                ≈ ${parseFloat(usdValue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
              </div>
            </div>
            <div className="text-xs lg:text-[10px] text-gray-500 mt-1">
              <a 
                href="https://www.coingecko.com/en/coins/tether" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Check current rates on CoinGecko
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0x..."
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Send size={18} />
                  Send {selectedToken}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SendCryptoForm;