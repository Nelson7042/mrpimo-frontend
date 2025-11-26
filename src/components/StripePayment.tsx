"use client";

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

const PaymentForm = ({ clientSecret, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vendor/dashboard/advert?success=true`,
      },
    });
    
    if (!error) {
      onSuccess();
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button 
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-2 bg-[#004aad] text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Pay & Submit'}
      </button>
    </form>
  );
};

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: () => void;
}

const StripePayment = ({ clientSecret, onSuccess }: StripePaymentProps) => {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
    // Automatically shows available payment methods for vendor's country/currency
    paymentMethodCreation: 'manual' as const,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  );
};

export default StripePayment;