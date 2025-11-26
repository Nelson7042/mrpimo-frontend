"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import SocketService from "@/utils/socketService";
import { NumericFormat } from "react-number-format";
import {
  convertFromUSD,
  getCurrencySymbol,
  getCurrencyFromTimezone,
} from "@/utils/currencyService";
import { useFetchAuctionProduct, useFetchProductById } from "@/hooks/queries";
import { AuctionCountdown } from "../../product-details/[id]/(component)/ProductInfo";
import { useMakeBid } from "@/hooks/mutations";
import { User } from "@/types/user.type";

interface Bid {
  userId: User;
  maxAmount: number;
  currentAmount: number;
  isWinning: boolean;
}

interface HighestBidder {
  _id: string;
  profile: {
    firstName: string;
    lastName: string
  };
  businessName?: string;
}

const AuctionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUserStore();
  const [bidAmount, setBidAmount] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState<HighestBidder | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [minBidValue, setMinBidValue] = useState(0);
  const userCurrency = user?.preferences?.currency || getCurrencyFromTimezone();

  const { data, isLoading } = useFetchAuctionProduct(id as string);
  const { data: productData, isLoading: productDataLoading } =
    useFetchProductById(id as string);
  const { mutate: placeBid, isPending: isMakingBid } = useMakeBid();

  useEffect(() => {
    if (data?.bids) {
      setBidHistory(data.bids);
      if (data.bids.length > 0) {
        setCurrentBid(data.bids[0].currentAmount);
        setHighestBidder(data.bids[0].userId);
      }
    }
  }, [data]);

  useEffect(() => {
    if (data && productData) {
      const calculatedMin = 
        (Number(productData?.product.inventory?.listing?.auction.startBidPrice) * Number(data?.priceInfo.exchangeRate)) +
        Number(data?.priceInfo.exchangeRate) * Number(productData?.product.inventory?.listing?.auction.bidIncrement);
      setMinBidValue(calculatedMin);
    }
  }, [data, productData]);

  useEffect(() => {
    if (bidAmount && userCurrency !== "USD") {
      const amount = parseFloat(bidAmount);
      convertFromUSD(amount, userCurrency).then(setConvertedAmount);
    }
  }, [bidAmount, userCurrency]);

  useEffect(() => {
    if (user?._id && id) {
      const socket = SocketService.connect(user._id);
      socket.emit("join_room", id);

      socket.on("bid-placed", (data: any) => {
        console.log("Bid placed:", data);
        setCurrentBid(data.amountUSD);
        setBidHistory(prev => {
          const updated = prev.map(b => ({ ...b, isWinning: false }));
          const existingIndex = updated.findIndex(b => b.userId === data.user);
          if (existingIndex >= 0) {
            updated[existingIndex].currentAmount = data.amountUSD;
          } else {
            updated.push({
              userId: data.user,
              maxAmount: data.amountUSD,
              currentAmount: data.amountUSD,
              isWinning: false
            });
          }
          updated.sort((a, b) => b.currentAmount - a.currentAmount);
          if (updated.length > 0) updated[0].isWinning = true;
          return updated;
        });
      });

      socket.on("bid:final", (data: any) => {
        console.log("Received bid:final:", data);
        setCurrentBid(data.currentBidUSD);
        setHighestBidder(data.highestBidder);
        setBidHistory(data.bidHistory.map((b: any) => ({
          userId: b.user,
          maxAmount: b.maxAmountUSD,
          currentAmount: b.currentAmountUSD,
          isWinning: b.isWinning
        })));
      });

      return () => {
        socket.off("bid-placed");
        socket.off("bid:final");
      };
    }
  }, [user?._id, id]);

  const handlePlaceBid = () => {
    if (!user || !bidAmount || isMakingBid) return;

    const amount = parseFloat(bidAmount);
    if (amount <= currentBid) return;
    placeBid(
      { productId: id, userId: user._id, maxBid: Number(bidAmount) },
      {
        onSuccess: (response) => {
          console.log("Bid placed:", response);
          setBidAmount("");
          setMinBidValue(Number(response.currentAmountUsd) + (Number(data?.priceInfo.exchangeRate) *
        Number(productData?.product.inventory?.listing?.auction.bidIncrement)));
        },
        onError: (error) => {
          console.error("Bid failed:", error);
        },
      }
    );
  };

  if (isLoading || productDataLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const placeholder = minBidValue
    ? `Minimum: ${data?.priceInfo.displayCurrency} ${minBidValue.toFixed(2)}`
    : `Enter your bid`;

  console.log(bidHistory);
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Live Auction</h1>
          {productData.product.inventory?.listing?.type === "auction" && (
            <AuctionCountdown
              auction={productData.product.inventory.listing.auction}
            />
          )}
        </div>

        {/* Product Details */}
        <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <img
            src={productData.product.images?.[0]}
            alt={productData.product.name}
            className="w-24 h-24 object-contain rounded-lg"
          />
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{productData.product.name}</h2>
            <p className="text-sm text-gray-600 line-clamp-2">{productData.product.description}</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Current Highest Bid</p>
            <div className="text-3xl font-bold text-blue-600">
              <NumericFormat
                value={currentBid || 0}
                displayType="text"
                thousandSeparator={true}
                prefix={data?.priceInfo?.displayCurrency || "$"}
                decimalScale={2}
                fixedDecimalScale={true}
              />
            </div>
            {highestBidder && (
              <p className="text-sm text-gray-500 mt-2">
                Leading bidder:{" "}
                {highestBidder?._id === user?._id ? "You" : `${highestBidder?.businessName || highestBidder?.profile?.firstName || "Anonymous"}`}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Bid Amount ({userCurrency.toUpperCase()})
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                min={currentBid + 1}
              />
              {bidAmount && userCurrency !== "USD" && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {getCurrencySymbol(userCurrency)}
                  {convertedAmount.toFixed(2)}
                </p>
              )}
            </div>
            <button
              onClick={handlePlaceBid}
              disabled={
                isMakingBid || !bidAmount || parseFloat(bidAmount) <= currentBid
              }
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isMakingBid ? "Placing..." : "Place Bid"}
            </button>
          </div>
        </div>

        {/* Bid History */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Bid History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bidHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No bids yet</p>
            ) : (
              bidHistory.map((bid, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    bid.isWinning
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {bid.userId._id === user?._id ? "You" : bid?.userId?.profile?.firstName || bid?.userId?.businessName || "Anonymous"}
                    </span>
                    <div className="text-right">
                      <div className="font-semibold">
                        <NumericFormat
                          value={bid.currentAmount}
                          displayType="text"
                          thousandSeparator={true}
                          prefix={data?.priceInfo?.displayCurrency || "$"}
                          decimalScale={2}
                          fixedDecimalScale={true}
                        />
                      </div>
                      {bid.isWinning && (
                        <span className="text-xs text-green-600 font-medium">
                          Winning
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;
