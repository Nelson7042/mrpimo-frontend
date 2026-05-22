"use client";

import React, { useState } from "react";
import { X, Gavel, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { getCurrencySymbol } from "@/utils/currency";

// Format a Date to local datetime-local string (YYYY-MM-DDTHH:mm)
function toLocalDateTimeString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface RelistAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currency?: string;
  previousAuction?: {
    startBidPrice?: number;
    reservePrice?: number;
    buyNowPrice?: number;
  };
  onSuccess: () => void;
}

export default function RelistAuctionModal({
  isOpen,
  onClose,
  productId,
  productName,
  currency,
  previousAuction,
  onSuccess,
}: RelistAuctionModalProps) {
  const [startBidPrice, setStartBidPrice] = useState(
    previousAuction?.startBidPrice?.toString() || ""
  );
  const [reservePrice, setReservePrice] = useState(
    previousAuction?.reservePrice?.toString() || ""
  );
  const [buyNowPrice, setBuyNowPrice] = useState(
    previousAuction?.buyNowPrice?.toString() || ""
  );
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return toLocalDateTimeString(now);
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return toLocalDateTimeString(now);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currencySymbol = getCurrencySymbol(currency) || "$";

  // Get minimum datetime (now + 1 hour for buffer)
  const getMinStartTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return toLocalDateTimeString(now);
  };

  // Get minimum end time (start + 24 hours)
  const getMinEndTime = () => {
    if (!startTime) return getMinStartTime();
    const start = new Date(startTime);
    start.setHours(start.getHours() + 24);
    return toLocalDateTimeString(start);
  };

  // Default end time: 1 hour after start time
  const getDefaultEndTime = (start: string) => {
    const startDate = new Date(start);
    startDate.setHours(startDate.getHours() + 1);
    return toLocalDateTimeString(startDate);
  };

  const validate = (): string | null => {
    if (!startBidPrice || Number(startBidPrice) <= 0) {
      return "Start bid price must be greater than 0";
    }
    if (!reservePrice || Number(reservePrice) <= 0) {
      return "Reserve price must be greater than 0";
    }
    if (Number(reservePrice) < Number(startBidPrice)) {
      return "Reserve price must be greater than or equal to start bid price";
    }
    if (buyNowPrice && Number(buyNowPrice) <= Number(reservePrice)) {
      return "Buy now price must be greater than reserve price";
    }
    if (!startTime) {
      return "Start time is required";
    }
    if (!endTime) {
      return "End time is required";
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return "Start time must be in the future";
    }
    if (end <= start) {
      return "End time must be after start time";
    }
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 24 * 60 * 60 * 1000) {
      return "Auction duration must be at least 24 hours";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const body: Record<string, any> = {
        startBidPrice: Number(startBidPrice),
        reservePrice: Number(reservePrice),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      };

      if (buyNowPrice) {
        body.buyNowPrice = Number(buyNowPrice);
      }

      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/auctions/${productId}/relist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to relist product");
      }

      toast.success("Product relisted successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      toast.error(err.message || "Failed to relist product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Relist Auction</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Relist <span className="font-medium text-gray-900">{productName}</span> for a new auction. Previous bids will be cleared.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Pricing
            </h3>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Start Bid Price ({currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={startBidPrice}
                onChange={(e) => setStartBidPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Reserve Price ({currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-0.5">Minimum price to sell</p>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Buy Now Price ({currencySymbol}) <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={buyNowPrice}
                onChange={(e) => setBuyNowPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Auction Schedule
            </h3>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (e.target.value && !endTime) {
                    setEndTime(getDefaultEndTime(e.target.value));
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-0.5">Must be at least 24 hours after start</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Relisting..." : "Relist Auction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
