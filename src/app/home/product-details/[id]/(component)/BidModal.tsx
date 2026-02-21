"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SelectInput } from "@/components/SelectInput";
import FullButton from "@/components/FullButton";
import { useProductBids } from '@/hooks/useProductBidsOffers';
import { useUserStore } from "@/stores/useUserStore";
import Modal2 from "@/components/Modal2";
import { useRouter } from "next/navigation";
import { useBidCurrencyRate } from "@/hooks/useBidCurrencyRate";

interface BidModal1Props {
  isBid: boolean;
  closeBid: () => void;
  productData?: any;
  onSubmitBid?: (
    bidAmount: number,
    shippingData: any,
    paymentMethod: string
  ) => void;
  isPlacingBid?: boolean;
}

export const BidModal1 = ({
  isBid,
  closeBid,
  productData,
  onSubmitBid,
  isPlacingBid,
}: BidModal1Props) => {
  const { user } = useUserStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customBid, setCustomBid] = useState("");
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const { data: bidsData, isLoading: bidsLoading } = useProductBids(productData?._id || '', !!productData?._id && isBid);
  
  // Get userCurrency from bids API priceInfo, then fetch USD→userCurrency rate
  const apiUserCurrency = (bidsData as any)?.priceInfo?.userCurrency;
  const apiCurrencySymbol = (bidsData as any)?.priceInfo?.displayCurrency || "$";
  const { rate: usdToUserRate } = useBidCurrencyRate(apiUserCurrency);

  const userCurrency = apiUserCurrency || "USD";
  const currencySymbol = apiCurrencySymbol;
  const isNonUSD = userCurrency.toUpperCase() !== "USD";

  // Convert USD → user's local currency
  const usdToLocal = useCallback(
    (usdAmount: number): number => usdAmount * usdToUserRate,
    [usdToUserRate]
  );
  
  const [shippingData, setShippingData] = useState({
    country: "",
    state: "",
    postalCode: "",
    phoneNumber: "",
    useDefaultAddress: true,
  });

  const auction = productData?.inventory?.listing?.auction;
  const bids = (bidsData as any)?.bids || [];
  const auctionInfoFromApi = (bidsData as any)?.auctionInfo;

  // All values from auctionInfo are already in USD from backend
  const startBidPrice = auctionInfoFromApi?.startBidPrice || 0;
  const currentHighestBid = auctionInfoFromApi?.currentHighestBid || 0;
  const minBidIncrement = auctionInfoFromApi?.bidIncrement || 0;
  const minimumNextBid = auctionInfoFromApi?.minimumNextBid || 0;
  
  // Use exact vendor values for local currency display (no double-conversion rounding)
  const v2uRate = auctionInfoFromApi?.vendorToUserRate || 1;
  const vendorStartBid = auctionInfoFromApi?.vendorStartBidPrice || 0;
  const vendorBidIncrement = auctionInfoFromApi?.vendorBidIncrement || 0;
  const vendorMinimumNextBid = vendorStartBid + vendorBidIncrement; // approximate for display

  const startBidLocalEquivalent = vendorStartBid * v2uRate;
  const currentHighestBidLocalEquivalent = usdToLocal(currentHighestBid);
  // When no bids exist, minimum = just the start bid price (no increment yet),
  // so use exact vendor amount × vendorToUserRate to avoid double-conversion rounding
  const hasBids = bids.length > 0;
  const minimumNextBidLocalEquivalent = hasBids
    ? usdToLocal(minimumNextBid)
    : vendorStartBid * v2uRate;
  
  // Calculate local currency equivalent for the current bid input
  const customBidNumber = parseFloat(customBid) || 0;
  const customBidLocalEquivalent = usdToLocal(customBidNumber);

  useEffect(() => {
    if (!auction || !isBid) return;
    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.endTime).getTime();
      const diff = endTime - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [auction, isBid]);

  useEffect(() => {
    if (isBid && user?.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find((addr: any) => addr.isDefault) || user.addresses[0];
      if (defaultAddress) {
        setShippingData(prev => ({
          ...prev,
          country: defaultAddress.country || "",
          state: defaultAddress.state || "",
          postalCode: defaultAddress.postalCode || "",
          phoneNumber: (user as any).phoneNumber || "",
        }));
      }
    }
  }, [isBid, user]);

  const handleQuickBid = (amount: number) => setCustomBid(parseFloat(amount.toFixed(2)).toString());

  const handleClose = () => {
    closeBid();
    setStep(1);
    setCustomBid("");
    setShippingData({
      country: "",
      state: "",
      postalCode: "",
      phoneNumber: "",
      useDefaultAddress: true,
    });
  };

  const handleFinalSubmit = () => {
    if (!onSubmitBid || !customBid) return;
    const bidAmount = parseFloat(customBid);
    if (bidAmount < minimumNextBid) {
      alert(`Bid must be at least $${minimumNextBid.toFixed(2)} USD`);
      return;
    }
    onSubmitBid(bidAmount, shippingData, paymentMethod);
  };

  // Format USD amount
  const formatUSDAmount = (amount: number) => `$${amount.toFixed(2)} USD`;
  
  const formatTime = (time: typeof timeLeft) =>
    `${time.days}d : ${time.hours}h : ${time.minutes}m : ${time.seconds}s`;

  const userBid = bids.find((b: any) => b.userId === user?._id);

  return (
    <Modal2 isOpen={isBid} onClose={handleClose}>
      <div className="inline-block overflow-hidden mt-12 p-4 md:p-5 bg-white text-left relative align-bottom transition-all transform rounded-lg shadow-xl sm:my-8 sm:align-middle w-full sm:max-w-[650px] sm:w-full">

        {step === 1 && (
          <>
            <div className="py-4 flex justify-between">
              <h3 className="text-[18px] flex-1 md:text-[20px] md:leading-4 text-dark font-semibold">
                Make a bid
              </h3>
              <X
                onClick={handleClose}
                className="cursor-pointer text-black"
                size={20}
              />
            </div>
            <div className="h-[60vh] overflow-auto scrollbar-hide">
              <p className="text-gray-600 mb-8 text-xs md:text-sm">
                To make a bid, provide your preferred payment method and shipping
                address details before you bid. You will be charged only if you win
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-5">
                <p className="text-base md:text-lg font-medium text-dark">
                  Payment Method
                </p>
                <div className="col-span-2">
                  <SelectInput
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target?.value)}
                    placeholder="Choose your preferred method of payment"
                    data={[
                      { value: "card", name: "Credit/Debit Card" },
                      { value: "bank", name: "Bank Transfer" },
                      { value: "wallet", name: "Digital Wallet" },
                    ]}
                  />
                </div>

                <p className="text-base md:text-lg font-medium text-dark">
                  Shipping Address
                </p>

                <div className="col-span-2">
                  <label className="text-sm md:text-base font-medium text-dark">
                    Country<span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    value={shippingData.country}
                    onChange={(e) =>
                      setShippingData((prev) => ({
                        ...prev,
                        country: e.target?.value,
                      }))
                    }
                    placeholder="Choose your country"
                    data={[
                      { value: "nigeria", name: "Nigeria" },
                      { value: "ghana", name: "Ghana" },
                      { value: "kenya", name: "Kenya" },
                    ]}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-sm md:text-base font-medium text-dark">
                    State<span className="text-red-500">*</span>
                  </label>
                  <SelectInput
                    value={shippingData.state}
                    onChange={(e) =>
                      setShippingData((prev) => ({
                        ...prev,
                        state: e.target?.value,
                      }))
                    }
                    placeholder="Choose your state"
                    data={[
                      { value: "lagos", name: "Lagos" },
                      { value: "abuja", name: "Abuja" },
                      { value: "kano", name: "Kano" },
                    ]}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-sm md:text-base font-medium text-dark">
                    Postal Code<span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={shippingData.postalCode}
                    onChange={(e) =>
                      setShippingData((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    placeholder="Enter Postal Code"
                    className="bg-gray-100 border-0 h-12"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm md:text-base font-medium text-dark">
                    Phone Number<span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={shippingData.phoneNumber}
                    onChange={(e) =>
                      setShippingData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter Phone Number"
                    className="bg-gray-100 border-0 h-12"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                <input
                  type="checkbox"
                  checked={shippingData.useDefaultAddress}
                  onChange={(e) =>
                    setShippingData((prev) => ({
                      ...prev,
                      useDefaultAddress: e.target.checked,
                    }))
                  }
                />
                <p>Use Default Address</p>
              </div>
            </div>
         
            <div className="flex flex-col gap-4 mt-6">
              <FullButton name="Next" action={() => setStep(2)} color="blue" />
              <FullButton name="Back" action={handleClose} color="yellow" />
            </div>
          </>
        )}


        {step === 2 && (
          <>
            <div className="py-4 flex justify-between">
              <h3 className="text-[18px] flex-1 md:text-[20px] md:leading-[24px] text-dark font-semibold">
                Place bid
              </h3>
              <X
                onClick={handleClose}
                className="cursor-pointer text-black"
                size={20}
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex space-x-4">
                <div className="relative">
                  <img
                    src={productData?.images?.[0] || "/placeholder.svg"}
                    alt={productData?.name}
                    width={160}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Auction Item:</span>
                    <h3 className="font-semibold">{productData?.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Starting Price:</span>
                      <p className="font-bold">{formatUSDAmount(startBidPrice)}</p>
                      {isNonUSD && (
                        <p className="text-xs text-gray-500">≈ {currencySymbol}{startBidLocalEquivalent.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Highest Bid:</span>
                      <p className="font-bold">{formatUSDAmount(currentHighestBid)}</p>
                      {isNonUSD && (
                        <p className="text-xs text-gray-500">≈ {currencySymbol}{currentHighestBidLocalEquivalent.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Time Left:</span>
                    <p className="font-bold text-red-600">{formatTime(timeLeft)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-semibold">Live Auction</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{bids.length} Bids Made</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    handleClose();
                    router.push(`/home/auction/${productData?._id}`);
                  }}
                >
                  Go to Bidding Room
                </Button>
              </div>
            </div>
            <div className="space-y-3 mb-4 md:mb-6 max-h-20 overflow-y-auto">
              {bidsLoading ? (
                <p className="text-center text-gray-500">Loading bids...</p>
              ) : (
                <>
                  {userBid && (
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="w-5 h-5 text-red-500">↗</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Your Bid {formatUSDAmount(userBid.currentAmount)}</span>
                          {userBid.isWinning && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Highest bidder</Badge>
                          )}
                        </div>
                        {isNonUSD && (
                          <p className="text-xs text-gray-500">
                            ≈ {currencySymbol}{usdToLocal(userBid.currentAmount).toFixed(2)} {userCurrency.toUpperCase()}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">{new Date(userBid.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {bids
                    .filter((b: any) => b.userId !== user?._id)
                    .map((bid: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 text-green-500">✓</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">Bid {formatUSDAmount(bid.currentAmount)}</span>
                            {bid.isWinning && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">High bidder</Badge>
                            )}
                          </div>
                          {isNonUSD && (
                            <p className="text-xs text-gray-500">
                              ≈ {currencySymbol}{usdToLocal(bid.currentAmount).toFixed(2)} {userCurrency.toUpperCase()}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>

            <div className="flex space-x-3 mb-4">
              <Button
                variant="outline"
                className="flex-1 flex-col h-auto py-2"
                onClick={() => handleQuickBid(currentHighestBid + minBidIncrement)}
              >
                <span>{formatUSDAmount(currentHighestBid + minBidIncrement)}</span>
                {isNonUSD && (
                  <span className="text-xs text-gray-500">≈ {currencySymbol}{usdToLocal(currentHighestBid + minBidIncrement).toFixed(2)}</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex-col h-auto py-2"
                onClick={() => handleQuickBid(currentHighestBid + minBidIncrement * 2)}
              >
                <span>{formatUSDAmount(currentHighestBid + minBidIncrement * 2)}</span>
                {isNonUSD && (
                  <span className="text-xs text-gray-500">≈ {currencySymbol}{usdToLocal(currentHighestBid + minBidIncrement * 2).toFixed(2)}</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex-col h-auto py-2"
                onClick={() => handleQuickBid(currentHighestBid + minBidIncrement * 5)}
              >
                <span>{formatUSDAmount(currentHighestBid + minBidIncrement * 5)}</span>
                {isNonUSD && (
                  <span className="text-xs text-gray-500">≈ {currencySymbol}{usdToLocal(currentHighestBid + minBidIncrement * 5).toFixed(2)}</span>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Your Bid Amount (USD)</label>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder={`Minimum: $${minimumNextBid.toFixed(2)} USD${isNonUSD ? ` (≈ ${currencySymbol}${minimumNextBidLocalEquivalent.toFixed(2)})` : ""}`}
                    value={customBid}
                    onChange={(e) => setCustomBid(e.target.value)}
                    type="number"
                    min={minimumNextBid}
                    step="0.01"
                  />
                  {customBid && customBidNumber > 0 && isNonUSD && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {currencySymbol}{customBidLocalEquivalent.toFixed(2)} {userCurrency.toUpperCase()}
                    </p>
                  )}
                  {customBid && customBidNumber < minimumNextBid && (
                    <p className="text-xs text-red-500 mt-1">
                      Minimum bid is ${minimumNextBid.toFixed(2)} USD
                      {isNonUSD && ` (≈ ${currencySymbol}${minimumNextBidLocalEquivalent.toFixed(2)})`}
                    </p>
                  )}
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                  onClick={handleFinalSubmit}
                  disabled={!customBid || isPlacingBid || customBidNumber < minimumNextBid}
                >
                  {isPlacingBid ? "Submitting..." : "Submit Bid"}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-6">
              <FullButton name="Back" action={() => setStep(1)} color="yellow" />
            </div>
          </>
        )}
      </div>
    </Modal2>
  );
};
