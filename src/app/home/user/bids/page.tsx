"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import { useUserBids, BidFilter, UserBid, PaymentStatusFilter } from "@/hooks/useBids";
import Pagination from "@/components/Pagination";
import { getCurrencySymbol } from "@/utils/currency";
import { Loader2, Gavel, Trophy, Clock, ExternalLink, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const tabs: { label: string; value: BidFilter }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Won", value: "won" },
];

const paymentStatusTabs: { label: string; value: PaymentStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Payment Pending", value: "payment_pending" },
  { label: "Paid", value: "paid" },
  { label: "Expired", value: "expired" },
];

const emptyMessages: Record<BidFilter, { title: string; description: string }> = {
  all: { title: "No bids yet", description: "Browse auctions and place bids to see them here" },
  open: { title: "No open bids", description: "You don't have any bids on active auctions" },
  closed: { title: "No closed bids", description: "None of your auctions have ended yet" },
  won: { title: "No wins yet", description: "Keep bidding — your first win is around the corner" },
};

const limitOptions = [5, 10, 20, 50];

// --- Countdown Hook ---
function useCountdown(deadline: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!deadline) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      return;
    }

    const calculate = () => {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return timeLeft;
}

// --- Payment Status Badge ---
function PaymentStatusBadge({ status }: { status: string | undefined }) {
  if (!status || status === "none") return null;

  switch (status) {
    case "payment_pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-2 py-0.5">
          <span className="flex items-center gap-1 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Payment Pending
          </span>
        </Badge>
      );
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 py-0.5">
          <span className="flex items-center gap-1 text-xs font-medium">
            <Package className="w-3 h-3" />
            Paid
          </span>
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-2 py-0.5">
          <span className="flex items-center gap-1 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Expired
          </span>
        </Badge>
      );
    default:
      return null;
  }
}

// --- Countdown Display ---
function BidCountdownTimer({ deadline }: { deadline: string | null | undefined }) {
  const countdown = useCountdown(deadline);

  if (countdown.expired || !deadline) return null;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Clock className="w-3 h-3 text-amber-600" />
      <span className="text-xs font-medium text-amber-700">
        {String(countdown.hours).padStart(2, "0")}h{" "}
        {String(countdown.minutes).padStart(2, "0")}m{" "}
        {String(countdown.seconds).padStart(2, "0")}s remaining
      </span>
    </div>
  );
}

// --- Payment Actions for Won Bids ---
function BidPaymentActions({ bid }: { bid: UserBid }) {
  const router = useRouter();

  if (!bid.isWinning || !bid.auctionEnded) return null;

  const status = bid.paymentStatus;

  if (status === "payment_pending") {
    return (
      <div className="mt-2 space-y-1">
        <BidCountdownTimer deadline={bid.paymentDeadline} />
        <Button
          size="sm"
          onClick={() => router.push(`/home/user/bids/checkout/${bid.bidId || bid.productId}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          Pay Now
        </Button>
      </div>
    );
  }

  if (status === "paid" && bid.orderId) {
    return (
      <div className="mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/home/user/orders/${bid.orderId}`)}
          className="border-green-300 text-green-700 hover:bg-green-50 text-xs"
        >
          <Package className="w-3 h-3 mr-1" />
          Track Order
        </Button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="mt-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 text-red-500" />
        <span className="text-xs text-red-600">Payment window closed</span>
      </div>
    );
  }

  return null;
}

export default function UserBidsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<BidFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data, isLoading } = useUserBids(activeFilter, currentPage, itemsPerPage, paymentStatusFilter);

  const bids = data?.bids || [];
  const pagination = data?.pagination;

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/home/user" },
    { label: "My Bids", href: null },
  ];

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) router.push(item.href);
  };

  const handleFilterChange = (filter: BidFilter) => {
    setActiveFilter(filter);
    setPaymentStatusFilter("all");
    setCurrentPage(1);
  };

  const handlePaymentStatusFilterChange = (status: PaymentStatusFilter) => {
    setPaymentStatusFilter(status);
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={manualBreadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-2 md:mb-6"
      />

      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold">My Bids</h1>
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

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === tab.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment Status Filter - shown when Won tab is active */}
      {activeFilter === "won" && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {paymentStatusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handlePaymentStatusFilterChange(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                paymentStatusFilter === tab.value
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            {activeFilter === "won" ? (
              <Trophy className="w-8 h-8 text-gray-400" />
            ) : (
              <Gavel className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {emptyMessages[activeFilter].title}
          </h3>
          <p className="text-gray-500 mb-4">
            {emptyMessages[activeFilter].description}
          </p>
          {activeFilter === "all" && (
            <Button
              onClick={() => router.push("/home")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse Auctions
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bids.map((bid, index) => (
              <div
                key={`${bid.productId}-${index}`}
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-5"
              >
                <div className="flex gap-4">
                  {bid.productImage && (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={bid.productImage}
                        alt={bid.productName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
                          {bid.productName}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {getCurrencySymbol(bid.currency)}
                            {bid.currentAmount.toFixed(2)}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              {bid.currency}
                            </span>
                          </span>
                          {bid.paymentStatus === "reserve_not_met" && bid.auctionEnded ? (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 px-2 py-0.5">
                              <span className="text-xs font-medium">Auction ended — no winner</span>
                            </Badge>
                          ) : bid.isWinning && bid.auctionEnded ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5">
                              <span className="flex items-center gap-1 text-xs font-medium">
                                <Trophy className="w-3 h-3" />
                                Won
                              </span>
                            </Badge>
                          ) : bid.isWinning ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 py-0.5">
                              <span className="flex items-center gap-1 text-xs font-medium">
                                <Trophy className="w-3 h-3" />
                                Winning
                              </span>
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-2 py-0.5">
                              <span className="flex items-center gap-1 text-xs font-medium">
                                Outbid
                              </span>
                            </Badge>
                          )}
                          {bid.auctionEnded && (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 px-2 py-0.5">
                              <span className="text-xs font-medium">Ended</span>
                            </Badge>
                          )}
                          {bid.isWinning && bid.auctionEnded && bid.paymentStatus && bid.paymentStatus !== "none" && bid.paymentStatus !== "reserve_not_met" && (
                            <PaymentStatusBadge status={bid.paymentStatus} />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Max bid: {getCurrencySymbol(bid.currency)}
                          {bid.maxAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(bid.updatedAt || bid.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                        <BidPaymentActions bid={bid} />
                      </div>
                      {!bid.auctionEnded && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/home/auction/${bid.productId}`)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Auction
                        </Button>
                      )}
                    </div>
                  </div>
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
