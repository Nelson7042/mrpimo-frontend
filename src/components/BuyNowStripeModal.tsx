"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BuyNowStripeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  amount: number;
  currency: string;
}

function StripePaymentForm({ amount, currency, onSuccess, onClose }: {
  amount: number;
  currency: string;
  onSuccess: () => void;
  onClose: () => void;
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
          return_url: `${window.location.origin}/home/user/orders`,
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
            fields: {
              billingDetails: 'auto'
            }
          }}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
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
            `Pay ${currency}${amount.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  );
}

export default function BuyNowStripeModal({
  isOpen,
  onClose,
  onSuccess,
  clientSecret,
  amount,
  currency
}: BuyNowStripeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Complete Purchase</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-blue-900 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-blue-900">{currency}{amount.toFixed(2)}</span>
          </div>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm 
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Your payment is secured by Stripe</p>
        </div>
      </div>
    </div>
  );
}