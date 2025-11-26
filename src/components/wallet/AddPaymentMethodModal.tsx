"use client";

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building2, Smartphone } from 'lucide-react';
import { useAddPaymentMethod, useCreateSetupIntent } from '@/hooks/mutations';
import { toast } from 'react-toastify';
import StripeSetupForm from './StripeSetupForm';
import { getPaymentProvider, getAvailablePaymentMethods } from '@/utils/paymentProvider';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface AddPaymentMethodModalProps {
  onClose: () => void;
  methodsCount: number;
  onSuccess: () => void;
}

interface UserProfile {
  country: string;
}

export default function AddPaymentMethodModal({ onClose, methodsCount, onSuccess }: AddPaymentMethodModalProps) {
  const [selectedType, setSelectedType] = useState<'card' | 'bank_transfer' | 'mobile_money' | null>(null);
  const [brand, setBrand] = useState('');
  const [last4, setLast4] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [showStripeSetup, setShowStripeSetup] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState('');
  const [userCountry, setUserCountry] = useState<string>('');
  const [availableMethods, setAvailableMethods] = useState<('card' | 'bank_transfer' | 'mobile_money')[]>([]);
  
  const addMethodMutation = useAddPaymentMethod();
  const createSetupIntentMutation = useCreateSetupIntent();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:5800/api/v1/users/profile');
      const data = await response.json();
      if (data.success) {
        setUserCountry(data.user.country);
        setAvailableMethods(getAvailablePaymentMethods(data.user.country));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Default to stripe methods if profile fetch fails
      setAvailableMethods(['card', 'bank_transfer']);
    }
  };

  const allPaymentTypes = [
    { type: 'card' as const, label: 'Credit/Debit Card', icon: CreditCard },
    { type: 'bank_transfer' as const, label: 'Bank Transfer', icon: Building2 },
    { type: 'mobile_money' as const, label: 'Mobile Money', icon: Smartphone }
  ];

  const paymentTypes = allPaymentTypes.filter(type => availableMethods.includes(type.type as any));

  const handleSubmit = () => {
    if (!selectedType) return;
    
    if (selectedType === 'card') {
      const provider = getPaymentProvider(userCountry);
      
      if (provider === 'stripe') {
        createSetupIntentMutation.mutate(undefined, {
          onSuccess: (data) => {
            if (data.success && data.clientSecret) {
              setSetupClientSecret(data.clientSecret);
              setShowStripeSetup(true);
            }
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to initialize payment method setup');
          }
        });
      } else {
        // For Paystack/Alipay, use the old metadata flow
        const metadata: any = {};
        if (brand.trim()) metadata.brand = brand.trim();
        if (last4.trim()) metadata.last4 = last4.trim();
        
        addMethodMutation.mutate({
          type: selectedType,
          metadata,
          isDefault: methodsCount === 0
        }, {
          onSuccess: () => {
            toast.success('Payment method added successfully!');
            onSuccess();
            onClose();
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to add payment method');
          }
        });
      }
    } else {
      // Handle bank transfer and mobile money
      const metadata: any = {};
      
      if (selectedType === 'bank_transfer') {
        if (bankName.trim()) metadata.bankName = bankName.trim();
        if (accountNumber.trim()) metadata.accountNumber = accountNumber.trim();
      } else if (selectedType === 'mobile_money') {
        if (brand.trim()) metadata.brand = brand.trim();
        if (accountNumber.trim()) metadata.accountNumber = accountNumber.trim();
      }

      addMethodMutation.mutate({
        type: selectedType,
        metadata,
        isDefault: methodsCount === 0
      }, {
        onSuccess: () => {
          toast.success('Payment method added successfully!');
          onSuccess();
          onClose();
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to add payment method');
        }
      });
    }
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'card':
        const provider = getPaymentProvider(userCountry);
        // Only show form for non-Stripe providers (Paystack/Alipay)
        if (provider !== 'stripe') {
          return (
            <div className="space-y-3 mt-4">
              <input
                type="text"
                placeholder="Card brand (e.g., Visa, Mastercard)"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Last 4 digits"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          );
        }
        break;
      case 'bank_transfer':
        return (
          <div className="space-y-3 mt-4">
            <input
              type="text"
              placeholder="Bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        );
      case 'mobile_money':
        return (
          <div className="space-y-3 mt-4">
            <input
              type="text"
              placeholder="Provider (e.g., M-Pesa, MTN)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Phone number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add Payment Method</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {availableMethods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading available payment methods...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentTypes.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-full p-4 border rounded-lg text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                  selectedType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${selectedType === type ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`font-medium ${selectedType === type ? 'text-blue-600' : 'text-gray-900'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {renderForm()}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedType || addMethodMutation.isPending || createSetupIntentMutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
          >
            {addMethodMutation.isPending || createSetupIntentMutation.isPending ? 'Processing...' : 'Add Method'}
          </button>
        </div>
      </div>
      {showStripeSetup && setupClientSecret && (
        <StripeSetupForm
          clientSecret={setupClientSecret}
          isDefault={methodsCount === 0}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          onCancel={() => {
            setShowStripeSetup(false);
            setSetupClientSecret('');
          }}
        />
      )}
    </div>
  );
}