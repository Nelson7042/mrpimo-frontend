"use client";

import React, { useState } from "react";
import { useVendorOffers, OfferItem, OfferUser } from "@/hooks/useOffers";
import { useVendorStore } from "@/stores/useVendorStore";
import Pagination from "@/components/Pagination";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-toastify";
import { getCurrencySymbol } from "@/utils/currency";
import {
  Loader2,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { format } from "date-fns";

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "payment_pending":
      return "bg-blue-100 text-blue-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-3 h-3" />;
    case "payment_pending":
      return <Clock className="w-3 h-3" />;
    case "accepted":
      return <CheckCircle className="w-3 h-3" />;
    case "completed":
      return <CheckCircle className="w-3 h-3" />;
    case "rejected":
      return <XCircle className="w-3 h-3" />;
    case "expired":
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

const getBuyerName = (userId: string | OfferUser): string => {
  if (typeof userId === "string") return "Unknown Buyer";
  const { firstName, lastName } = userId.profile;
  return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown Buyer";
};

const limitOptions = [5, 10, 20, 50];

export default function VendorOffersPage() {
  const { vendor } = useVendorStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data: offersResult, isLoading, refetch } = useVendorOffers({ page: currentPage, limit: itemsPerPage });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterOfferState, setCounterOfferState] = useState<{
    offerId: string;
    amount: string;
  } | null>(null);

  const offers = offersResult?.offers || [];
  const pagination = offersResult?.pagination;

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!vendor?._id) return;
    setActionLoading(`accept-${offerId}`);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/offer/${vendor._id}/accept`,
        { method: "POST", body: JSON.stringify({ offerId }) }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to accept offer");
      }
      toast.success("Offer accepted!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept offer");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!vendor?._id) return;
    setActionLoading(`reject-${offerId}`);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/offer/${vendor._id}/reject`,
        { method: "POST", body: JSON.stringify({ offerId }) }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reject offer");
      }
      toast.success("Offer rejected");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject offer");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitCounterOffer = async (productId: string, offer: OfferItem) => {
    if (!counterOfferState || !counterOfferState.amount) return;
    const price = parseFloat(counterOfferState.amount);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setActionLoading(`counter-${offer._id}`);
    try {
      const buyerUserId = typeof offer.userId === "string" ? offer.userId : (offer.userId as any)?._id;
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/offer/${productId}/counter`,
        {
          method: "POST",
          body: JSON.stringify({ userId: buyerUserId, price, variantId: offer.variantId, optionId: offer.optionId }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit counter offer");
      }
      toast.success("Counter offer sent!");
      setCounterOfferState(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit counter offer");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-roboto">
      <div className="px-2 lg:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base md:text-lg font-semibold">Offers</h1>
            <p className="text-xs text-gray-800">Manage offers received on your products</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : offers.length === 0 ? (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No offers yet</h3>
            <p className="text-gray-500">When buyers make offers on your products, they will appear here</p>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-4">
              {offers.map((group) => (
                <div key={group.productId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-3 md:p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <div className="flex items-center gap-3 min-w-0">
                      {group.image && (
                        <img
                          src={group.image}
                          alt={group.name}
                          className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                        />
                      )}
                      <h2 className="font-semibold text-sm md:text-base text-gray-900 truncate">{group.name}</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {group.offers.map((offer) => {
                      const pendingCounter = group.counterOffers.find(
                        (co) => co.status === "pending"
                      );
                      const hasActiveCounter = !!pendingCounter;

                      return (
                        <div key={offer._id} className="p-4 md:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700">{getBuyerName(offer.userId)}</p>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {getCurrencySymbol(offer.displayCurrency)}{offer.displayAmount.toFixed(2)}{" "}
                                  <span className="text-xs font-normal text-gray-500">{offer.displayCurrency}</span>
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                                  {getStatusIcon(offer.status)}
                                  <span className="capitalize">{offer.status}</span>
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Received {format(new Date(offer.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                              </p>
                              {offer.expiresAt && (
                                <p className="text-xs text-gray-400">
                                  Expires {format(new Date(offer.expiresAt), "MMM dd, yyyy")}
                                </p>
                              )}
                            </div>
                            {offer.status === "pending" && !hasActiveCounter && (
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleAcceptOffer(offer._id)}
                                  disabled={actionLoading === `accept-${offer._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md disabled:opacity-50 cursor-pointer"
                                >
                                  {actionLoading === `accept-${offer._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectOffer(offer._id)}
                                  disabled={actionLoading === `reject-${offer._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium rounded-md disabled:opacity-50 cursor-pointer"
                                >
                                  {actionLoading === `reject-${offer._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                  Reject
                                </button>
                                <button
                                  onClick={() =>
                                    setCounterOfferState(
                                      counterOfferState?.offerId === offer._id ? null : { offerId: offer._id, amount: "" }
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-medium rounded-md cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  Counter Offer
                                </button>
                              </div>
                            )}
                            {offer.status === "payment_pending" && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
                                  <Clock className="w-3 h-3" />
                                  Sale Pending — Awaiting buyer payment
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Counter offer input */}
                          {counterOfferState?.offerId === offer._id && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="text-sm font-medium text-blue-900">
                                  Counter offer amount ({offer.displayCurrency}):
                                </label>
                                <div className="flex gap-2 flex-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={counterOfferState.amount}
                                    onChange={(e) => setCounterOfferState({ ...counterOfferState, amount: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => handleSubmitCounterOffer(group.productId, offer)}
                                    disabled={actionLoading === `counter-${offer._id}` || !counterOfferState.amount}
                                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md disabled:opacity-50 cursor-pointer"
                                  >
                                    {actionLoading === `counter-${offer._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Submit
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Inline counter-offer display (like user's page) */}
                          {hasActiveCounter && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-amber-900">
                                    Your Counter Offer: {getCurrencySymbol(pendingCounter.displayCurrency)}
                                    {pendingCounter.displayAmount.toFixed(2)}{" "}
                                    <span className="text-xs font-normal text-amber-600">
                                      {pendingCounter.displayCurrency}
                                    </span>
                                  </p>
                                  <p className="text-xs text-amber-600 mt-0.5">
                                    Sent {format(new Date(pendingCounter.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-md">
                                  <Clock className="w-3 h-3" />
                                  Awaiting buyer response
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Show non-pending (resolved) counter-offers inline */}
                          {group.counterOffers
                            .filter((co) => co.status !== "pending")
                            .map((co) => (
                              <div key={co._id} className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">
                                      Counter Offer: {getCurrencySymbol(co.displayCurrency)}
                                      {co.displayAmount.toFixed(2)}{" "}
                                      <span className="text-xs font-normal text-gray-500">
                                        {co.displayCurrency}
                                      </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Sent {format(new Date(co.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                    </p>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(co.status)}`}>
                                    {getStatusIcon(co.status)}
                                    <span className="capitalize">{co.status}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
