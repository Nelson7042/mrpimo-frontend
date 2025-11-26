"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SelectInput } from "@/components/SelectInput";
import FullButton from "@/components/FullButton";
import Modal from "@/components/Modal";
import { getBids } from "@/hooks/useProducts";
import { useUserStore } from "@/stores/useUserStore";

interface BidModal1Props {
  isBid: boolean;
  closeBid: () => void;
  productData?: any;
  onSubmitBid?: (bidAmount: number, shippingData: any, paymentMethod: string) => void;
  isPlacingBid?: boolean;
}

export const BidModal1 = ({ isBid, closeBid, productData, onSubmitBid, isPlacingBid }: BidModal1Props) => {
  const { user } = useUserStore();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customBid, setCustomBid] = useState("");
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [bids, setBids] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [shippingData, setShippingData] = useState({
    country: "",
    state: "",
    postalCode: "",
    phoneNumber: "",
    useDefaultAddress: true,
  });

  const auction = productData?.inventory?.listing?.auction;
  const startBidPrice = auction?.startBidPrice || 0;
  const currentHighestBid = bids.length > 0 ? Math.max(...bids.map((b: any) => b.currentAmount)) : startBidPrice;
  const minBidIncrement = auction?.bidIncrement || 1;
  const currencySymbol = (productData?.country as any)?.currencySymbol || "$";

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
    if (isBid && productData?._id) {
      setLoadingBids(true);
      getBids(productData._id)
        .then((response) => setBids(response.bids || []))
        .catch(() => setBids([]))
        .finally(() => setLoadingBids(false));
    }
  }, [isBid, productData?._id]);

  const handleQuickBid = (amount: number) => setCustomBid(amount.toString());

  const handleClose = () => {
    closeBid();
    setStep(1);
    setCustomBid("");
    setShippingData({ country: "", state: "", postalCode: "", phoneNumber: "", useDefaultAddress: true });
  };

  const handleFinalSubmit = () => {
    if (!onSubmitBid || !customBid) return;
    const bidAmount = Number.parseInt(customBid);
    if (bidAmount <= currentHighestBid) {
      alert(`Bid must be higher than ${currencySymbol}${currentHighestBid.toLocaleString()}`);
      return;
    }
    onSubmitBid(bidAmount, shippingData, paymentMethod);
  };

  const formatCurrency = (amount: number) => `${currencySymbol} ${amount.toLocaleString()}`;
  const formatTime = (time: typeof timeLeft) => `${time.days}d : ${time.hours}h : ${time.minutes}m : ${time.seconds}s`;

  const userBid = bids.find((b: any) => b.userId?._id === user?._id);

  return (
    <Modal isOpen={isBid} onClose={handleClose}>
      {step === 1 && (
<>         <div className="py-4 flex justify-between">
            <h3 className="text-[18px] flex-1 md:text-[20px] md:leading-[24px] text-dark font-semibold">Make a bid</h3>
            <X onClick={handleClose} className="cursor-pointer text-black" size={20} />
          </div>

          <p className="text-gray-600 mb-8 text-xs md:text-sm">
            To make a bid, provide your preferred payment method and shipping address details before you bid. You will be charged only if you win
          </p>

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <p className="text-base md:text-lg font-medium text-dark">Payment Method</p>
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

            <p className="text-base md:text-lg font-medium text-dark">Shipping Address</p>

            <div className="col-span-2">
              <label className="text-sm md:text-base font-medium text-dark">Country<span className="text-red-500">*</span></label>
              <SelectInput
                value={shippingData.country}
                onChange={(e) => setShippingData((prev) => ({ ...prev, country: e.target?.value }))}
                placeholder="Choose your country"
                data={[
                  { value: "nigeria", name: "Nigeria" },
                  { value: "ghana", name: "Ghana" },
                  { value: "kenya", name: "Kenya" },
                ]}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm md:text-base font-medium text-dark">State<span className="text-red-500">*</span></label>
              <SelectInput
                value={shippingData.state}
                onChange={(e) => setShippingData((prev) => ({ ...prev, state: e.target?.value }))}
                placeholder="Choose your state"
                data={[
                  { value: "lagos", name: "Lagos" },
                  { value: "abuja", name: "Abuja" },
                  { value: "kano", name: "Kano" },
                ]}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm md:text-base font-medium text-dark">Postal Code<span className="text-red-500">*</span></label>
              <Input
                value={shippingData.postalCode}
                onChange={(e) => setShippingData((prev) => ({ ...prev, postalCode: e.target.value }))}
                placeholder="Enter Postal Code"
                className="bg-gray-100 border-0 h-12"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm md:text-base font-medium text-dark">Phone Number<span className="text-red-500">*</span></label>
              <Input
                value={shippingData.phoneNumber}
                onChange={(e) => setShippingData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Enter Phone Number"
                className="bg-gray-100 border-0 h-12"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4">
            <input
              type="checkbox"
              checked={shippingData.useDefaultAddress}
              onChange={(e) => setShippingData((prev) => ({ ...prev, useDefaultAddress: e.target.checked }))}
            />
            <p>Use Default Address</p>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <FullButton name="Next" action={() => setStep(2)} color="blue" />
            <FullButton name="Back" action={handleClose} color="yellow" />
          </div>
        </>
      )}

      {step === 2 && (
<>           <div className="py-4 flex justify-between">
            <h3 className="text-[18px] flex-1 md:text-[20px] md:leading-[24px] text-dark font-semibold">Place bid</h3>
            <X onClick={handleClose} className="cursor-pointer text-black" size={20} />
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
                    <p className="font-bold">{formatCurrency(startBidPrice)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Highest Bid:</span>
                    <p className="font-bold">{formatCurrency(currentHighestBid)}</p>
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
            <span className="text-sm text-gray-600">{bids.length} Bids Made</span>
          </div>

          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {loadingBids ? (
              <p className="text-center text-gray-500">Loading bids...</p>
            ) : (
              <>
                {userBid && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="w-5 h-5 text-red-500">↗</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Your Bid {formatCurrency(userBid.currentAmount)}</span>
                        {userBid.isWinning && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Highest bidder</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(userBid.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {bids.filter((b: any) => b.userId?._id !== user?._id).map((bid: any) => (
                  <div key={bid.userId?._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Bid {formatCurrency(bid.currentAmount)}</span>
                        {bid.isWinning && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">High bidder</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="flex space-x-3 mb-4">
            <Button variant="outline" className="flex-1" onClick={() => handleQuickBid(currentHighestBid + minBidIncrement)}>
              {formatCurrency(currentHighestBid + minBidIncrement)}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleQuickBid(currentHighestBid + minBidIncrement * 2)}>
              {formatCurrency(currentHighestBid + minBidIncrement * 2)}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleQuickBid(currentHighestBid + minBidIncrement * 5)}>
              {formatCurrency(currentHighestBid + minBidIncrement * 5)}
            </Button>
          </div>

          <div className="flex space-x-3">
            <Input
              placeholder={`Enter bid higher than ${formatCurrency(currentHighestBid)}`}
              value={customBid}
              onChange={(e) => setCustomBid(e.target.value)}
              className="flex-1"
              type="number"
            />
            <Button
              className="bg-blue-600 hover:bg-blue-700 px-8"
              onClick={handleFinalSubmit}
              disabled={!customBid || isPlacingBid}
            >
              {isPlacingBid ? "Submitting..." : "Submit Bid"}
            </Button>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <FullButton name="Back" action={() => setStep(1)} color="yellow" />
          </div>
        </>
      )}
    </Modal>
  );
};
