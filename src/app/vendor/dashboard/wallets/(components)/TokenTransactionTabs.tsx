import React, { useState } from 'react';
import TokenTransactions from './TokenTransactions';
import useWalletTransactions from '@/hooks/useWalletTransactions';
import TransactionHeader from './TransactionHeader';

const TokenTransactionTabs = () => {
  const [activeTab, setActiveTab] = useState<'usdt' | 'usdc'>('usdt');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const { walletData, isLoading } = useWalletTransactions();

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('usdt')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'usdt'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            USDT Transactions
          </button>
          <button
            onClick={() => setActiveTab('usdc')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'usdc'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            USDC Transactions
          </button>
        </nav>
      </div>

      {/* Transaction Header */}
      <TransactionHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onDateChange={(date) => setFilterDate(date)}
        onDownload={() => {
          // Logic to download statement
          alert(`Downloading statement...`);
        }}
      />
      <div className="mt-4 bg-white rounded-lg p-4">
        {/* Tab Content */}
        {activeTab === 'usdt' && (
          <TokenTransactions
            tokenSymbol="USDT"
            transactions={(walletData?.usdt?.transactions || []).filter(tx => 
              filterDate ? new Date(tx.createdAt).toISOString().split('T')[0] === filterDate : true
            )}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'usdc' && (
          <TokenTransactions
            tokenSymbol="USDC"
            transactions={(walletData?.usdc?.transactions || []).filter(tx => 
              filterDate ? new Date(tx.createdAt).toISOString().split('T')[0] === filterDate : true
            )}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default TokenTransactionTabs;