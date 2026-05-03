"use client";

import React, { useState } from 'react';
import { X, Send, DollarSign, User, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

interface TransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ onClose, onSuccess }: TransferModalProps) {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTransfer = async () => {
    setError('');

    if (!recipientId.trim()) {
      setError('Please enter a recipient email or user ID');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/wallet/transfer`, {
        method: 'POST',
        body: JSON.stringify({
          recipientId: recipientId.trim(),
          amount: numAmount,
          ...(description.trim() && { description: description.trim() }),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setSuccess(true);
        onSuccess();
      } else {
        setError(data.message || data.error || 'Transfer failed. Please try again.');
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err?.message || 'Transfer failed. Please try again.');
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transfer Successful</h3>
            <p className="text-gray-600 mb-1">
              You sent <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              to {recipientId}
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
    <div className="fixed inset-0 transition-opacity bg-[#29292938] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Send Money</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Recipient Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Recipient</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={recipientId}
                onChange={(e) => {
                  setRecipientId(e.target.value);
                  setError('');
                }}
                placeholder="Email or User ID"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Description Input (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading || !recipientId.trim() || !amount}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
