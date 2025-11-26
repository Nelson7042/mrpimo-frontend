"use client";

import React from 'react';
import { CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';

interface TopUpSuccessProps {
  amount: number;
  transactionId: string;
  onClose: () => void;
  onBackToWallet: () => void;
}

export default function TopUpSuccess({ 
  amount, 
  transactionId, 
  onClose, 
  onBackToWallet 
}: TopUpSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
      <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Top-up Successful!
          </h2>
          <p className="text-gray-600">
            Your wallet has been topped up successfully
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Amount Added</span>
          </div>
          <div className="text-3xl font-bold text-green-900">
            ${amount.toFixed(2)}
          </div>
          <div className="text-sm text-green-700 mt-2">
            Transaction ID: {transactionId}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Close
          </button>
          <button
            onClick={onBackToWallet}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Wallet
          </button>
        </div>
      </div>
    </div>
  );
}