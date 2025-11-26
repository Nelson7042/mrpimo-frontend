"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Plus, Trash2, ArrowUpCircle } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useDeletePaymentMethod } from "@/hooks/mutations";
import { toast } from "react-toastify";
import AddPaymentMethodModal from "./AddPaymentMethodModal";
import TopUpModal from "./TopUpModal";

interface PaymentMethod {
  id: string;
  type: "card" | "bank_transfer" | "mobile_money";
  provider: "paystack" | "stripe" | "alipay" | "wechat";
  region: "africa" | "europe" | "north_america" | "china" | "uk";
  metadata: {
    last4?: string;
    brand?: string;
    bankName?: string;
    accountNumber?: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

interface PaymentMethodManagerProps {
  onClose: () => void;
}

export default function PaymentMethodManager({
  onClose,
}: PaymentMethodManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  
  const deletePaymentMethodMutation = useDeletePaymentMethod();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:5800/api/v1/wallets/payment-methods"
      );
      const data = await response.json();
      if (data.success) {
        setMethods(data.paymentMethods);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMethod = (id: string) => {
    deletePaymentMethodMutation.mutate(id, {
      onSuccess: () => {
        setMethods(methods.filter((m) => m.id !== id));
        toast.success('Payment method deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete payment method');
      }
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Payment Methods</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Top Up
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {methods &&
            methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">
                      {method.metadata?.brand || method.metadata?.bankName || 'Payment Method'} ••••{" "}
                      {method.metadata?.last4 ||
                        method.metadata?.accountNumber?.slice(-4) || '****'}
                    </p>
                    {method.isDefault && (
                      <span className="text-xs text-blue-600">Default</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteMethod(method.id)}
                  disabled={deletePaymentMethodMutation.isPending}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

          <button
            onClick={() => setShowAddMethod(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-center gap-2 text-gray-600"
          >
            <Plus className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>
      </div>
      {showAddMethod && (
        <AddPaymentMethodModal
          onClose={() => setShowAddMethod(false)}
          methodsCount={methods.length}
          onSuccess={fetchPaymentMethods}
        />
      )}
      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          paymentMethods={methods}
          onSuccess={() => {
            fetchPaymentMethods();
            onClose(); // Close the entire PaymentMethodManager modal
          }}
        />
      )}
    </div>
  );
}
