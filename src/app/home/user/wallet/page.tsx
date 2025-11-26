"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, ChevronDown, Settings, Plus, ArrowRight, CreditCard, Building2, ShoppingCart, RefreshCw, Lock, Unlock, ArrowUpRight, ArrowDownLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"
import TopUpModal from '@/components/wallet/TopUpModal'
import PaymentMethodManager from '@/components/wallet/PaymentMethodManager'
import WalletSettings from '@/components/wallet/WalletSettings'
import { useWalletBalance, useWalletTransactions, usePaymentMethods, IWalletTransaction, TransactionFilters } from '@/hooks/useWallet'

const getTransactionIcon = (type: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'topup_card': CreditCard,
    'topup_bank': Building2,
    'spend': ShoppingCart,
    'refund': RefreshCw,
    'escrow_hold': Lock,
    'escrow_release': Unlock,
    'transfer_in': ArrowDownLeft,
    'transfer_out': ArrowUpRight,
  };
  return iconMap[type] || CreditCard;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
};

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(false)
  const [showTopUp, setShowTopUp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 10,
    dateRange: 'week'
  })
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)

  const router = useRouter()
  
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useWalletBalance()
  console.log(walletData)
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(filters)
  console.log(transactionsData)
  const { data: paymentMethodsData } = usePaymentMethods()

  const handleRefresh = () => {
    refetchWallet()
  }

  // Listen for payment methods modal trigger
  useEffect(() => {
    const handleOpenPaymentMethods = () => {
      setShowPaymentMethods(true)
    }
    window.addEventListener('openPaymentMethods', handleOpenPaymentMethods)
    return () => window.removeEventListener('openPaymentMethods', handleOpenPaymentMethods)
  }, [])

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDateFilter(false)
      setShowTypeFilter(false)
      setShowStatusFilter(false)
    }
    if (showDateFilter || showTypeFilter || showStatusFilter) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDateFilter, showTypeFilter, showStatusFilter])

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/my-cart" },
    { label: "Auction", href: null},
  ];
  
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
     router.push(item?.href);
    }
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={manualBreadcrumbs}
          onItemClick={handleBreadcrumbClick}
          className="mb-4 text-xs sm:text-sm"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold break-words">My Wallet</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <p className="text-blue-100 text-sm">Available Balance</p>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <p className="text-2xl sm:text-3xl font-bold break-all">
                  {showBalance ? `$${walletData?.wallet?.balances?.available?.toFixed(2) || '0.00'}` : "$****.**"}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {(walletData?.wallet?.balances?.pending || 0) > 0 && (
                <p className="text-blue-200 text-sm mt-1">
                  ${(walletData?.wallet?.balances?.pending || 0).toFixed(2)} pending
                </p>
              )}
              {(walletData?.wallet?.balances?.escrow || 0) > 0 && (
                <p className="text-blue-200 text-sm">
                  ${(walletData?.wallet?.balances?.escrow || 0).toFixed(2)} in escrow
                </p>
              )}
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Top Up
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setShowPaymentMethods(true)}
            className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
          >
            <div className="text-left">
              <p className="font-medium text-sm sm:text-base">Payment Methods</p>
              <p className="text-xs sm:text-sm text-gray-600">Manage cards & banks</p>
            </div>
          </button>
          <button className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3">
            <div className="text-left">
              <p className="font-medium text-sm sm:text-base">Send Money</p>
              <p className="text-xs sm:text-sm text-gray-600">Transfer to other users</p>
            </div>
          </button>
        </div>

        {/* Wallet Activities */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Wallet Activities</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Date Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {filters.dateRange === 'week' ? 'This Week' : 
                 filters.dateRange === 'month' ? 'This Month' : 
                 filters.dateRange === 'year' ? 'This Year' : 'All Time'} 
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {showDateFilter && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    {['week', 'month', 'year', 'all'].map(range => (
                      <button
                        key={range}
                        onClick={() => {
                          setFilters({...filters, dateRange: range, page: 1})
                          setShowDateFilter(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        {range === 'week' ? 'This Week' : 
                         range === 'month' ? 'This Month' : 
                         range === 'year' ? 'This Year' : 'All Time'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Type Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowTypeFilter(!showTypeFilter)}
                className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {!filters.type ? 'All Types' : 
                 filters.type === 'topup_card' ? 'Card Top-up' :
                 filters.type === 'topup_bank' ? 'Bank Top-up' :
                 filters.type === 'spend' ? 'Spend' :
                 filters.type === 'refund' ? 'Refund' :
                 filters.type === 'transfer_in' ? 'Transfer In' : 'Transfer Out'}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {showTypeFilter && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilters({...filters, type: undefined, page: 1})
                        setShowTypeFilter(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      All Types
                    </button>
                    {[{value: 'topup_card', label: 'Card Top-up'}, {value: 'topup_bank', label: 'Bank Top-up'}, {value: 'spend', label: 'Spend'}, {value: 'refund', label: 'Refund'}, {value: 'transfer_in', label: 'Transfer In'}, {value: 'transfer_out', label: 'Transfer Out'}].map(type => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setFilters({...filters, type: type.value, page: 1})
                          setShowTypeFilter(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {!filters.status ? 'All Status' : 
                 filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {showStatusFilter && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilters({...filters, status: undefined, page: 1})
                        setShowStatusFilter(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      All Status
                    </button>
                    {['completed', 'pending', 'processing', 'failed', 'cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilters({...filters, status, page: 1})
                          setShowStatusFilter(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
              <button className="flex items-center text-blue-600 text-sm font-medium hover:underline">
                See All <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    SN
                  </th>
                  <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    ACTIVITIES
                  </th>
                  <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    AMOUNT
                  </th>
                  <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    DATE
                  </th>
                  <th scope="col" className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactionsLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="ml-4 h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    </td>
                  </tr>
                ))
              ) :  (transactionsData?.data?.transactions?.length || 0 ) > 0 ? (
                transactionsData?.data?.transactions?.map((transaction: IWalletTransaction, index: number) => (
                  <tr key={transaction.id}>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {((filters.page || 1) - 1) * (filters.limit || 10) + index + 1}
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-md flex items-center justify-center">
                          {(() => {
                            const IconComponent = getTransactionIcon(transaction.type);
                            return <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
                          })()}
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                            {transaction.description}
                          </div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            <span className={transaction.type.includes('topup') || transaction.type === 'transfer_in' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type.includes('topup') || transaction.type === 'transfer_in' || transaction.type === 'refund' ? '+' : '-'}
                              ${transaction.amount.toLocaleString()}
                            </span>
                            <span className="mx-1">•</span>
                            {formatDate(transaction.createdAt.toString())}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 hidden sm:table-cell">
                      <span className={transaction.type.includes('topup') || transaction.type === 'transfer_in' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type.includes('topup') || transaction.type === 'transfer_in' || transaction.type === 'refund' ? '+' : '-'}
                        ${transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700 hidden md:table-cell">
                      {formatDate(transaction.createdAt.toString())}
                    </td>
                    <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <span className={`px-1.5 sm:px-2 py-1 text-xs rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-2 sm:px-4 py-8 text-center text-gray-500 text-sm">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {(transactionsData?.data?.pagination?.pages || 0) > 1 && (
            <div className="flex justify-center items-center p-4 sm:p-6 border-t border-gray-200">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setFilters({...filters, page: Math.max(1, (filters.page || 1) - 1)})}
                  disabled={(filters.page || 1) === 1}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-md disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(3, transactionsData?.data?.pagination?.pages || 1) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button 
                      key={page}
                      onClick={() => setFilters({...filters, page})}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md ${
                        (filters.page || 1) === page 
                          ? 'text-white bg-orange-400 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {(transactionsData?.data?.pagination?.pages || 0) > 3 && (
                  <>
                    <span className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700">...</span>
                    <button 
                      onClick={() => setFilters({...filters, page: transactionsData?.data?.pagination?.pages || 1})}
                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      {transactionsData?.data?.pagination?.pages || 1}
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setFilters({...filters, page: Math.min(transactionsData?.data?.pagination?.pages || 1, (filters.page || 1) + 1)})}
                  disabled={(filters.page || 1) === (transactionsData?.data?.pagination?.pages || 1)}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showTopUp && (
          <TopUpModal
            onClose={() => setShowTopUp(false)}
            onSuccess={handleRefresh}
            paymentMethods={paymentMethodsData?.paymentMethods || []}
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
  )
}
