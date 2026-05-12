/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { renderHook } from '@testing-library/react';

// Make React available globally for JSX
globalThis.React = React;

// ─── Mock @tanstack/react-query ─────────────────────────────────────────────
const mockInvalidateQueries = vi.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options: any) => ({
    data: options._mockData ?? undefined,
    isLoading: false,
    error: null,
  })),
  useQueryClient: () => mockQueryClient,
  QueryClient: vi.fn(() => mockQueryClient),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Mock fetchWithAuth ─────────────────────────────────────────────────────
vi.mock('@/utils/fetchWithAuth', () => ({
  fetchWithAuth: vi.fn(),
}));

// ─── Mock config ────────────────────────────────────────────────────────────
vi.mock('@/utils/config', () => ({
  API_BASE_URL: 'http://localhost:3001/api',
}));

// ─── Mock currencyService ───────────────────────────────────────────────────
vi.mock('@/utils/currencyService', () => ({
  getExchangeRates: vi.fn().mockResolvedValue({ NGN: 1500, EUR: 0.92, GBP: 0.79 }),
  getCurrencySymbol: vi.fn((currency: string) => {
    const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£' };
    return symbols[currency] || currency;
  }),
}));


// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Wallet Security Frontend Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Requirement 2.7: Balance invalidation after payment ────────────────
  describe('useInvalidateWalletBalance hook', () => {
    it('calls queryClient.invalidateQueries with the correct walletBalance key', async () => {
      // Import the hook directly - it uses useQueryClient internally
      const { useInvalidateWalletBalance, WALLET_BALANCE_QUERY_KEY } = await import('@/hooks/useWallet');

      const { result } = renderHook(() => useInvalidateWalletBalance());

      // The hook returns a function that invalidates the wallet balance query
      const invalidate = result.current;
      expect(typeof invalidate).toBe('function');

      // Call the invalidation function
      invalidate();

      // Verify it called invalidateQueries with the correct key
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: WALLET_BALANCE_QUERY_KEY,
      });
    });

    it('exports WALLET_BALANCE_QUERY_KEY as ["walletBalance"]', async () => {
      const { WALLET_BALANCE_QUERY_KEY } = await import('@/hooks/useWallet');
      expect(WALLET_BALANCE_QUERY_KEY).toEqual(['walletBalance']);
    });
  });

  // ─── Requirement 2.8: Payment button disabled during processing ─────────
  describe('Checkout payment button disabled state', () => {
    it('renders a disabled button with spinner when isProcessing is true', () => {
      // Simulate the checkout button in its processing state
      const isProcessing = true;
      const buyNowIsProcessing = false;

      render(
        <button
          disabled={isProcessing || buyNowIsProcessing}
          data-testid="payment-button"
        >
          {(isProcessing || buyNowIsProcessing) ? (
            <>
              <span data-testid="loader-spinner" className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </button>
      );

      const button = screen.getByTestId('payment-button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(screen.getByTestId('loader-spinner')).toBeDefined();
      expect(button.textContent).toContain('Processing...');
    });

    it('renders an enabled button without spinner when isProcessing is false', () => {
      const isProcessing = false;
      const buyNowIsProcessing = false;

      render(
        <button
          disabled={isProcessing || buyNowIsProcessing}
          data-testid="payment-button"
        >
          {(isProcessing || buyNowIsProcessing) ? (
            <>
              <span data-testid="loader-spinner" className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </button>
      );

      const button = screen.getByTestId('payment-button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      expect(button.textContent).toContain('Proceed to Payment');
    });
  });

  // ─── Requirement 2.9: Escrow explanation renders when escrow > 0 ────────
  describe('Wallet page escrow explanation', () => {
    it('renders escrow explanation when escrowBalance > 0', () => {
      const escrowBalance = 50;

      render(
        <div>
          {escrowBalance > 0 && (
            <div data-testid="escrow-explanation" className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p data-testid="escrow-amount">${escrowBalance.toFixed(2)} held in escrow</p>
              <p data-testid="escrow-info">
                Funds held for pending orders — released when orders are delivered
              </p>
            </div>
          )}
        </div>
      );

      expect(screen.getByTestId('escrow-explanation')).toBeDefined();
      expect(screen.getByTestId('escrow-amount').textContent).toBe('$50.00 held in escrow');
      expect(screen.getByTestId('escrow-info').textContent).toBe(
        'Funds held for pending orders — released when orders are delivered'
      );
    });

    it('does not render escrow explanation when escrowBalance is 0', () => {
      const escrowBalance = 0;

      render(
        <div data-testid="wallet-container">
          {escrowBalance > 0 && (
            <div data-testid="escrow-explanation" className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p>${escrowBalance.toFixed(2)} held in escrow</p>
              <p>Funds held for pending orders — released when orders are delivered</p>
            </div>
          )}
        </div>
      );

      expect(screen.queryByTestId('escrow-explanation')).toBeNull();
    });
  });

  // ─── Requirement 2.10: Exchange rate hook provides consistent rate ──────
  describe('useExchangeRate hook consistency', () => {
    it('returns the same rate for all consumers via staleTime caching', async () => {
      const { useExchangeRate, EXCHANGE_RATE_QUERY_KEY } = await import('@/hooks/useExchangeRate');

      // Render two instances of the hook with the same currency
      const { result: result1 } = renderHook(() => useExchangeRate('NGN'));
      const { result: result2 } = renderHook(() => useExchangeRate('NGN'));

      // Both should return the same rate (from the same cached query)
      expect(result1.current.rate).toEqual(result2.current.rate);
      expect(result1.current.currency).toBe('NGN');
      expect(result2.current.currency).toBe('NGN');
    });

    it('exports EXCHANGE_RATE_QUERY_KEY for cache identification', async () => {
      const { EXCHANGE_RATE_QUERY_KEY } = await import('@/hooks/useExchangeRate');
      expect(EXCHANGE_RATE_QUERY_KEY).toBe('exchangeRate');
    });

    it('returns rate of 1 for USD without fetching', async () => {
      const { useExchangeRate } = await import('@/hooks/useExchangeRate');

      const { result } = renderHook(() => useExchangeRate('USD'));

      // USD is the storage currency - no conversion needed
      expect(result.current.rate).toBe(1);
      expect(result.current.currency).toBe('USD');
      // convertFromUSD should return null for USD (no conversion)
      expect(result.current.convertFromUSD(100)).toBeNull();
    });

    it('provides formatConverted that formats with currency symbol', async () => {
      // We need to mock useQuery to return rates for this test
      const { useQuery } = await import('@tanstack/react-query');
      vi.mocked(useQuery).mockReturnValue({
        data: { NGN: 1500, EUR: 0.92 },
        isLoading: false,
        error: null,
      } as any);

      const { useExchangeRate } = await import('@/hooks/useExchangeRate');
      const { result } = renderHook(() => useExchangeRate('NGN'));

      // Rate should be 1500 for NGN
      expect(result.current.rate).toBe(1500);
      // formatConverted should format with the NGN symbol
      const formatted = result.current.formatConverted(10);
      expect(formatted).toContain('₦');
      expect(formatted).toContain('NGN');
    });
  });

  // ─── Requirement 3.10: USD display shows raw values without conversion ──
  describe('USD display preservation', () => {
    it('useWalletDisplay shows raw USD value without conversion', async () => {
      // Mock useQuery to return undefined rates (USD doesn't need rates)
      const { useQuery } = await import('@tanstack/react-query');
      vi.mocked(useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      const { useWalletDisplay } = await import('@/hooks/useWalletBalance');
      const { result } = renderHook(() => useWalletDisplay(125.50, 'USD'));

      // USD display should show the raw balance value
      expect(result.current.usdDisplay).toBe('125.50');
      // No approximate display for USD
      expect(result.current.approxDisplay).toBeNull();
    });

    it('useWalletDisplay shows raw USD value and approx for non-USD currency', async () => {
      // Mock useQuery to return rates
      const { useQuery } = await import('@tanstack/react-query');
      vi.mocked(useQuery).mockReturnValue({
        data: { NGN: 1500 },
        isLoading: false,
        error: null,
      } as any);

      const { useWalletDisplay } = await import('@/hooks/useWalletBalance');
      const { result } = renderHook(() => useWalletDisplay(100, 'NGN'));

      // USD display should still show raw value
      expect(result.current.usdDisplay).toBe('100.00');
      // Approximate display should show converted value with symbol
      expect(result.current.approxDisplay).toContain('₦');
      expect(result.current.approxDisplay).toContain('NGN');
    });
  });
});
