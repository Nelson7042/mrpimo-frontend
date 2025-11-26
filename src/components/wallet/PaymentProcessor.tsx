"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentProcessorProps {
  provider: 'stripe' | 'paystack';
  clientSecret?: string;
  authorizationUrl?: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Stripe Payment Form
function StripePaymentForm({ amount, onSuccess, onCancel }: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/vendor/dashboard/wallets`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
          }}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}

// Paystack Payment Component
function PaystackPayment({ authorizationUrl, amount, onSuccess, onCancel }: {
  authorizationUrl: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePaystackRedirect = () => {
    setIsRedirecting(true);
    // Open Paystack in new window
    const popup = window.open(authorizationUrl, 'paystack', 'width=500,height=600');
    
    // Listen for payment completion
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        setIsRedirecting(false);
        // Check payment status (you might want to verify on backend)
        onSuccess();
      }
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-900">Paystack Payment</span>
        </div>
        <p className="text-sm text-green-700">
          You'll be redirected to Paystack to complete your payment securely.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isRedirecting}
          className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handlePaystackRedirect}
          disabled={isRedirecting}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PaymentProcessor({ 
  provider, 
  clientSecret, 
  authorizationUrl, 
  amount, 
  onSuccess, 
  onCancel 
}: PaymentProcessorProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (provider === 'stripe' && clientSecret) {
      stripePromise.then(() => setLoading(false));
    } else if (provider === 'paystack' && authorizationUrl) {
      setLoading(false);
    }
  }, [provider, clientSecret, authorizationUrl]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Complete Payment</h3>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-blue-900 font-medium">Amount to pay:</span>
            <span className="text-2xl font-bold text-blue-900">${amount.toFixed(2)}</span>
          </div>
        </div>

        {provider === 'stripe' && clientSecret ? (
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe' as const,
                variables: {
                  colorPrimary: '#2563eb',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <StripePaymentForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        ) : provider === 'paystack' && authorizationUrl ? (
          <PaystackPayment 
            authorizationUrl={authorizationUrl} 
            amount={amount} 
            onSuccess={onSuccess} 
            onCancel={onCancel} 
          />
        ) : (
          <div className="text-center text-red-600">
            Invalid payment configuration
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Your payment is secured by {provider === 'stripe' ? 'Stripe' : 'Paystack'}</p>
        </div>
      </div>
    </div>
  );
}