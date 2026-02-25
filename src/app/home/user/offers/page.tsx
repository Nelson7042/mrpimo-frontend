"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useUserOffers, OfferItem, OfferUser } from "@/hooks/useOffers";
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
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "accepted":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "expired":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-3 h-3" />;
    case "accepted":
      return <CheckCircle className="w-3 h-3" />;
    case "rejected":
      return <XCircle className="w-3 h-3" />;
    case "expired":
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

const limitOptions = [5, 10, 20, 50];

export default function OffersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data: offersResult, isLoading, refetch } = useUserOffers({ page: currentPage, limit: itemsPerPage });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const offers = offersResult?.offers || [];
  const pagination = offersResult?.pagination;

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/home/user" },
    { label: "My Offers", href: null },
  ];

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) router.push(item.href);
  };

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleAcceptCounterOffer = async (
    vendorId: string,
    productId: string,
    variantId: string,
    optionId: string
  ) => {
    setActionLoading(`accept-${productId}-${variantId}-${optionId}`);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/offer/${vendorId}/accept-counter-offer`,
        {
          method: "POST",
          body: JSON.stringify({ productId, variantId, optionId }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to accept counter offer");
      }
      toast.success("Counter offer accepted!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept counter offer");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCounterOffer = async (
    vendorId: string,
    productId: string,
    variantId: string,
    optionId: string
  ) => {
    setActionLoading(`reject-${productId}-${variantId}-${optionId}`);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/offer/${vendorId}/reject-counter-offer`,
        {
          method: "POST",
          body: JSON.stringify({ productId, variantId, optionId }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reject counter offer");
      }
      toast.success("Counter offer rejected");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject counter offer");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={manualBreadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-2 md:mb-6"
      />

      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold">My Offers</h1>
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
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No offers yet
          </h3>
          <p className="text-gray-500 mb-4">
            Browse products and make offers to see them here
          </p>
          <Button
            onClick={() => router.push("/home")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Browse Products
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {offers.map((group) => (
              <div
                key={group.productId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 md:p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <h2 className="font-semibold text-sm md:text-base text-gray-900">
                    {group.name}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.offers.map((offer) => {
                    const pendingCounter = group.counterOffers.find(
                      (co) =>
                        co.status === "pending" &&
                        co.variantId === offer.variantId &&
                        co.optionId === offer.optionId
                    );
                    const acceptedOffer = offer.status === "accepted";
                    const actionKey = `${group.productId}-${offer.variantId}-${offer.optionId}`;

                    return (
                      <div key={offer._id} className="p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {getCurrencySymbol(offer.displayCurrency)}{offer.displayAmount.toFixed(2)}{" "}
                                <span className="text-xs font-normal text-gray-500">
                                  {offer.displayCurrency}
                                </span>
                              </span>
                              <Badge className={`${getStatusColor(offer.status)} px-2 py-0.5`}>
                                <span className="flex items-center gap-1 text-xs font-medium">
                                  {getStatusIcon(offer.status)}
                                  <span className="capitalize">{offer.status}</span>
                                </span>
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Submitted {format(new Date(offer.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                            </p>
                            {offer.expiresAt && (
                              <p className="text-xs text-gray-400">
                                Expires {format(new Date(offer.expiresAt), "MMM dd, yyyy")}
                              </p>
                            )}
                          </div>
                          {acceptedOffer && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/home/product-details/${group.slug}`)}
                              className="border-green-300 text-green-700 hover:bg-green-50"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Go to Product
                            </Button>
                          )}
                        </div>

                        {pendingCounter && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Counter Offer: {getCurrencySymbol(pendingCounter.displayCurrency)}
                                  {pendingCounter.displayAmount.toFixed(2)}{" "}
                                  <span className="text-xs font-normal text-blue-600">
                                    {pendingCounter.displayCurrency}
                                  </span>
                                </p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                  Received {format(new Date(pendingCounter.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleAcceptCounterOffer(
                                      typeof offer.vendorId === "string" ? offer.vendorId : (offer as any).vendorId,
                                      group.productId,
                                      offer.variantId,
                                      offer.optionId
                                    )
                                  }
                                  disabled={actionLoading === `accept-${actionKey}`}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                >
                                  {actionLoading === `accept-${actionKey}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRejectCounterOffer(
                                      typeof offer.vendorId === "string" ? offer.vendorId : (offer as any).vendorId,
                                      group.productId,
                                      offer.variantId,
                                      offer.optionId
                                    )
                                  }
                                  disabled={actionLoading === `reject-${actionKey}`}
                                  className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                                >
                                  {actionLoading === `reject-${actionKey}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {group.counterOffers
                          .filter(
                            (co) =>
                              co.status !== "pending" &&
                              co.variantId === offer.variantId &&
                              co.optionId === offer.optionId
                          )
                          .map((co) => (
                            <div
                              key={co._id}
                              className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600"
                            >
                              Counter offer of {getCurrencySymbol(co.displayCurrency)}{co.displayAmount.toFixed(2)} —{" "}
                              <Badge className={`${getStatusColor(co.status)} px-1.5 py-0 text-xs`}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(co.status)}
                                  <span className="capitalize">{co.status}</span>
                                </span>
                              </Badge>
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
  );
}
