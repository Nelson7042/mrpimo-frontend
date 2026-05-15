"use client";
import {
  Wallet, ArrowDownLeft, Info, ChevronDown, ChevronUp
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import CryptoWallet from "./(components)/CryptoWallet";
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import WalletSettings from '@/components/wallet/WalletSettings';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import PaymentMethodManager from '@/components/wallet/PaymentMethodManager';
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { useVendorStore } from "@/stores/useVendorStore";
import { getCurrencySymbol } from "@/utils/currency";


type Props = {};

type WalletType = "fiat" | "crypto";

interface EscrowItem {
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  createdAt: string;
  orderStatus?: string;
}

interface VendorEscrow {
  total: number;
  currency: string;
  count: number;
  breakdown: EscrowItem[];
}

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
  const [showEscrowDetails, setShowEscrowDetails] = useState(false);
  const [walletData, setWalletData] = useState<WalletData>({ 
    balances: { available: 0, pending: 0, escrow: 0, frozen: 0 }, 
    currency: 'USD' 
  });
  const [vendorEscrow, setVendorEscrow] = useState<VendorEscrow>({ total: 0, currency: 'USD', count: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const { vendor } = useVendorStore();

  useEffect(() => {
    fetchWalletData();
    if (vendor?._id) fetchVendorEscrow();
  }, [vendor?._id]);

  const fetchWalletData = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/wallets/user`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setWalletData(data.wallet);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorEscrow = async () => {
    if (!vendor?._id) return;
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/vendors/${vendor._id}/wallet`);
      const data = await response.json();
      if (data.success && data.escrow) {
        setVendorEscrow(data.escrow);
      }
    } catch (error) {
      console.error('Failed to fetch vendor escrow:', error);
    }
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg py-4 lg:p-6 min-h-screen font-roboto">
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
            <div className="bg-blue-500  text-white rounded-lg p-4 md:p-6 mb-6">
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
                  {vendorEscrow.total > 0 && (
                    <p className="text-blue-200 text-sm">
                      {getCurrencySymbol(vendorEscrow.currency)}{vendorEscrow.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending from orders ({vendorEscrow.count} order{vendorEscrow.count > 1 ? 's' : ''})
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

            {/* Vendor Escrow Explanation */}
            {vendorEscrow.total > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-900">
                        {getCurrencySymbol(vendorEscrow.currency)}{vendorEscrow.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending from {vendorEscrow.count} order{vendorEscrow.count > 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => setShowEscrowDetails(!showEscrowDetails)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                      >
                        {showEscrowDetails ? 'Hide' : 'View'} details
                        {showEscrowDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Earnings held until orders are delivered and confirmed by buyers
                    </p>
                    {showEscrowDetails && (
                      <div className="mt-3 border-t border-blue-200 pt-3 space-y-2">
                        <p className="text-xs font-medium text-blue-800 uppercase">Orders pending release</p>
                        {vendorEscrow.breakdown.map((item) => (
                          <div key={item.orderId} className="flex items-center justify-between bg-white rounded-md px-3 py-2 text-sm">
                            <span className="text-gray-700">
                              Order #{typeof item.orderId === 'string' ? item.orderId.slice(-8) : item.orderId}
                              {item.orderStatus && <span className="text-xs text-gray-500 ml-2">({item.orderStatus})</span>}
                            </span>
                            <span className="font-medium text-gray-900">{getCurrencySymbol(item.currency)}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
