"use client";

import React from "react";
import { X, Building2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

const THEME_COLOR = "#002f7a";

interface OrderLimitUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  fulfilledOrders?: number;
}

const OrderLimitUpgradeModal: React.FC<OrderLimitUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  fulfilledOrders = 100,
}) => {
  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4 font-roboto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close modal"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Header with Warning Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Order Fulfillment Limit Reached
            </h2>
            <p className="text-gray-600 text-sm">
              You've fulfilled {fulfilledOrders} orders, reaching the limit for personal accounts.
            </p>
          </div>

          {/* Upgrade Benefits Section */}
          <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: THEME_COLOR }}
              >
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Upgrade to Business Account</h3>
                <p className="text-sm text-gray-600">Unlock unlimited potential</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Unlimited Order Fulfillment</p>
                  <p className="text-xs text-gray-600">
                    No more limits on how many orders you can fulfill
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Unlimited Product Listings</p>
                  <p className="text-xs text-gray-600">
                    List as many products as you want without restrictions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Advanced Analytics Dashboard</p>
                  <p className="text-xs text-gray-600">
                    Get detailed insights into your sales and customer behavior
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Bulk Product Upload</p>
                  <p className="text-xs text-gray-600">
                    Upload multiple products at once via CSV or JSON
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Priority Support</p>
                  <p className="text-xs text-gray-600">
                    Get faster responses and dedicated assistance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgradeClick}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: THEME_COLOR }}
            >
              Upgrade to Business Account
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Maybe Later
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Your current orders and data will be preserved when you upgrade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderLimitUpgradeModal;
