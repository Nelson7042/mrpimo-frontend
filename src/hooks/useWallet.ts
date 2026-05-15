import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import { useCallback } from 'react';

export const WALLET_BALANCE_QUERY_KEY = ['walletBalance'];

export interface IWalletTransaction {
  id: string;
  userId: string;
  type: 'topup_card' | 'topup_bank' | 'spend' | 'refund' | 'escrow_hold' | 'escrow_release' | 'transfer_in' | 'transfer_out';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  credited: boolean;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  paystackReference?: string;
  vbanDetails?: {
    accountNumber: string;
    routingNumber: string;
    reference: string;
    bankName: string;
    expiresAt: Date;
  };
  orderId?: string;
  subscriptionId?: string;
  transferToUserId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  dateRange?: string;
}

export interface IWallet {
  id: string;
  userId: string;
  balances: {
    available: number;
    pending: number;
    escrow: number;
    frozen: number;
  };
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fetch wallet balance
const fetchWalletBalance = async (): Promise<{ wallet: IWallet }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/user`);
  if (!response.ok) {
    throw new Error('Failed to fetch wallet balance');
  }
  return response.json();
};

export const useWalletBalance = () => {
  return useQuery({
    queryKey: WALLET_BALANCE_QUERY_KEY,
    queryFn: fetchWalletBalance,
    retry: 1,
  });
};

export const useInvalidateWalletBalance = () => {
  const queryClient = useQueryClient();
  const invalidateWalletBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
  }, [queryClient]);
  return invalidateWalletBalance;
};

// Fetch wallet transactions


const fetchWalletTransactions = async (filters: TransactionFilters = {}): Promise<{ data: { transactions: IWalletTransaction[], pagination: { page: number, limit: number, total: number, pages: number } } }> => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateRange) params.append('dateRange', filters.dateRange);
  
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/transactions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch wallet transactions');
  }
  const data = await response.json();
  return data;
};

export const useWalletTransactions = (filters: TransactionFilters = {}) => {
  return useQuery({
    queryKey: ['walletTransactions', JSON.stringify(filters)],
    queryFn: () => fetchWalletTransactions(filters),
    retry: 1,
    enabled: true,
  });
};

// Fetch payment methods
const fetchPaymentMethods = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/payment-methods`);
  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }
  return response.json();
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: fetchPaymentMethods,
    retry: 1,
  });
};

// Initialize Paystack payment
const initializePayment = async (paymentData: {
  email: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/paystack/initialize`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    throw new Error('Failed to initialize payment');
  }
  return response.json();
};

// Verify Paystack payment
const verifyPayment = async (reference: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/paystack/verify/${reference}`);
  if (!response.ok) {
    throw new Error('Failed to verify payment');
  }
  return response.json();
};

export const useInitializePayment = () => {
  return {
    initializePayment,
    verifyPayment
  };
};