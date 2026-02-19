"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInitializePayment } from "@/hooks/useWallet";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { useUserStore } from "@/stores/useUserStore";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

type VerificationStatus = 'verifying' | 'processing' | 'success' | 'failed' | 'timeout';

interface VerificationState {
  status: VerificationStatus;
  message: string;
  canRetry: boolean;
  errorCode?: string;
}

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { verifyPayment } = useInitializePayment();
  const { clearCart } = useCartStore();
  
  const [state, setState] = useState<VerificationState>({
    status: 'verifying',
    message: 'Verifying your payment...',
    canRetry: false,
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const reference = searchParams.get('reference');
  const orderId = searchParams.get('orderId');
  const type = searchParams.get('type') || 'wallet';

  const handleCheckoutVerification = useCallback(async () => {
    if (!orderId) {
      setState({
        status: 'failed',
        message: 'Order ID not found. Please contact support.',
        canRetry: false,
        errorCode: 'MISSING_ORDER_ID',
      });
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/checkout/paystack/verify`, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          reference: reference || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Check if still processing (webhook hasn't completed yet)
        if (result.isProcessing || result.status === 'pending_payment') {
          setState({
            status: 'processing',
            message: 'Payment received! Finalizing your order...',
            canRetry: true,
          });
          
          // Auto-retry after 3 seconds if still processing
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 3000);
          } else {
            setState({
              status: 'timeout',
              message: 'Your payment was received but order processing is taking longer than expected. Your order will be confirmed shortly.',
              canRetry: true,
            });
          }
          return;
        }

        // Order successfully processed
        setState({
          status: 'success',
          message: 'Payment successful! Your order has been created.',
          canRetry: false,
        });
        
        // Clear cart and refresh user data
        await clearCart();
        await useCartStore.getState().loadCart();
        await useUserStore.getState().refreshUser();
        
        // Redirect to orders page after 3 seconds
        setTimeout(() => {
          router.push('/home/user/orders');
        }, 3000);
      } else {
        // Determine if error is retryable
        const isRetryable = result.message?.includes('timeout') || 
                           result.message?.includes('processing') ||
                           result.paystackStatus === 'pending';
        
        setState({
          status: 'failed',
          message: result.message || 'Payment verification failed. Please try again or contact support.',
          canRetry: isRetryable && retryCount < maxRetries,
          errorCode: result.code,
        });
      }
    } catch (error: any) {
      setState({
        status: 'failed',
        message: error.message || 'An error occurred during verification. Please try again.',
        canRetry: retryCount < maxRetries,
        errorCode: 'NETWORK_ERROR',
      });
    }
  }, [orderId, reference, retryCount, clearCart, router]);

  const handleWalletVerification = useCallback(async () => {
    if (!reference) {
      setState({
        status: 'failed',
        message: 'Payment reference not found',
        canRetry: false,
        errorCode: 'MISSING_REFERENCE',
      });
      return;
    }

    try {
      const result = await verifyPayment(reference);
      
      if (result.success) {
        setState({
          status: 'success',
          message: 'Payment verified successfully! Your wallet has been updated.',
          canRetry: false,
        });
        
        // Invalidate wallet queries to refresh balance
        queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
        queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
        
        // Redirect to wallet page after 3 seconds
        setTimeout(() => {
          router.push('/home/user/wallet');
        }, 3000);
      } else {
        setState({
          status: 'failed',
          message: result.message || 'Payment verification failed',
          canRetry: retryCount < maxRetries,
        });
      }
    } catch (error: any) {
      setState({
        status: 'failed',
        message: error.message || 'Payment verification failed',
        canRetry: retryCount < maxRetries,
      });
    }
  }, [reference, verifyPayment, queryClient, router, retryCount]);

  useEffect(() => {
    if (type === 'checkout') {
      handleCheckoutVerification();
    } else {
      handleWalletVerification();
    }
  }, [type, retryCount]); // Re-run when retryCount changes

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setState({
        status: 'verifying',
        message: 'Retrying verification...',
        canRetry: false,
      });
      setRetryCount(prev => prev + 1);
    }
  };

  const handleCheckOrders = () => {
    router.push('/home/user/orders');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Verifying State */}
        {state.status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{state.message}</p>
          </>
        )}

        {/* Processing State (webhook pending) */}
        {state.status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-yellow-600 mb-2">Processing Order</h2>
            <p className="text-gray-600 mb-4">{state.message}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>This usually takes a few seconds...</span>
            </div>
          </>
        )}

        {/* Timeout State */}
        {state.status === 'timeout' && (
          <>
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-600 mb-2">Processing Taking Longer</h2>
            <p className="text-gray-600 mb-6">{state.message}</p>
            <div className="space-y-3">
              <Button 
                onClick={handleCheckOrders}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Check My Orders
              </Button>
              {state.canRetry && (
                <Button 
                  variant="outline"
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              )}
            </div>
          </>
        )}
        
        {/* Success State */}
        {state.status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{state.message}</p>
            <Button 
              onClick={() => router.push(type === 'checkout' ? '/home/user/orders' : '/home/user/wallet')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {type === 'checkout' ? 'View My Orders' : 'Go to Wallet'}
            </Button>
          </>
        )}
        
        {/* Failed State */}
        {state.status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-2">{state.message}</p>
            {state.errorCode && (
              <p className="text-xs text-gray-400 mb-6">Error code: {state.errorCode}</p>
            )}
            <div className="space-y-3">
              {state.canRetry && (
                <Button 
                  onClick={handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again ({maxRetries - retryCount} attempts left)
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => router.push(type === 'checkout' ? '/home/my-cart' : '/home/user/wallet')}
                className="w-full"
              >
                {type === 'checkout' ? 'Return to Cart' : 'Return to Wallet'}
              </Button>
              <Button 
                variant="ghost"
                onClick={() => router.push('/home')}
                className="w-full text-gray-500"
              >
                Go Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
