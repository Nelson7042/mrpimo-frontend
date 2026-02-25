"use client";

import React, { useState } from "react";
import { useVendorBids, VendorBid, VendorBidFilter } from "@/hooks/useBids";
import Pagination from "@/components/Pagination";
import { getCurrencySymbol } from "@/utils/currency";
import { Loader2, Gavel, Trophy, Clock } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const tabs: { label: string; value: VendorBidFilter }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

const emptyMessages: Record<VendorBidFilter, { title: string; description: string }> = {
  all: { title: "No bids yet", description: "When buyers bid on your auction products, they will appear here" },
  open: { title: "No open bids", description: "No bids on your active auctions right now" },
  closed: { title: "No closed bids", description: "None of your auctions have ended yet" },
};

const limitOptions = [5, 10, 20, 50];

const getBidderName = (bidder: VendorBid["bidder"]): string => {
  if (!bidder?.profile) return "Unknown Bidder";
  const { firstName, lastName } = bidder.profile;
  return `${firstName || ""} ${lastName || ""}`.trim() || "Unknown Bidder";
};

export default function VendorBidsPage() {
  const [activeFilter, setActiveFilter] = useState<VendorBidFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data, isLoading } = useVendorBids(activeFilter, currentPage, itemsPerPage);

  const bids = data?.bids || [];
  const pagination = data?.pagination;

  const handleFilterChange = (filter: VendorBidFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-roboto">
      <div className="px-2 lg:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base md:text-lg font-semibold">Bids</h1>
            <p className="text-xs text-gray-800">
              Bids received on your auction products
            </p>
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

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === tab.value
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : bids.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Gavel className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {emptyMessages[activeFilter].title}
            </h3>
            <p className="text-gray-500">
              {emptyMessages[activeFilter].description}
            </p>
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
                          <p className="text-sm text-gray-600">
                            Bidder: {getBidderName(bid.bidder)}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                              {getCurrencySymbol(bid.currency)}
                              {bid.currentAmount.toFixed(2)}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                {bid.currency}
                              </span>
                            </span>
                            {bid.isWinning ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Trophy className="w-3 h-3" />
                                {bid.auctionEnded ? "Won" : "Winning"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Outbid
                              </span>
                            )}
                            {bid.auctionEnded && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Ended
                              </span>
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
    </div>
  );
}
