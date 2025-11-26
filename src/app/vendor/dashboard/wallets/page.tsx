"use client";
import {
  Wallet, ArrowDownLeft
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import CryptoWallet from "./(components)/CryptoWallet";
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import WalletSettings from '@/components/wallet/WalletSettings';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import PaymentMethodManager from '@/components/wallet/PaymentMethodManager';
import { fetchWithAuth } from "@/utils/fetchWithAuth";

type Props = {};

type WalletType = "fiat" | "crypto";

interface WalletData {
  balances: {
    available: number;
    pending: number;
    escrow: number;
    frozen: number;
  };
  currency: string;
}

const WalletPage = (props: Props) => {
  const [activeWallet, setActiveWallet] = useState<WalletType>("fiat");
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [walletData, setWalletData] = useState<WalletData>({ 
    balances: { available: 0, pending: 0, escrow: 0, frozen: 0 }, 
    currency: 'USD' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5800/api/v1/wallets/user', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('Wallet data fetched:', data);
      if (data.success) {
        setWalletData(data.wallet);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg py-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 md:px-4 lg:px-5">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">My Wallet</h1>
            <p className="text-sm text-gray-500">
              Manage your wallet and track your income
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowWithdrawal(true)}
              className="flex px-4 py-2 items-center gap-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <div>Withdraw</div>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex px-4 py-2 items-center gap-2 bg-[#002f7a] text-white rounded-md hover:bg-blue-800"
            >
              <div>Settings</div>
            </button>
          </div>
        </div>

        {/* Wallet Type Selector */}
        <div className="flex items-center gap-x-2 mb-6 ">
          <button
            className={`flex w-1/2 md:w-auto cursor-pointer items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg shadow-sm transition-colors duration-150 ${
              activeWallet === "fiat"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => setActiveWallet("fiat")}
          >
            <Wallet size={20} />
            <span className="font-medium">Fiat Wallet</span>
          </button>
          <button
            className={`flex cursor-pointer w-1/2 md:w-auto items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg shadow-sm transition-colors duration-150 ${
              activeWallet === "crypto"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => setActiveWallet("crypto")}
          >
            <Image
              src="/images/wallet.png"
              height={20}
              width={20}
              alt="crypto wallet"
              className="object-contain"
            />
            <span className="font-medium">Crypto Wallet</span>
          </button>
        </div>

        {activeWallet === "fiat" ? (
          <div>
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Available Balance</p>
                  <p className="text-3xl font-bold">${walletData?.balances?.available.toFixed(2)}</p>
                  {walletData?.balances?.pending > 0 && (
                    <p className="text-blue-200 text-sm mt-1">
                      ${walletData?.balances?.pending.toFixed(2)} pending
                    </p>
                  )}
                  {walletData?.balances?.escrow > 0 && (
                    <p className="text-blue-200 text-sm">
                      ${walletData?.balances?.escrow.toFixed(2)} in escrow
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowPaymentMethods(true)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  Payment Methods
                </button>
              </div>
            </div>
            
            {/* Transaction History */}
            <TransactionHistory onRefresh={fetchWalletData} />
          </div>
        ) : (
          <CryptoWallet />
        )}

        {/* Modals */}
        {showWithdrawal && (
          <WithdrawalModal
            onClose={() => setShowWithdrawal(false)}
            onSuccess={fetchWalletData}
          />
        )}
        {showSettings && (
          <WalletSettings onClose={() => setShowSettings(false)} />
        )}
        {showPaymentMethods && (
          <PaymentMethodManager onClose={() => setShowPaymentMethods(false)} />
        )}
      </div>
    </div>
  );
};

export default WalletPage;
