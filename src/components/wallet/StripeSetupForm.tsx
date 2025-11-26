"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAddPaymentMethod } from '@/hooks/mutations';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeSetupFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  isDefault: boolean;
}

interface SetupFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  isDefault: boolean;
}

function SetupForm({ onSuccess, onCancel, isDefault }: SetupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const addPaymentMethodMutation = useAddPaymentMethod();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the setup intent
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/vendor/dashboard/wallets`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message || 'Failed to save payment method');
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        // Save the payment method to backend
        addPaymentMethodMutation.mutate({
          type: 'card',
          paymentMethodId: setupIntent.payment_method as string,
          isDefault
        }, {
          onSuccess: () => {
            toast.success('Payment method added successfully!');
            onSuccess();
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to save payment method');
          }
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md lg:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Add Payment Method</h3>
          </div>
          <button 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Enter your card details to save it for future payments. Your card will not be charged.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <PaymentElement 
              options={{
                layout: 'tabs'
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || !elements || isProcessing || addPaymentMethodMutation.isPending}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing || addPaymentMethodMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Payment Method'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Your payment information is secured by Stripe</p>
        </div>
      </div>
    </div>
  );
}

export default function StripeSetupForm({ clientSecret, onSuccess, onCancel, isDefault }: StripeSetupFormProps) {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  React.useEffect(() => {
    stripePromise.then(() => setStripeLoaded(true));
  }, []);

  if (!stripeLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading payment form...</p>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <SetupForm onSuccess={onSuccess} onCancel={onCancel} isDefault={isDefault} />
    </Elements>
  );
}