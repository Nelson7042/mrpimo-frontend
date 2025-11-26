"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface Transaction {
  _id: string;
  type: 'topup_card' | 'topup_bank' | 'spend' | 'refund' | 'escrow_hold' | 'escrow_release' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

interface TransactionHistoryProps {
  onRefresh: () => void;
}

export default function TransactionHistory({ onRefresh }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (page = 1) => {
    try {
      const response = await fetchWithAuth(`http://localhost:5800/api/v1/wallets/transactions?page=${page}&limit=10`);
      const data = await response.json();

      if (data.data.transactions) {
        setTransactions(data.data.transactions);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.pages);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchTransactions(currentPage);
    onRefresh();
  };

  const handlePageChange = (page: number) => {
    setLoading(true);
    setCurrentPage(page);
    fetchTransactions(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading transactions...</div>
      ) : transactions && transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No transactions yet</div>
      ) : (
        <div className="h-96 overflow-y-auto space-y-3 pr-2">
          {transactions && transactions.map((transaction) => (
            <div key={transaction?._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {['topup_card', 'topup_bank', 'refund', 'transfer_in', 'escrow_release'].includes(transaction?.type) ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">{transaction?.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${['topup_card', 'topup_bank', 'refund', 'transfer_in', 'escrow_release'].includes(transaction?.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {['topup_card', 'topup_bank', 'refund', 'transfer_in', 'escrow_release'].includes(transaction?.type) ? '+' : '-'}${transaction?.amount.toFixed(2)}
                </p>
                <p className={`text-xs ${getStatusColor(transaction?.status)}`}>
                  {transaction?.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({total} total)
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}