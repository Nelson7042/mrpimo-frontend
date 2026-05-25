"use client";

import React, { useState, useMemo } from "react";
import { useVendorBids, VendorBid, VendorBidFilter } from "@/hooks/useBids";
import Pagination from "@/components/Pagination";
import { getCurrencySymbol } from "@/utils/currency";
import { Loader2, Gavel, Trophy, Clock, ChevronDown, ChevronRight, Users } from "lucide-react";
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

interface ProductGroup {
  productId: string;
  productName: string;
  productImage?: string;
  auctionEnded: boolean;
  highestBid: number;
  currency: string;
  bidCount: number;
  bids: VendorBid[];
}

function BidStatusBadge({ bid }: { bid: VendorBid }) {
  if (bid.paymentStatus === "reserve_not_met" && bid.auctionEnded) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
        Reserve not met
      </span>
    );
  }
  if (bid.isWinning) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
        <Trophy className="w-3 h-3" />
        {bid.auctionEnded ? "Won" : "Winning"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
      Outbid
    </span>
  );
}

function ProductBidGroup({ group }: { group: ProductGroup }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Product Header — clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
      >
        {group.productImage && (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={group.productImage}
              alt={group.productName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
            {group.productName}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.bidCount} bid{group.bidCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs font-medium text-gray-700">
              Highest: {getCurrencySymbol(group.currency)}{group.highestBid.toFixed(2)}
            </span>
            {group.auctionEnded && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Ended
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Bids Table */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Bidder</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Current Bid</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Max Bid</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.bids.map((bid, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {getBidderName(bid.bidder)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {getCurrencySymbol(bid.currency)}{bid.currentAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {getCurrencySymbol(bid.currency)}{bid.maxAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <BidStatusBadge bid={bid} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(bid.updatedAt || bid.createdAt), "MMM dd, yyyy h:mm a")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorBidsPage() {
  const [activeFilter, setActiveFilter] = useState<VendorBidFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data, isLoading } = useVendorBids(activeFilter, currentPage, itemsPerPage);

  const bids = data?.bids || [];
  const pagination = data?.pagination;

  // Group bids by product
  const productGroups: ProductGroup[] = useMemo(() => {
    const groupMap = new Map<string, ProductGroup>();

    for (const bid of bids) {
      const key = bid.productId;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          productId: bid.productId,
          productName: bid.productName,
          productImage: bid.productImage,
          auctionEnded: bid.auctionEnded,
          highestBid: bid.currentAmount,
          currency: bid.currency,
          bidCount: 0,
          bids: [],
        });
      }
      const group = groupMap.get(key)!;
      group.bids.push(bid);
      group.bidCount++;
      if (bid.currentAmount > group.highestBid) {
        group.highestBid = bid.currentAmount;
      }
      // If any bid shows auction ended, mark the group as ended
      if (bid.auctionEnded) group.auctionEnded = true;
    }

    return Array.from(groupMap.values());
  }, [bids]);

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
        ) : productGroups.length === 0 ? (
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
              {productGroups.map((group) => (
                <ProductBidGroup key={group.productId} group={group} />
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
