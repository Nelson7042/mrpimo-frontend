"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ProductType } from "@/types/product.type";
import { NumericFormat } from "react-number-format";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productData: ProductType;
  onSubmitOffer: (amount: number, optionId: string) => void;
  isSubmitting: boolean;
  selectedOptionId: string;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  productData,
  onSubmitOffer,
  isSubmitting,
  selectedOptionId,
}) => {
  const [offerAmount, setOfferAmount] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(offerAmount);
    if (amount > 0) {
      onSubmitOffer(amount, selectedOptionId);
    }
  };

  const currentPrice = productData?.variants?.[0]?.options?.[0]?.displayPrice || 
                      productData?.variants?.[0]?.options?.[0]?.salePrice || 
                      productData?.variants?.[0]?.options?.[0]?.price || 0;

  const currencySymbol = (productData as any)?.priceInfo?.currencySymbol || "$";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Make an Offer</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={productData?.images?.[0]}
              alt={productData?.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h3 className="font-medium text-sm">{productData?.name}</h3>
              <p className="text-gray-600 text-sm">
                Current Price: {currencySymbol}{currentPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Offer Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your best offer for this item
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !offerAmount || parseFloat(offerAmount) <= 0}
            >
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferModal;