"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInitializePayment } from "@/hooks/useWallet";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/stores/cartStore";
import { useUserStore } from "@/stores/useUserStore";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

export default function PaymentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { verifyPayment } = useInitializePayment();
  const { clearCart } = useCartStore();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  
  useEffect(() => {
    const reference = searchParams.get('reference');
    const orderId = searchParams.get('orderId');
    const type = searchParams.get('type') || 'wallet'; // Default to wallet for backward compatibility
    
    if (type === 'checkout' && !orderId) {
      setStatus('failed');
      setMessage('Order ID not found');
      return;
    }
    
    if (type === 'wallet' && !reference) {
      setStatus('failed');
      setMessage('Payment reference not found');
      return;
    }
    
    const handleVerification = async () => {
      try {
        if (type === 'checkout') {
          // Handle checkout payment verification using your new endpoint
          const response = await fetchWithAuth(`${API_BASE_URL}/checkout/paystack/verify`, {
            method: 'POST',
            body: JSON.stringify({
              orderId: orderId,
              reference: reference, // Optional - Paystack reference if available
            }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            setStatus('success');
            setMessage('Payment successful! Your order has been created.');
            
            // Clear cart and refresh user data
            await clearCart();
            await useCartStore.getState().loadCart();
            await useUserStore.getState().refreshUser();
            
            // Redirect to orders page after 3 seconds
            setTimeout(() => {
              router.push('/home/user/orders');
            }, 3000);
          } else {
            setStatus('failed');
            setMessage(result.message || 'Payment verification failed');
          }
        } else {
          // Handle wallet payment verification
          const result = await verifyPayment(reference);
          
          if (result.success) {
            setStatus('success');
            setMessage('Payment verified successfully! Your wallet has been updated.');
            
            // Invalidate wallet queries to refresh balance
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
            queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
            
            // Redirect to wallet page after 3 seconds
            setTimeout(() => {
              router.push('/home/user/wallet');
            }, 3000);
          } else {
            setStatus('failed');
            setMessage(result.message || 'Payment verification failed');
          }
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.message || 'Payment verification failed');
      }
    };
    
    handleVerification();
  }, [searchParams, verifyPayment, queryClient, router, clearCart]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={() => router.push('/home/user/wallet')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Wallet
            </Button>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/home/user/wallet')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/home')}
                className="w-full"
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