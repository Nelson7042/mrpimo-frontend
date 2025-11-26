"use client";

import React, { useState } from 'react';
import { X, CreditCard, Building2, DollarSign } from 'lucide-react';
import { useInitiateTopUp } from '@/hooks/mutations';
import { toast } from 'react-toastify';
import PaymentProcessor from './PaymentProcessor';
import { loadStripe } from '@stripe/stripe-js';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface PaymentMethod {
  id: string;
  type: "card" | "bank_transfer" | "mobile_money";
  provider: "paystack" | "stripe" | "alipay" | "wechat";
  region: "africa" | "europe" | "north_america" | "china" | "uk";
  metadata: {
    last4?: string;
    brand?: string;
    bankName?: string;
    accountNumber?: string;
    stripePaymentMethodId?: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

interface TopUpModalProps {
  onClose: () => void;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

export default function TopUpModal({ onClose, paymentMethods, onSuccess }: TopUpModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank_transfer'>('card');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    provider: 'stripe' | 'paystack';
    clientSecret?: string;
    authorizationUrl?: string;
  } | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);

  const topUpMutation = useInitiateTopUp();

  const cardMethods = paymentMethods.filter(m => m.type === 'card');
  const bankMethods = paymentMethods.filter(m => m.type === 'bank_transfer');

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  const handleInitiateTopUp = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (selectedMethod === 'card' && !selectedPaymentMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    // Find the selected payment method to get the correct ID
    const selectedPaymentMethod = cardMethods.find(m => m.id === selectedPaymentMethodId);
    const paymentMethodId = selectedPaymentMethod?.provider === 'stripe' 
      ? selectedPaymentMethod.metadata.stripePaymentMethodId || selectedPaymentMethodId
      : selectedPaymentMethodId;

    topUpMutation.mutate({
      amount: numAmount,
      method: selectedMethod,
      paymentMethodId: selectedMethod === 'card' ? paymentMethodId : undefined
    }, {
      onSuccess: (data) => {
        console.log('Top-up response:', data);
        if (data.success) {
          setTransactionData(data.data);
          
          if (selectedMethod === 'card') {
            // For saved cards, payment should be processed automatically
            if (data.data.status === 'succeeded') {
              toast.success('Payment successful! Wallet topped up.');
              onSuccess();
              onClose();
            } else if (data.data.provider === 'stripe' && data.data.clientSecret) {
              // Handle Stripe payment confirmation
              handleStripePayment(data.data.clientSecret, data.data.paymentMethodId);
            } else if (data.data.provider === 'paystack' && data.data.authorizationUrl) {
              setPaymentData({
                provider: 'paystack',
                authorizationUrl: data.data.authorizationUrl
              });
              setShowPaymentForm(true);
            }
          } else if (selectedMethod === 'bank_transfer') {
            toast.success('Bank transfer details generated');
            onSuccess();
            onClose();
          }
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to initiate top-up');
      }
    });
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Wallet topped up.');
    onSuccess();
    onClose();
  };

  const confirmPaymentWithBackend = async (paymentIntentId: string) => {
    try {
      console.log('Confirming payment with backend, paymentIntentId:', paymentIntentId);
      
      const response = await fetchWithAuth('http://localhost:5800/api/v1/wallets/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId })
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Backend confirmation response:', data);
      
      if (response.ok && data.success) {
        toast.success(`${data.message} New balance: $${data.data.newBalance.toFixed(2)}`);
        onClose();
        window.location.reload();
      } else {
        console.error('Backend error:', data);
        toast.error(data.message || 'Payment succeeded but failed to update wallet. Please contact support.');
      }
    } catch (error: any) {
      console.error('Backend confirmation error:', error);
      toast.error('Payment succeeded but failed to update wallet. Please contact support.');
    }
  };

  const handleStripePayment = async (clientSecret: string, paymentMethodId: string) => {
    try {
      // Initialize Stripe
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      });

      if (result.error) {
        console.error('❌ Payment failed:', result.error.message);
        toast.error(`Payment failed: ${result.error.message}`);
      } else if (result.paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded');
        // Confirm payment with backend
        await confirmPaymentWithBackend(result.paymentIntent.id);
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      toast.error(error.message || 'Payment processing failed');
    }
  };

  if (showPaymentForm && paymentData) {
    return (
      <PaymentProcessor
        provider={paymentData.provider}
        clientSecret={paymentData.clientSecret}
        authorizationUrl={paymentData.authorizationUrl}
        amount={parseFloat(amount)}
        onSuccess={handlePaymentSuccess}
        onCancel={() => {
          setShowPaymentForm(false);
          setPaymentData(null);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Top Up Wallet</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amount (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {quickAmounts.map(quickAmount => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Payment Method</label>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedMethod('card')}
              className={`w-full p-4 border rounded-lg text-left flex items-center gap-3 transition-colors ${
                selectedMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${selectedMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`} />
              <div>
                <span className={`font-medium ${selectedMethod === 'card' ? 'text-blue-600' : 'text-gray-900'}`}>
                  Credit/Debit Card
                </span>
                <p className="text-xs text-gray-500">Instant processing</p>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedMethod('bank_transfer')}
              className={`w-full p-4 border rounded-lg text-left flex items-center gap-3 transition-colors ${
                selectedMethod === 'bank_transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Building2 className={`w-5 h-5 ${selectedMethod === 'bank_transfer' ? 'text-blue-600' : 'text-gray-600'}`} />
              <div>
                <span className={`font-medium ${selectedMethod === 'bank_transfer' ? 'text-blue-600' : 'text-gray-900'}`}>
                  Bank Transfer
                </span>
                <p className="text-xs text-gray-500">1-3 business days</p>
              </div>
            </button>
          </div>
        </div>

        {/* Card Selection (if card method selected) */}
        {selectedMethod === 'card' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Select Card</label>
            {cardMethods.length > 0 ? (
              <div className="space-y-2">
                {cardMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethodId(method.id)}
                    className={`w-full p-3 border rounded-lg text-left flex items-center gap-3 transition-colors ${
                      selectedPaymentMethodId === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <div>
                      <span className="font-medium">
                        {method.metadata.brand} •••• {method.metadata.last4}
                      </span>
                      {method.isDefault && (
                        <span className="ml-2 text-xs text-blue-600">Default</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-3">No payment methods found</p>
                <button
                  onClick={() => {
                    onClose();
                    // This will trigger the payment methods modal from the parent
                    setTimeout(() => {
                      const event = new CustomEvent('openPaymentMethods');
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Payment Method
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bank Transfer Info */}
        {selectedMethod === 'bank_transfer' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Bank Transfer</h4>
                <p className="text-sm text-blue-700 mt-1">
                  You'll receive virtual bank account details to complete the transfer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInitiateTopUp}
            disabled={topUpMutation.isPending || !amount || (selectedMethod === 'card' && cardMethods.length === 0) || (selectedMethod === 'card' && cardMethods.length > 0 && !selectedPaymentMethodId)}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {topUpMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              `Top Up $${amount || '0'}`
            )}
          </button>
        </div>

        {/* Transaction Data Display (for bank transfer) */}
        {transactionData && selectedMethod === 'bank_transfer' && transactionData.vbanDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Bank Transfer Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-mono">{transactionData.vbanDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Routing Number:</span>
                <span className="font-mono">{transactionData.vbanDetails.routingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${amount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}