"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import { useUserBids, BidFilter } from "@/hooks/useBids";
import Pagination from "@/components/Pagination";
import { getCurrencySymbol } from "@/utils/currency";
import { Loader2, Gavel, Trophy, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const tabs: { label: string; value: BidFilter }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Won", value: "won" },
];

const emptyMessages: Record<BidFilter, { title: string; description: string }> = {
  all: { title: "No bids yet", description: "Browse auctions and place bids to see them here" },
  open: { title: "No open bids", description: "You don't have any bids on active auctions" },
  closed: { title: "No closed bids", description: "None of your auctions have ended yet" },
  won: { title: "No wins yet", description: "Keep bidding — your first win is around the corner" },
};

const limitOptions = [5, 10, 20, 50];

export default function UserBidsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<BidFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data, isLoading } = useUserBids(activeFilter, currentPage, itemsPerPage);

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
                          {bid.isWinning && bid.auctionEnded ? (
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
                        </div>
                        <p className="text-xs text-gray-500">
                          Max bid: {getCurrencySymbol(bid.currency)}
                          {bid.maxAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(bid.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
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
