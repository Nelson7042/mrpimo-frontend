"use client";

import React, { useState } from 'react';
import { X, CreditCard, Building, Bitcoin } from 'lucide-react';

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

  const handleWithdrawal = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          method,
          accountDetails
        })
      });
      
      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                />
                <CreditCard className="w-4 h-4" />
                Stripe Account
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="crypto"
                  checked={method === 'crypto'}
                  onChange={(e) => setMethod(e.target.value as any)}
                />
                <Bitcoin className="w-4 h-4" />
                Crypto Wallet
              </label>
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
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accountDetails.accountNumber}
                onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Routing Number"
                value={accountDetails.routingNumber}
                onChange={(e) => setAccountDetails({...accountDetails, routingNumber: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Account Name"
                value={accountDetails.accountName}
                onChange={(e) => setAccountDetails({...accountDetails, accountName: e.target.value})}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            />
          )}

          {method === 'crypto' && (
            <input
              type="text"
              placeholder="Crypto Wallet Address"
              value={accountDetails.cryptoAddress}
              onChange={(e) => setAccountDetails({...accountDetails, cryptoAddress: e.target.value})}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          
          <button
            onClick={handleWithdrawal}
            disabled={loading || !amount}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  );
}