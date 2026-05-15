"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { useUserStore } from "@/stores/useUserStore";
import { useAddresses } from "@/hooks/useAddress";
import { useWalletBalance } from "@/hooks/useWallet";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { getCurrencySymbol } from "@/utils/currency";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import DeliveryOptions, {
  DeliveryOptionItem,
} from "@/components/checkout/DeliveryOptions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Clock,
  AlertTriangle,
  Wallet,
  CreditCard,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// --- Types ---

interface BidCheckoutData {
  bid: {
    _id: string;
    productId: string;
    productName: string;
    productImage?: string;
    currentAmount: number;
    currency: string;
    paymentStatus: string;
    paymentDeadline: string;
  };
  product: {
    _id: string;
    name: string;
    images: string[];
  };
}

interface DeliveryOptionsResponse {
  success: boolean;
  deliveryOptions: DeliveryOptionItem[];
  hasCoordinates: boolean;
  message?: string;
}

interface BidPaymentIntentResponse {
  success: boolean;
  orderId: string;
  paymentData: {
    type: string;
    provider: string;
    clientSecret?: string;
    paymentIntentId?: string;
    amount?: number;
    availableBalance?: number;
    currency?: string;
    email?: string;
  };
  checkout: {
    items: any[];
    pricing: {
      subtotal: number;
      tax: number;
      taxName?: string;
      taxRate?: number;
      isTaxInclusive?: boolean;
      shipping: number;
      total: number;
      currency: string;
    };
  };
  expiresAt: string;
}

// --- Helpers ---

function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

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


// --- Main Component ---

export default function BidCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bidId = params.bidId as string;

  const { user } = useUserStore();
  const { data: addressData } = useAddresses();
  const { data: walletData } = useWalletBalance();
  const { data: userCurrencyData } = useUserCurrency();

  // Page state
  const [bidData, setBidData] = useState<BidCheckoutData | null>(null);
  const [isLoadingBid, setIsLoadingBid] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Delivery options state
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptionItem[]>(
    []
  );
  const [hasCoordinates, setHasCoordinates] = useState(false);
  const [selectedDeliveryOption, setSelectedDeliveryOption] =
    useState<DeliveryOptionItem | null>(null);
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState<string | undefined>(
    undefined
  );

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "fiat" | "crypto" | ""
  >("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentData, setPaymentIntentData] = useState<any>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);

  // Tax state
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxName, setTaxName] = useState("Tax");
  const [taxRate, setTaxRate] = useState(0);
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  // Derived values
  const shippingAddresses = useMemo(() => {
    const addresses = addressData?.addresses || user?.addresses || [];
    return addresses.filter((addr) => addr.type === "shipping");
  }, [addressData, user?.addresses]);

  const selectedAddress = useMemo(() => {
    if (selectedAddressId) {
      return shippingAddresses.find((a) => a._id === selectedAddressId);
    }
    return shippingAddresses.find((a) => a.isDefault) || shippingAddresses[0];
  }, [shippingAddresses, selectedAddressId]);

  // Set default address on load
  useEffect(() => {
    if (shippingAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr =
        shippingAddresses.find((a) => a.isDefault) || shippingAddresses[0];
      if (defaultAddr?._id) {
        setSelectedAddressId(defaultAddr._id);
      }
    }
  }, [shippingAddresses, selectedAddressId]);

  const deadline = bidData?.bid?.paymentDeadline || null;
  const countdown = useCountdown(deadline);

  const itemPrice = bidData?.bid?.currentAmount || 0;
  const currency = bidData?.bid?.currency || userCurrencyData?.currency || "USD";
  const shippingCost = selectedDeliveryOption?.price?.amount || 0;
  const total = isTaxInclusive
    ? itemPrice + shippingCost
    : itemPrice + shippingCost + taxAmount;

  const walletBalance = walletData?.wallet?.balances?.available || 0;
  const walletCurrency = walletData?.wallet?.currency || "USD";

  // --- Fetch bid data ---
  const fetchBidData = useCallback(async () => {
    setIsLoadingBid(true);
    setLoadError(null);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/bids/${bidId}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to load bid information"
        );
      }
      const data = await response.json();
      setBidData(data);
    } catch (error: any) {
      setLoadError(error.message || "Failed to load bid information");
    } finally {
      setIsLoadingBid(false);
    }
  }, [bidId]);

  useEffect(() => {
    if (bidId) {
      fetchBidData();
    }
  }, [bidId, fetchBidData]);

  // --- Fetch delivery options ---
  const fetchDeliveryOptions = useCallback(
    async (addressId?: string) => {
      if (!bidId) return;
      setIsLoadingDelivery(true);
      try {
        const queryParams = addressId ? `?addressId=${addressId}` : "";
        const response = await fetchWithAuth(
          `${API_BASE_URL}/checkout/bid/${bidId}/delivery-options${queryParams}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to fetch delivery options"
          );
        }
        const data: DeliveryOptionsResponse = await response.json();
        if (data.success) {
          setDeliveryOptions(data.deliveryOptions || []);
          setHasCoordinates(data.hasCoordinates);
          setDeliveryMessage(data.message);

          // Auto-select first available option
          const defaultOption =
            data.deliveryOptions?.find(
              (opt) =>
                opt.price &&
                (data.hasCoordinates
                  ? opt.id === "home_standard"
                  : opt.id === "station_pickup")
            ) ||
            data.deliveryOptions?.find((opt) => opt.price) ||
            data.deliveryOptions?.[0];
          if (defaultOption) {
            setSelectedDeliveryOption(defaultOption);
          }
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load delivery options");
      } finally {
        setIsLoadingDelivery(false);
      }
    },
    [bidId]
  );

  // Fetch delivery options when address changes
  useEffect(() => {
    if (selectedAddressId && bidData) {
      fetchDeliveryOptions(selectedAddressId);
    } else if (bidData && shippingAddresses.length > 0) {
      fetchDeliveryOptions();
    }
  }, [selectedAddressId, bidData, fetchDeliveryOptions, shippingAddresses.length]);

  // --- Handle delivery option selection ---
  const handleDeliverySelect = (option: DeliveryOptionItem) => {
    setSelectedDeliveryOption(option);
  };

  // --- Handle payment ---
  const handlePay = async () => {
    if (countdown.expired) {
      toast.error("Payment window has closed");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    if (!selectedDeliveryOption) {
      toast.error("Please select a delivery option");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    try {
      // Determine delivery method from selected option
      const deliveryMethod =
        selectedDeliveryOption.id === "station_pickup"
          ? "pickup"
          : selectedDeliveryOption.id === "home_express"
          ? "express"
          : "standard";

      // Create payment intent
      const response = await fetchWithAuth(`${API_BASE_URL}/checkout/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidId,
          paymentMethod:
            paymentMethod === "fiat" ? "stripe" : paymentMethod,
          addressId: selectedAddress._id,
          deliveryMethod,
          selectedDeliveryOption: {
            optionId: selectedDeliveryOption.id,
            label: selectedDeliveryOption.label,
            carrierParams: selectedDeliveryOption.carrierParams,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to initiate payment"
        );
      }

      const data: BidPaymentIntentResponse = await response.json();

      if (!data.success) {
        throw new Error("Failed to create payment intent");
      }

      // Update tax info from response
      if (data.checkout?.pricing) {
        const p = data.checkout.pricing;
        if (p.tax !== undefined) setTaxAmount(p.tax);
        if (p.taxName) setTaxName(p.taxName);
        if (p.taxRate !== undefined) setTaxRate(p.taxRate);
        if (p.isTaxInclusive !== undefined) setIsTaxInclusive(p.isTaxInclusive);
      }

      // Route based on payment type
      if (data.paymentData.type === "wallet") {
        // Wallet payment - confirm immediately
        await handleWalletPayment(data.orderId);
      } else if (data.paymentData.provider === "paystack") {
        // Paystack redirect
        await handlePaystackPayment(data);
      } else if (data.paymentData.clientSecret) {
        // Stripe payment
        setPaymentIntentData({
          clientSecret: data.paymentData.clientSecret,
          paymentIntentId: data.paymentData.paymentIntentId,
          orderId: data.orderId,
        });
        setShowStripeModal(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async (orderId: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/checkout/bid/wallet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Wallet payment failed");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Payment successful! Your order is being processed.");
        router.push("/home/user/orders");
      } else {
        throw new Error(data.message || "Wallet payment failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Wallet payment failed");
    }
  };

  const handlePaystackPayment = async (data: BidPaymentIntentResponse) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/checkout/paystack/initialize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.orderId,
            isBidCheckout: true,
          }),
        }
      );

      const paystackData = await response.json();
      const authorizationUrl =
        paystackData.data?.authorization_url ||
        paystackData.authorization_url;

      if (paystackData.success && authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        throw new Error(
          paystackData.message || "Failed to initialize Paystack payment"
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Paystack payment initialization failed");
    }
  };

  const handleStripeSuccess = (_paymentIntentId: string) => {
    setShowStripeModal(false);
    toast.success("Payment successful! Your order is being processed.");
    router.push("/home/user/orders");
  };

  // --- Breadcrumbs ---
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/home/user" },
    { label: "My Bids", href: "/home/user/bids" },
    { label: "Checkout", href: null },
  ];

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    e.preventDefault();
    if (item.href) router.push(item.href);
  };

  // --- Render ---

  if (isLoadingBid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-sm text-gray-500">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load checkout
          </h2>
          <p className="text-sm text-gray-500 mb-4">{loadError}</p>
          <Button
            onClick={() => router.push("/home/user/bids")}
            variant="outline"
          >
            Back to My Bids
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={breadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-4 md:mb-6"
      />

      <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6">
        Bid Checkout
      </h1>

      {/* Payment Window Closed Banner */}
      {countdown.expired && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">
              Payment window closed
            </h3>
            <p className="text-sm text-red-700 mt-1">
              The 48-hour payment deadline for this auction has expired. You
              can no longer complete this purchase.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Summary */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold mb-4">Product Summary</h2>
            <div className="flex gap-4">
              {bidData?.bid?.productImage && (
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={bidData.bid.productImage}
                    alt={bidData.bid.productName || "Product"}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {bidData?.bid?.productName}
                </h3>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {getCurrencySymbol(currency)}
                  {itemPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs font-normal text-gray-500">
                    {currency}
                  </span>
                </p>
                <Badge className="mt-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Winning Bid
                </Badge>
              </div>
            </div>
          </section>

          {/* Payment Deadline Countdown */}
          {!countdown.expired && (
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold">Payment Deadline</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-center min-w-[56px]">
                    <span className="text-lg font-bold block">
                      {String(countdown.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-gray-300">HRS</span>
                  </div>
                  <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-center min-w-[56px]">
                    <span className="text-lg font-bold block">
                      {String(countdown.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-gray-300">MIN</span>
                  </div>
                  <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-center min-w-[56px]">
                    <span className="text-lg font-bold block">
                      {String(countdown.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-gray-300">SEC</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Complete payment before the deadline to secure your item.
                </p>
              </div>
            </section>
          )}

          {/* Shipping Address Selection */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold">Shipping Address</h2>
            </div>
            {shippingAddresses.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No shipping address found. Please add a shipping address in
                  your account settings before proceeding.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => router.push("/home/user/addresses")}
                >
                  Add Address
                </Button>
              </div>
            ) : (
              <RadioGroup
                value={selectedAddressId}
                onValueChange={setSelectedAddressId}
                className="space-y-2"
              >
                {shippingAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                      selectedAddressId === addr._id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem
                      value={addr._id || ""}
                      id={`addr-${addr._id}`}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`addr-${addr._id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {addr.street}
                      </p>
                      <p className="text-xs text-gray-500">
                        {addr.city}, {addr.state}, {addr.country}{" "}
                        {addr.postalCode}
                      </p>
                      {addr.isDefault && (
                        <Badge
                          variant="secondary"
                          className="mt-1 text-[10px]"
                        >
                          Default
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </section>

          {/* Delivery Options */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <DeliveryOptions
              options={deliveryOptions}
              hasExactLocation={hasCoordinates}
              selectedOptionId={selectedDeliveryOption?.id || ""}
              onSelect={handleDeliverySelect}
              subtotal={itemPrice}
              currency={currency}
              isLoading={isLoadingDelivery}
              noCoordinatesMessage={deliveryMessage}
            />
          </section>

          {/* Payment Method Selection */}
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold mb-3">Payment Method</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(val) =>
                setPaymentMethod(val as "wallet" | "fiat" | "crypto")
              }
              className="space-y-2"
              disabled={countdown.expired}
            >
              {/* Wallet Option */}
              <div
                className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                  paymentMethod === "wallet"
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                } ${countdown.expired ? "opacity-50" : ""}`}
              >
                <RadioGroupItem
                  value="wallet"
                  id="pay-wallet"
                  className="mt-0.5"
                  disabled={countdown.expired}
                />
                <Label htmlFor="pay-wallet" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Wallet</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Balance: ${walletBalance.toFixed(2)} {walletCurrency}
                  </p>
                </Label>
              </div>

              {/* Fiat Option */}
              <div
                className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                  paymentMethod === "fiat"
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                } ${countdown.expired ? "opacity-50" : ""}`}
              >
                <RadioGroupItem
                  value="fiat"
                  id="pay-fiat"
                  className="mt-0.5"
                  disabled={countdown.expired}
                />
                <Label htmlFor="pay-fiat" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      Card / Bank Transfer
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay with Stripe or Paystack
                  </p>
                </Label>
              </div>

              {/* Crypto Option */}
              <div
                className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                  paymentMethod === "crypto"
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                } ${countdown.expired ? "opacity-50" : ""}`}
              >
                <RadioGroupItem
                  value="crypto"
                  id="pay-crypto"
                  className="mt-0.5"
                  disabled={countdown.expired}
                />
                <Label htmlFor="pay-crypto" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/images/Virtual-Coin-Crypto-Usd--Streamline-Ultimate.png"
                      alt="Crypto"
                      width={16}
                      height={16}
                    />
                    <span className="text-sm font-medium">Crypto</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pay with USDC or USDT
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </section>
        </div>

        {/* Right Column - Price Breakdown & Pay Button */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <h2 className="text-sm font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Item price</span>
                <span>
                  {getCurrencySymbol(currency)}
                  {itemPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {selectedDeliveryOption?.price
                    ? `${getCurrencySymbol(currency)}${shippingCost.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>
                  {taxName}
                  {taxRate > 0 && ` (${taxRate}%)`}
                  {isTaxInclusive && (
                    <span className="text-[10px] ml-1">(incl.)</span>
                  )}
                </span>
                <span>
                  {taxAmount > 0
                    ? `${getCurrencySymbol(currency)}${taxAmount.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}`
                    : "—"}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>
                  {getCurrencySymbol(currency)}
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs font-normal text-gray-500">
                    {currency}
                  </span>
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              disabled={
                countdown.expired ||
                isProcessing ||
                !paymentMethod ||
                !selectedDeliveryOption ||
                !selectedAddress
              }
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : countdown.expired ? (
                "Payment Window Closed"
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>

            {countdown.expired && (
              <p className="text-xs text-red-600 text-center mt-2">
                The payment deadline has passed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stripe Payment Modal */}
      {showStripeModal && paymentIntentData?.clientSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Complete Payment</h3>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: paymentIntentData.clientSecret }}
            >
              <StripePaymentForm
                clientSecret={paymentIntentData.clientSecret}
                amount={total}
                currency={currency}
                onSuccess={handleStripeSuccess}
                onCancel={() => setShowStripeModal(false)}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}
