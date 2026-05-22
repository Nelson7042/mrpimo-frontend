"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import SocketService from "@/utils/socketService";
import { NumericFormat } from "react-number-format";
import { useFetchAuctionProduct, useFetchProductById } from "@/hooks/queries";
import { AuctionCountdown } from "../../product-details/[id]/(component)/ProductInfo";
import { useMakeBid } from "@/hooks/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { useBidCurrencyRate } from "@/hooks/useBidCurrencyRate";

interface BidUser {
  _id: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  businessName?: string;
}

interface Bid {
  userId: BidUser;
  maxAmount: number;
  currentAmount: number;
  isWinning: boolean;
  createdAt?: Date;
  currency?: string;
}

interface HighestBidder {
  _id: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  businessName?: string;
}

interface AuctionInfo {
  startBidPrice: number;
  bidIncrement: number;
  currentHighestBid: number;
  minimumNextBid: number;
  minimumNextBidDisplay: number;
}

const AuctionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUserStore();
  const { openModal } = useAuthModalStore();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState<HighestBidder | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [minBidValue, setMinBidValue] = useState(0);
  const [auctionInfo, setAuctionInfo] = useState<AuctionInfo | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState(0);

  const { data, isLoading, refetch } = useFetchAuctionProduct(id as string);
  const { data: productData, isLoading: productDataLoading } =
    useFetchProductById(id as string);
  const { mutate: placeBid, isPending: isMakingBid } = useMakeBid();

  // Get currencies from the bids API priceInfo, then fetch USD→userCurrency rate
  const apiUserCurrency = data?.priceInfo?.userCurrency;
  const apiCurrencySymbol = data?.priceInfo?.displayCurrency || "$";
  const { rate: usdToUserRate } = useBidCurrencyRate(apiUserCurrency);

  const userCurrency = apiUserCurrency || "USD";
  const currencySymbol = apiCurrencySymbol;
  const isNonUSD = userCurrency.toUpperCase() !== "USD";

  // Convert USD → user's local currency (for showing equivalents when user types USD bid)
  const usdToLocal = useCallback(
    (usdAmount: number): number => usdAmount * usdToUserRate,
    [usdToUserRate]
  );

  // Initialize data from API response — all auctionInfo values are now in USD from backend
  useEffect(() => {
    if (data) {
      if (data.bids) {
        setBidHistory(data.bids);
        if (data.bids.length > 0) {
          setCurrentBid(data.bids[0].currentAmount);
          setHighestBidder(data.bids[0].userId);
        }
      }
      if (data.auctionInfo) {
        setAuctionInfo(data.auctionInfo);
        setMinBidValue(data.auctionInfo.minimumNextBid);
      }
    }
  }, [data]);

  // Socket connection for real-time updates (guests and authenticated users)
  useEffect(() => {
    if (!id) return;

    // Use user ID if logged in, otherwise generate a guest session identifier
    const socketId = user?._id || `guest-${crypto.randomUUID()}`;
    const socket = SocketService.connect(socketId);
    socket.emit("join_room", id);

    socket.on("place_bid", (socketData: { productId: string; userId: string; amount: number }) => {
      console.log("Bid placed via socket:", socketData);
      setCurrentBid(socketData.amount);
      refetch();
    });

    socket.on("auction:started", (socketData: any) => {
      console.log("Auction started:", socketData);
      refetch();
    });

    socket.on("auction:ended", (socketData: any) => {
      console.log("Auction ended:", socketData);
      refetch();
    });

    return () => {
      socket.off("place_bid");
      socket.off("auction:started");
      socket.off("auction:ended");
    };
  }, [user?._id, id, refetch]);

  const HIGH_VALUE_BID_THRESHOLD = 100; // USD

  const submitBid = useCallback((amount: number) => {
    placeBid(
      { productId: id, userId: user!._id, amount },
      {
        onSuccess: (response) => {
          console.log("Bid placed successfully:", response);
          setBidAmount("");
          if (response.bidAmountUSD) {
            setCurrentBid(response.bidAmountUSD);
          }
          refetch();
        },
        onError: (error) => {
          console.error("Bid failed:", error);
        },
      }
    );
  }, [id, user, placeBid, refetch]);

  const handlePlaceBid = useCallback(() => {
    if (!user) {
      // Store current URL so login redirects back here
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      openModal();
      return;
    }

    if (!bidAmount || isMakingBid) return;

    const amount = parseFloat(bidAmount);
    
    if (amount < minBidValue) {
      return;
    }

    if (amount > HIGH_VALUE_BID_THRESHOLD) {
      setPendingBidAmount(amount);
      setShowConfirmModal(true);
      return;
    }
    submitBid(amount);
  }, [user, bidAmount, isMakingBid, minBidValue, submitBid, openModal]);

  const confirmBid = useCallback(() => {
    setShowConfirmModal(false);
    submitBid(pendingBidAmount);
  }, [pendingBidAmount, submitBid]);

  const cancelBid = useCallback(() => {
    setShowConfirmModal(false);
    setPendingBidAmount(0);
  }, []);

  if (isLoading || productDataLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10 font-roboto" style={{ fontFamily: 'var(--font-roboto)' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="bg-white rounded-lg border border-[#ADADAD4D] p-6">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Auction values are already in USD from backend
  const bidIncrementUSD = auctionInfo?.bidIncrement || 0;

  // Use exact vendor values converted via vendorToUserRate for local display
  const v2uRate = (data?.auctionInfo as any)?.vendorToUserRate || 1;
  const vendorBidIncrement = (data?.auctionInfo as any)?.vendorBidIncrement || 0;
  const vendorStartBidPrice = (data?.auctionInfo as any)?.vendorStartBidPrice || 0;

  // For local currency equivalents of vendor-set values, use exact vendor→user conversion
  const bidIncrementLocal = vendorBidIncrement * v2uRate;
  const startBidLocal = vendorStartBidPrice * v2uRate;
  // For minimum bid local equivalent:
  // - When no bids exist, minimum = just the start bid price (no increment yet),
  //   so use exact vendor amount × vendorToUserRate to avoid double-conversion rounding
  // - When bids exist, the highest bid is in USD, so usdToLocal is appropriate
  const hasBids = bidHistory.length > 0;
  const minBidLocalEquivalent = hasBids
    ? usdToLocal(minBidValue)
    : vendorStartBidPrice * v2uRate;
  
  const placeholder = minBidValue
    ? isNonUSD
      ? `Minimum: $${minBidValue.toFixed(2)} USD (≈ ${currencySymbol}${minBidLocalEquivalent.toFixed(2)})`
      : `Minimum: $${minBidValue.toFixed(2)} USD`
    : `Enter your bid in USD`;
  
  const bidAmountNumber = parseFloat(bidAmount) || 0;
  const bidLocalEquivalent = usdToLocal(bidAmountNumber);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10 font-roboto" style={{ fontFamily: 'var(--font-roboto)' }}>
      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="font-roboto text-sm md:text-base font-semibold text-primary">
          Live Auction
        </h1>
        {productData?.product?.inventory?.listing?.type === "auction" && (
          <AuctionCountdown
            auction={productData.product.inventory.listing.auction}
          />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Card */}
        <div className="lg:w-1/3">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 p-4 md:p-5 border border-[#ADADAD4D] h-full">
            <div className="relative mb-4">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-48 sm:h-64 flex items-center justify-center overflow-hidden">
                <img
                  src={productData?.product?.images?.[0]}
                  alt={productData?.product?.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <h2 className="font-roboto font-semibold text-gray-800 text-xs mb-2">
              {productData?.product?.name}
            </h2>
            <p className="font-roboto text-gray-600 text-xs leading-relaxed mb-4 line-clamp-3">
              {productData?.product?.description}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-roboto">
                LIVE
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-gray-300 text-gray-600 font-roboto">
                Auction
              </span>
            </div>
          </div>
        </div>


        {/* Bidding Section */}
        <div className="lg:w-2/3 space-y-6">
          {/* Current Bid Display */}
          <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
            <div className="text-center">
              <p className="text-sm text-secondary font-roboto mb-2">Current Highest Bid</p>
              {/* Primary: USD amount */}
              <div className="font-roboto text-xl md:text-2xl font-bold primary">
                <NumericFormat
                  value={currentBid || 0}
                  displayType="text"
                  thousandSeparator={true}
                  prefix="$"
                  decimalScale={2}
                  fixedDecimalScale={true}
                />
                <span className="font-roboto text-sm ml-1">USD</span>
              </div>
              {/* Secondary: Local currency equivalent */}
              {isNonUSD && currentBid > 0 && (
                <p className="font-roboto text-xs text-secondary mt-1">
                  (≈{" "}
                  <NumericFormat
                    value={usdToLocal(currentBid)}
                    displayType="text"
                    thousandSeparator={true}
                    prefix={currencySymbol}
                    decimalScale={2}
                    fixedDecimalScale={true}
                  />
                  {" "}{userCurrency.toUpperCase()})
                </p>
              )}
              {highestBidder && (
                <p className="font-roboto text-xs text-secondary mt-2">
                  Leading bidder:{" "}
                  <span className="font-medium text-primary">
                    {highestBidder?._id === user?._id 
                      ? "You" 
                      : highestBidder?.businessName || highestBidder?.profile?.firstName || "Anonymous"}
                  </span>
                </p>
              )}
              {auctionInfo && (
                <p className="text-xs text-secondary mt-1 font-roboto">
                  Bid increment: ${bidIncrementUSD.toFixed(2)} USD
                  {isNonUSD && (
                    <span> (≈ {currencySymbol}{bidIncrementLocal.toFixed(2)})</span>
                  )}
                </p>
              )}
              {/* Minimum bid display */}
              {minBidValue > 0 && (
                <p className="font-roboto text-xs text-secondary mt-2">
                  Minimum: ${minBidValue.toFixed(2)} USD
                  {isNonUSD && (
                    <span> (≈ {currencySymbol}{minBidLocalEquivalent.toFixed(2)})</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Place Bid Form */}
          <div className="bg-white p-6 rounded-lg border border-[#ADADAD4D] shadow-sm">
            <label className="font-roboto block text-xs font-medium text-primary mb-3">
              Your Bid Amount (USD)
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={placeholder}
                  className="font-roboto w-full border border-gray-300 rounded-lg px-4 py-2 text-xs focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  min={minBidValue}
                  step="0.01"
                />
                {/* Secondary display showing local currency equivalent */}
                {bidAmount && bidAmountNumber > 0 && isNonUSD && (
                  <p className="text-xs text-secondary mt-1 font-roboto">
                    ≈ {currencySymbol}{bidLocalEquivalent.toFixed(2)} {userCurrency.toUpperCase()}
                  </p>
                )}
                {bidAmount && parseFloat(bidAmount) < minBidValue && (
                  <p className="text-xs text-red-500 mt-1 font-roboto">
                    Minimum bid is ${minBidValue.toFixed(2)} USD
                    {isNonUSD && ` (≈ ${currencySymbol}${minBidLocalEquivalent.toFixed(2)})`}
                  </p>
                )}
              </div>
              <button
                onClick={handlePlaceBid}
                disabled={isMakingBid || !bidAmount || parseFloat(bidAmount) < minBidValue}
                className="font-roboto bg-primary text-white px-6 py-2 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 transform hover:scale-105"
              >
                {isMakingBid ? "Placing..." : "Place Bid"}
              </button>
            </div>
          </div>


          {/* Bid History */}
          <div className="bg-white p-6 rounded-lg border border-[#ADADAD4D] shadow-sm">
            <h3 className="font-roboto text-sm font-semibold mb-4 text-primary">Bid History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
              {bidHistory.length === 0 ? (
                <p className="text-center text-secondary py-4 font-roboto">No bids yet</p>
              ) : (
                bidHistory.map((bid, index) => {
                  const bidLocalEquivalentAmount = usdToLocal(bid.currentAmount);
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        bid.isWinning
                          ? "bg-green-50 border-green-200"
                          : "bg-gradient-to-br from-gray-100 to-gray-200 border-[#ADADAD4D]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-roboto text-xs font-medium text-primary">
                          {bid.userId?._id === user?._id 
                            ? "You" 
                            : bid.userId?.businessName || bid.userId?.profile?.firstName || "Anonymous"}
                        </span>
                        <div className="text-right">
                          {/* Primary: USD amount */}
                          <div className="font-roboto text-xs font-semibold text-gray-900">
                            <NumericFormat
                              value={bid.currentAmount}
                              displayType="text"
                              thousandSeparator={true}
                              prefix="$"
                              decimalScale={2}
                              fixedDecimalScale={true}
                            />
                            <span className="text-xs ml-1">USD</span>
                          </div>
                          {/* Secondary: Local currency equivalent */}
                          {isNonUSD && (
                            <div className="text-xs text-secondary font-roboto">
                              (≈{" "}
                              <NumericFormat
                                value={bidLocalEquivalentAmount}
                                displayType="text"
                                thousandSeparator={true}
                                prefix={currencySymbol}
                                decimalScale={2}
                                fixedDecimalScale={true}
                              />
                              {" "}{userCurrency.toUpperCase()})
                            </div>
                          )}
                          {bid.isWinning && (
                            <span className="text-xs text-green-600 font-medium font-roboto">
                              Winning
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bid Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-bid-title">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelBid} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95">
            <h3 id="confirm-bid-title" className="font-roboto text-base font-semibold text-primary mb-2">
              Confirm Your Bid
            </h3>
            <p className="font-roboto text-sm text-secondary mb-1">
              You are about to place a bid of:
            </p>
            <p className="font-roboto text-xl font-bold text-primary mb-1">
              ${pendingBidAmount.toFixed(2)} USD
            </p>
            {isNonUSD && (
              <p className="font-roboto text-xs text-secondary mb-4">
                ≈ {currencySymbol}{usdToLocal(pendingBidAmount).toFixed(2)} {userCurrency.toUpperCase()}
              </p>
            )}
            {!isNonUSD && <div className="mb-4" />}
            <p className="font-roboto text-xs text-secondary mb-6">
              This action cannot be undone. Are you sure you want to proceed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelBid}
                className="flex-1 font-roboto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBid}
                className="flex-1 font-roboto px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionPage;
