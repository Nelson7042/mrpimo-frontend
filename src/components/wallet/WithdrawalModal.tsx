"use client";

import React, { useState } from 'react';
import { X, CreditCard, Building, Bitcoin, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import { CRYPTO_PAYMENTS_ENABLED } from '@/config/featureFlags';

interface WithdrawalModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WithdrawalModal({ onClose, onSuccess }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank_transfer' | 'stripe' | 'crypto'>('bank_transfer');
  const [accountDetails, setAccountDetails] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountName: '',
    stripeAccountId: '',
    cryptoAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleWithdrawal = async () => {
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          accountDetails
        })
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setSuccess(true);
        onSuccess();
      } else {
        setError(data.message || data.error || 'Withdrawal failed. Please try again.');
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 transition-opacity bg-[#29292938] flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Requested</h3>
            <p className="text-gray-600 mb-1">
              Your withdrawal of <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span> is being processed.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You will be notified once the withdrawal is complete.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 transition-opacity bg-[#29292938]  flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Withdraw Funds</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="Enter amount"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Withdrawal Method</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="bank_transfer"
                  checked={method === 'bank_transfer'}
                  onChange={(e) => setMethod(e.target.value as any)}
                  disabled={loading}
                />
                <Building className="w-4 h-4" />
                Bank Transfer
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="stripe"
                  checked={method === 'stripe'}
                  onChange={(e) => setMethod(e.target.value as any)}
                  disabled={loading}
                />
                <CreditCard className="w-4 h-4" />
                Stripe Account
              </label>
              {CRYPTO_PAYMENTS_ENABLED && (
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="crypto"
                    checked={method === 'crypto'}
                    onChange={(e) => setMethod(e.target.value as any)}
                    disabled={loading}
                  />
                  <Bitcoin className="w-4 h-4" />
                  Crypto Wallet
                </label>
              )}
            </div>
          </div>

          {method === 'bank_transfer' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Bank Name"
                value={accountDetails.bankName}
                onChange={(e) => setAccountDetails({...accountDetails, bankName: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accountDetails.accountNumber}
                onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Routing Number"
                value={accountDetails.routingNumber}
                onChange={(e) => setAccountDetails({...accountDetails, routingNumber: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Account Name"
                value={accountDetails.accountName}
                onChange={(e) => setAccountDetails({...accountDetails, accountName: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          )}

          {method === 'stripe' && (
            <input
              type="text"
              placeholder="Stripe Account ID"
              value={accountDetails.stripeAccountId}
              onChange={(e) => setAccountDetails({...accountDetails, stripeAccountId: e.target.value})}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          )}

          {CRYPTO_PAYMENTS_ENABLED && method === 'crypto' && (
            <input
              type="text"
              placeholder="Crypto Wallet Address"
              value={accountDetails.cryptoAddress}
              onChange={(e) => setAccountDetails({...accountDetails, cryptoAddress: e.target.value})}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleWithdrawal}
            disabled={loading || !amount}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Request Withdrawal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
