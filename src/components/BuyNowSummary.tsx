"use client";

import React, { useEffect, useState } from 'react';
import { X, Package, CreditCard, Wallet, Shield } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface BuyNowSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onPayWithWallet: () => void;
  onPayWithStripe: () => void;
  orderData: {
    product: {
      name: string;
      images: string[];
      vendor: { businessName: string };
    };
    variant: {
      name: string;
      value?: string;
      price: number;
    };
    quantity: number;
    pricing: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
    };
    totalAmount: number;
    currency: string;
    currencySymbol: string;
  };
  walletBalance?: number;
  isProcessing: boolean;
}

export default function BuyNowSummary({
  isOpen,
  onClose,
  onPayWithWallet,
  onPayWithStripe,
  orderData,
  walletBalance: initialWalletBalance,
  isProcessing
}: BuyNowSummaryProps) {
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance || 0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  useEffect(() => {
    if (isOpen && !initialWalletBalance) {
      fetchWalletBalance();
    }
  }, [isOpen]);

  const fetchWalletBalance = async () => {
    setIsLoadingWallet(true);
    try {
      const response = await fetchWithAuth('http://localhost:5800/api/v1/wallets/balance');
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  if (!isOpen) return null;

  const { product, variant, quantity, totalAmount, currency, currencySymbol } = orderData;
  const canPayWithWallet = walletBalance >= totalAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Order Summary</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details */}
        <div className="border rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 line-clamp-2">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.vendor.businessName}</p>
              <div className="flex gap-2 mt-1">
                {variant.value && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                    {variant.name}: 
                    {/^#[0-9A-F]{6}$/i.test(variant.value) ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300" 
                          style={{ backgroundColor: variant.value }}
                        />
                        {variant.value}
                      </>
                    ) : (
                      variant.value
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <span className="text-sm text-gray-600">Quantity: {quantity}</span>
            <span className="font-medium">{currencySymbol}{variant.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="border rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{currencySymbol}{orderData.pricing.subtotal.toFixed(2)}</span>
          </div>
          {orderData.pricing.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{currencySymbol}{orderData.pricing.tax.toFixed(2)}</span>
            </div>
          )}
          {orderData.pricing.shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">{currencySymbol}{orderData.pricing.shipping.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-blue-900">
                {currencySymbol}{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Wallet Balance:</span>
            {isLoadingWallet ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <span className={`font-medium ${canPayWithWallet ? 'text-green-600' : 'text-red-600'}`}>
                {currencySymbol}{(walletBalance || 0).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          <button
            onClick={onPayWithWallet}
            disabled={!canPayWithWallet || isProcessing}
            className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
              canPayWithWallet 
                ? 'border-green-500 bg-green-50 hover:bg-green-100 text-green-700' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Pay with Wallet</div>
              <div className="text-sm opacity-75">
                {canPayWithWallet ? 'Instant payment' : 'Insufficient balance'}
              </div>
            </div>
          </button>

          <button
            onClick={onPayWithStripe}
            disabled={isProcessing}
            className="w-full p-4 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-3 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Pay with other methods</div>
            </div>
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-xs">
            <Shield className="w-3 h-3" />
            <span>Secure payment processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}