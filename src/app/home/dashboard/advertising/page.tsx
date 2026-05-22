"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Loader2,
  Search,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  MapPin,
} from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-hot-toast";
import Image from "next/image";

type AdStatus = "pending" | "approved" | "rejected" | "active" | "expired" | "expired_unused";

interface PromoConfig {
  mode: "none" | "flat" | "percentage" | "per_variant";
  flatPrice?: number;
  percentageDiscount?: number;
  variantPrices?: Array<{ optionId: string; price: number }>;
}

interface Advertisement {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  adType: "banner" | "featured" | "sponsored";
  duration: number;
  cost: number;
  status: AdStatus;
  impressions: number;
  clicks: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  reviewedAt?: string;
  liveAt?: string;
  placementType?: "banner" | "collection" | null;
  rejectionReason?: string;
  promoConfig?: PromoConfig;
  vendorId: {
    _id: string;
    businessInfo?: { name: string };
  } | null;
  productId: {
    _id: string;
    name: string;
    images?: string[];
    slug?: string;
  } | null;
  reviewedBy?: {
    email: string;
    profile?: { firstName: string; lastName: string };
  } | null;
}

interface AdsResponse {
  success: boolean;
  data: {
    advertisements: Advertisement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "expired_unused", label: "Refunded" },
];

function getStatusBadge(status: AdStatus) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-blue-100 text-blue-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "expired":
      return "bg-gray-100 text-gray-600";
    case "expired_unused":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getAdTypeBadge(type: string) {
  switch (type) {
    case "banner":
      return "bg-purple-100 text-purple-700";
    case "featured":
      return "bg-indigo-100 text-indigo-700";
    case "sponsored":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPromoBadgeText(promoConfig?: PromoConfig): string | null {
  if (!promoConfig || promoConfig.mode === "none") return null;
  switch (promoConfig.mode) {
    case "flat":
      return `Flat: ₦${promoConfig.flatPrice?.toLocaleString() ?? 0}`;
    case "percentage":
      return `${promoConfig.percentageDiscount}% off`;
    case "per_variant":
      return "Per-variant pricing";
    default:
      return null;
  }
}

export default function AdvertisingAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading, error } = useQuery<AdsResponse>({
    queryKey: ["admin-advertisements", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.append("status", statusFilter);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/advertisements?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch advertisements");
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (adId: string) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/advertisements/${adId}/approve`,
        { method: "PATCH" }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to approve");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Advertisement approved");
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ adId, reason }: { adId: string; reason: string }) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/advertisements/${adId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to reject");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Advertisement rejected");
      setRejectingId(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Pending placement ads (approved but not yet live)
  const { data: pendingPlacement } = useQuery<{ success: boolean; data: Advertisement[] }>({
    queryKey: ["admin-pending-placement"],
    queryFn: async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/advertisements/suggestions`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const placeMutation = useMutation({
    mutationFn: async ({ adId, placementType, placementId }: { adId: string; placementType: string; placementId: string }) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/admin/advertisements/${adId}/place`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementType, placementId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to place");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Advertisement placed and is now live!");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-placement"] });
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const ads = data?.data?.advertisements || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="p-4 md:p-6 lg:p-8 font-roboto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">
          Advertising Management
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Review, approve, or reject vendor advertisements
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pending Placement Section */}
      {pendingPlacement?.data && pendingPlacement.data.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Pending Placement</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
              {pendingPlacement.data.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            These approved ads need to be placed in a banner or collection to go live.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingPlacement.data.map((ad) => {
              const daysSinceApproval = ad.reviewedAt
                ? Math.floor((Date.now() - new Date(ad.reviewedAt).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              const daysLeft = Math.max(0, 14 - daysSinceApproval);

              return (
                <div
                  key={ad._id}
                  className="bg-white rounded-lg border border-blue-200 p-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
                      {ad.productId?.images?.[0] || ad.imageUrl ? (
                        <Image
                          src={ad.productId?.images?.[0] || ad.imageUrl}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">{ad.title}</h4>
                      <p className="text-[10px] text-gray-500 truncate">
                        {ad.vendorId?.businessInfo?.name || "Unknown vendor"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getAdTypeBadge(ad.adType)}`}>
                          {ad.adType}
                        </span>
                        <span className="text-[10px] text-gray-400">{ad.duration} days</span>
                        {getPromoBadgeText(ad.promoConfig) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-700">
                            {getPromoBadgeText(ad.promoConfig)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className={`text-[10px] font-medium ${daysLeft <= 3 ? "text-red-600" : "text-amber-600"}`}>
                        {daysLeft} days left before auto-refund
                      </span>
                    </div>
                  </div>

                  {ad.promoConfig?.mode && ad.promoConfig.mode !== "none" && (
                    <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      ⚠️ This will change the product&apos;s prices for {ad.duration} days
                    </p>
                  )}

                  <button
                    onClick={() => {
                      const placementType = ad.adType === "banner" ? "banner" : "collection";
                      placeMutation.mutate({
                        adId: ad._id,
                        placementType,
                        placementId: ad._id, // placeholder — admin links actual banner/collection separately
                      });
                    }}
                    disabled={placeMutation.isPending}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {placeMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <MapPin className="w-3 h-3" />
                    )}
                    Mark as Placed
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-600 text-sm">
          Failed to load advertisements
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm">
          No advertisements found
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div
              key={ad._id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Product Image */}
                <div className="w-full md:w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                  {ad.productId?.images?.[0] || ad.imageUrl ? (
                    <Image
                      src={ad.productId?.images?.[0] || ad.imageUrl}
                      alt={ad.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {ad.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Product: {ad.productId?.name || "N/A"} &middot; Vendor:{" "}
                        {ad.vendorId?.businessInfo?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(
                          ad.status
                        )}`}
                      >
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getAdTypeBadge(
                          ad.adType
                        )}`}
                      >
                        {ad.adType}
                      </span>
                      {getPromoBadgeText(ad.promoConfig) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          {getPromoBadgeText(ad.promoConfig)}
                        </span>
                      )}
                    </div>
                  </div>

                  {ad.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {ad.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                    <span>Duration: {ad.duration} days</span>
                    <span>Cost: {ad.cost} credits</span>
                    <span>Impressions: {ad.impressions}</span>
                    <span>Clicks: {ad.clicks}</span>
                    <span>
                      Submitted:{" "}
                      {new Date(ad.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {ad.startDate && (
                      <span>
                        Active:{" "}
                        {new Date(ad.startDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        –{" "}
                        {ad.endDate
                          ? new Date(ad.endDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "N/A"}
                      </span>
                    )}
                  </div>

                  {ad.status === "rejected" && ad.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2">
                      Rejection reason: {ad.rejectionReason}
                    </p>
                  )}

                  {ad.reviewedBy && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Reviewed by: {ad.reviewedBy.profile?.firstName}{" "}
                      {ad.reviewedBy.profile?.lastName} ({ad.reviewedBy.email})
                    </p>
                  )}
                </div>
              </div>

              {/* Actions for pending ads */}
              {ad.status === "pending" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  {rejectingId === ad._id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            rejectMutation.mutate({
                              adId: ad._id,
                              reason: rejectionReason,
                            })
                          }
                          disabled={
                            !rejectionReason.trim() ||
                            rejectMutation.isPending
                          }
                          className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {rejectMutation.isPending
                            ? "Rejecting..."
                            : "Confirm Reject"}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                          className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(ad._id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(ad._id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * 10 + 1}–
                {Math.min(page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal Overlay (for mobile) */}
    </div>
  );
}
