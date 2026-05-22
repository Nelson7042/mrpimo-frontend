"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { Star, Heart, X, MessageSquare, Tag } from "lucide-react";
import { ProductType, VariantType } from "@/types/product.type";
import { NumericFormat } from "react-number-format";
import { convertFromUSD, getCurrencySymbol } from "@/utils/currencyService";
import { useCartStore } from "@/stores/cartStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useUserStore } from "@/stores/useUserStore";
import Wishlist from "@/components/client-component/Wishlist";
import SocketService from "@/utils/socketService";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import { BidModal1 } from "./BidModal";
import { useMakeBid, useBuyNow } from "@/hooks/mutations";
import { toast } from "react-hot-toast";
import VariantDisplay from "@/components/VariantDisplay";
import BuyNowSummary from "@/components/BuyNowSummary";
import { calculateTotalQuantity } from "@/utils/productUtils";
import OfferModal from "./OfferModal";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { usePriceInfo } from "@/hooks/usePriceInfo";
import { useProductBids, useProductOffers } from '@/hooks/useProductBidsOffers';
import { useQueryClient } from '@tanstack/react-query';

export const AuctionCountdown = ({ auction }: { auction: any }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const startTime = new Date(auction.startTime).getTime();
      const endTime = new Date(auction.endTime).getTime();

      if (!auction.isStarted) {
        const diff = startTime - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Starts in ${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft("Auction starting...");
        }
      } else if (!auction.isExpired) {
        const diff = endTime - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Ends in ${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft("Auction ended");
        }
      } else {
        setTimeLeft("Auction ended");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  return (
    <div className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
      {timeLeft}
    </div>
  );
};

type ProductInfoProps = {
  productData: ProductType;
};

const ProductInfo: React.FC<ProductInfoProps> = ({ productData }) => {
  const { addToCart, isLoading } = useCartStore();
  const { openModal } = useAuthModalStore();
  const { user } = useUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Console log product data in ProductInfo component
  useEffect(() => {
    if (productData) {
      const totalQty = calculateTotalQuantity(productData);
      // console.log("=== PRODUCT INFO COMPONENT ===");
      // console.log("Product Data:", productData);
      // console.log("Product ID:", productData._id);
      // console.log("Product Name:", productData.name);
      // console.log("Product Variants:", productData.variants);
      // console.log(
      //   "Variant Options:",
      //   productData.variants?.map((v: any) => ({
      //     variantId: v._id || v.id,
      //     variantName: v.name,
      //     options: v.options?.map((opt: any) => ({
      //       optionId: opt._id || opt.id,
      //       value: opt.value,
      //       price: opt.price,
      //       salePrice: opt.salePrice,
      //       displayPrice: opt.displayPrice,
      //       quantity: opt.quantity,
      //       sku: opt.sku,
      //     })),
      //   }))
      // );
      // console.log("Price Info:", productData.priceInfo);
      // console.log("Inventory:", productData.inventory);
      // console.log("Total Quantity:", totalQty);
      // console.log("All Properties:", Object.keys(productData));
      // console.log("==============================");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [selectedVariant, setSelectedVariant] = useState<
    VariantType | undefined
  >(undefined);

  const [selectedOptions, setSelectedOptions] = useState<{
    [variantId: string]: string;
  }>({});
  const [isJoiningChat, setIsJoiningChat] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const buyNowMutation = useBuyNow();
  const makeBidMutation = useMakeBid();

  useEffect(() => {
    if (productData?.variants) {
      const initial: { [variantId: string]: string } = {};
      productData.variants.forEach((variant) => {
        const validOptions = variant.options?.filter(
          (opt: any) => opt.value && (opt.id || opt._id)
        );
        const firstOption = validOptions?.[0];
        if (firstOption) {
          initial[variant._id || variant.id] =
            firstOption.id || firstOption._id;
        }
      });
      setSelectedOptions(initial);
    }
  }, [productData]);

  useEffect(() => {
    if (productData?.variants && productData.variants.length > 0) {
      setSelectedVariant(productData.variants[0]);
    }
  }, [productData]);

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      const socket = SocketService.connect(user._id);
      socket.emit("authenticate", { userId: user._id });
    }
  }, [user?._id]);

  const getSelectedOption = (variant: any) => {
    const optionId = selectedOptions[variant._id || variant.id];
    return variant.options?.find(
      (opt: any) => (opt.id || opt._id) === optionId && opt.value
    );
  };
  // Use the custom hook for price calculations
  const priceInfo = usePriceInfo(productData, selectedOptions, quantity);
  
  // Fetch bids and offers using separate hooks
  const { data: bids } = useProductBids(productData?._id || '', !!productData?._id);
  const { data: offers } = useProductOffers(productData?._id || '', !!productData?._id);

  const getSelectedOptionPrice = () => {
    return priceInfo.unitPrice;
  };

  const getSelectedOptionCurrency = () => {
    return priceInfo.currencySymbol;
  };

  const getTotalPrice = () => {
    return priceInfo.totalPrice;
  };

  const getSelectedOptionStock = () => {
    if (!productData?.variants?.[0]) return 0;
    const variant = productData.variants[0];
    const optionId = selectedOptions[variant._id || variant.id];
    const option = variant.options?.find(
      (opt: any) => (opt.id || opt._id) === optionId && opt.value
    );
    return option?.quantity || 0;
  };

  const handleIncrease = () => {
    const maxStock = getSelectedOptionStock();
    setQuantity((prev) => (prev < maxStock ? prev + 1 : prev));
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const totalQuantity = calculateTotalQuantity(productData);

  let totalUserOffers = 0;
  const offersArray = offers?.offers;
  if (offersArray && offersArray.length > 0) {
    totalUserOffers = offersArray.length;
  }

  const saleType = productData?.inventory?.listing?.type;
  const acceptOffer = productData?.inventory?.listing?.instant?.acceptOffer;
  const auction = productData?.inventory?.listing?.auction;
  const handleMessageSeller = async () => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      openModal();
      return;
    }

    try {
      setIsJoiningChat(true);
      const socket = SocketService.getSocket();
      if (!socket) {
        toast.error("Connection error. Please try again.");
        setIsJoiningChat(false);
        return;
      }

      const payload = {
        userId: user._id,
        chatId: null,
        product: productData,
      };

      // Clean up any stale listeners before attaching new ones
      socket.off("chat-joined");
      socket.off("error");

      let settled = false;

      socket.once("chat-joined", ({ chatId }) => {
        if (settled) return;
        settled = true;
        localStorage.setItem("focusedChatId", chatId);
        router.push("/home/user/messages");
        setIsJoiningChat(false);
      });

      socket.once("error", (error) => {
        if (settled) return;
        settled = true;
        toast.error("Failed to join chat. Please try again.");
        setIsJoiningChat(false);
      });

      socket.emit("join-chat", payload);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!settled) {
          settled = true;
          socket.off("chat-joined");
          socket.off("error");
          toast.error("Connection timeout. Please try again.");
          setIsJoiningChat(false);
        }
      }, 10000);
    } catch (error) {
      toast.error("Failed to connect to chat.");
      setIsJoiningChat(false);
    }
  };

  const handleAddToCart = async () => {
    if (!productData) {
      toast.error("Product data not available");
      return;
    }

    try {
      let selectedVariantObj;
      if (productData.variants && productData.variants.length > 0) {
        const variant = productData.variants[0];
        const optionId = selectedOptions[variant._id || variant.id];
        const option = variant.options?.find(
          (opt: any) => (opt.id || opt._id) === optionId
        );

        if (!option) {
          toast.error("Please select a product option");
          return;
        }

        if (option.quantity < quantity) {
          toast.error(`Only ${option.quantity} items available`);
          return;
        }

        selectedVariantObj = {
          variantId: variant._id || variant.id,
          optionId: option.id || option._id,
          variantName: variant.name,
          optionValue: option.value,
          price: option.salePrice || option.price,
        };
      }
      await addToCart(productData, quantity, selectedVariantObj);
      // Optimistic update: bump addToCart count locally without refetching
      if (productData._id) {
        queryClient.setQueryData(['product', productData._id], (oldData: any) => {
          if (!oldData?.product) return oldData;
          return {
            ...oldData,
            product: {
              ...oldData.product,
              analytics: {
                ...oldData.product.analytics,
                addToCart: (oldData.product.analytics?.addToCart || 0) + 1,
              },
            },
          };
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      openModal();
      return;
    }

    if (!productData?._id || !productData?.variants?.[0]) {
      toast.error("Product not available");
      return;
    }

    // Check for shipping address
    const shippingAddress = user?.addresses?.find(
      (addr) => addr.type === "shipping" && addr.isDefault
    );
    if (!shippingAddress) {
      toast.error("Please add a shipping address to continue with your order");
      // Store current product info for return
      localStorage.setItem(
        "buyNowReturn",
        JSON.stringify({
          productId: productData._id,
          path: window.location.pathname,
        })
      );
      router.push("/home/user/settings?section=shipping");
      return;
    }

    setIsBuyingNow(true);

    try {
      const variant = productData.variants[0];
      const optionId = selectedOptions[variant._id || variant.id];
      const option = variant.options?.find(
        (opt: any) => (opt.id || opt._id) === optionId
      );

      if (!option) {
        toast.error("Please select a product option");
        setIsBuyingNow(false);
        return;
      }

      if (option.quantity < quantity) {
        toast.error(`Only ${option.quantity} items available`);
        setIsBuyingNow(false);
        return;
      }

      const orderData = {
        productId: productData._id as string,
        variantId: variant._id || variant.id,
        optionId: option.id || option._id,
        quantity,
      };

      const buyNowData = await buyNowMutation.mutateAsync(orderData);

      if (!buyNowData.success) {
        toast.error(buyNowData.message || "Failed to process buy now");
        setIsBuyingNow(false);
        return;
      }

      const { pricing, item } = buyNowData.buyNow;

      setSummaryData({
        productId: productData._id as string,
        variantId: variant._id || variant.id,
        optionId: option.id || option._id,
        product: {
          name: productData.name,
          images: productData.images,
          vendor: {
            businessName:
              (productData.vendorId as any)?.businessInfo?.name ||
              "Unknown Vendor",
          },
        },
        variant: {
          name: variant.name,
          value: option?.value,
          price: item.price,
        },
        quantity,
        pricing,
        totalAmount: pricing.total,
        currency: pricing.currency || "USD",
        currencySymbol: pricing.currencySymbol || getSelectedOptionCurrency(),
      });

      setShowSummary(true);
      setIsBuyingNow(false);
    } catch (error: any) {
      console.error("Buy now error:", error);
      toast.error(error.message || "Failed to process buy now");
      setIsBuyingNow(false);
    }
  };

  const handlePlaceBidClicked = async () => {
    // Navigate to auction room directly — guests can view, auth required only to bid
    router.push(`/home/auction/${productData?._id}`);
  };

  const handleSubmitBid = async (bidAmount: number) => {
    if (!productData?._id) {
      toast.error("Product not available");
      return;
    }

    if (!bidAmount || bidAmount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    if (!user?._id) {
      toast.error("User not found");
      return;
    }

    setIsPlacingBid(true);
    try {
      await makeBidMutation.mutateAsync({
        productId: productData._id,
        userId: user._id,
        amount: bidAmount
      });
      toast.success("Bid placed successfully!");
      setIsBidModalOpen(false);
    } catch (error: any) {
      console.error("Bid error:", error);
      toast.error(error.message || "Failed to place bid");
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleSubmitOffer = async (offerAmount: number, optionId: string) => {
    if (!productData?._id) {
      toast.error("Product not available");
      return;
    }

    if (!offerAmount || offerAmount <= 0) {
      toast.error("Please enter a valid offer amount");
      return;
    }

    // Debug: Log price comparison
    const displayPrice = (productData as any)?.priceInfo?.displayPrice;
    const originalPrice = (productData as any)?.priceInfo?.originalPrice;
    const exchangeRate = (productData as any)?.priceInfo?.exchangeRate;
    const displayCurrency = (productData as any)?.priceInfo?.displayCurrency;
    const originalCurrency = (productData as any)?.priceInfo?.originalCurrency;
    console.log('[Offer Debug] Product displayed price (user currency):', displayPrice, displayCurrency);
    console.log('[Offer Debug] Product original price (vendor currency):', originalPrice, originalCurrency);
    console.log('[Offer Debug] Exchange rate:', exchangeRate);
    console.log('[Offer Debug] User entered offer amount:', offerAmount);
    console.log('[Offer Debug] Offer in vendor currency would be:', offerAmount / (exchangeRate || 1));

    setIsSubmittingOffer(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/products/offer/${productData._id}`,
        {
          method: "POST",
          body: JSON.stringify({
            price: offerAmount,
            optionId: optionId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[Offer Debug] Backend error response:', errorData);
        throw new Error(errorData.message || "Failed to submit offer");
      }

      const successData = await response.json().catch(() => ({}));
      console.log('[Offer Debug] Backend success response:', successData);
      toast.success("Offer submitted successfully!");
      setShowOfferModal(false);
    } catch (error: any) {
      console.error("[Offer Debug] Offer error:", error);
      toast.error(error.message || "Failed to submit offer");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={`${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
            ? "text-yellow-400 fill-current opacity-50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (totalQuantity === 0 && saleType !== "auction") {
    return (
      <div className="p-3 md:p-5 lg:p-6 md:border rounded-lg border-[#ADADAD4D]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="font-roboto text-base font-semibold text-gray-900 mb-2">
              Product Unavailable
            </h2>
            <p className="font-roboto text-xs text-gray-600">
              This product is currently out of stock.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-roboto md:p-5 lg:p-6 md:border rounded-tl-lg rounded-tr-lg border-[#ADADAD4D]">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Product Images Section */}
        <div className="space-y-4 lg:col-span-2">
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-64 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden border border-gray-200">
            <img
              src={
                productData?.images?.[selectedImage] || productData?.images?.[0]
              }
              alt={productData?.name}
              className="max-h-full max-w-full object-cover p-3 hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 right-4">
              <Wishlist
                productData={productData}
                price={
                  selectedVariant?.options?.[0]?.salePrice ||
                  selectedVariant?.options?.[0]?.price ||
                  0
                }
              />
            </div>
          </div>

          {/* Thumbnail Images */}
          <div className="flex gap-3 overflow-x-auto pb-2 mt-8">
            {productData?.images?.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedImage === i
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={item}
                  alt={productData?.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6 lg:col-span-3">
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(productData?.rating || 0)}</div>
            <span className="font-roboto text-xs font-medium text-gray-700">
              {productData?.rating} Seller Star Rating
            </span>
          </div>

          {/* Product Title */}
          <h1 className="font-roboto text-base md:text-lg lg:text-xl font-bold text-gray-900">
            {productData?.name}
          </h1>

          {/* Description */}
          <p className="font-roboto text-gray-600 text-xs leading-relaxed">
            {productData?.description}
          </p>

          {/* Product Details Grid */}
          <div className="space-y-3 border-b border-gray-400 pb-4">
            <div className="font-roboto grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between sm:flex-col">
                <span className="text-gray-600">Category:</span>
                <span className="text-blue-600 font-medium">
                  {productData?.category?.main?.name}
                </span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-gray-600">Quantity Left:</span>
                <span className="font-medium">{totalQuantity}</span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-gray-600">Subcategory:</span>
                <span className="text-blue-600 font-medium">
                  {
                    productData?.category?.sub[
                      productData?.category?.sub.length - 1
                    ]?.name
                  }
                </span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-gray-600">Product ID:</span>
                <span className="font-medium truncate">{productData?._id}</span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-gray-600">Seller's Account Type:</span>
                <span className="text-blue-600 font-medium">
                  {(productData?.vendorId as any)?.accountType
                    ?.charAt(0)
                    .toUpperCase() +
                    (productData?.vendorId as any)?.accountType?.slice(1)}
                </span>
              </div>
              {productData?.inventory?.listing?.type === "auction" ? (
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Total Bids:</span>
                  <span className="font-medium">
                    {bids ? ((bids as any)?.bids?.length || 0) : 0}
                  </span>
                </div>
              ) : acceptOffer &&
                offersArray &&
                offersArray.length > 0 ? (
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Total Offers:</span>
                  <span className="font-medium">{totalUserOffers}</span>
                </div>
              ) : (
                <>
                  {/* <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Total Views:</span>
                    <span className="font-medium">
                      {productData?.analytics?.views || 0}
                    </span>
                  </div> */}
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Add to Cart:</span>
                    <span className="font-medium">
                      {productData?.analytics?.addToCart || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {productData?.inventory?.listing?.type !== "auction" &&
            productData?.variants &&
            productData.variants.length > 0 && (
              <div className="space-y-6">
                <VariantDisplay
                  variants={productData.variants}
                  selectedOptions={selectedOptions}
                  onOptionChange={(variantId, optionId) => {
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [variantId]: optionId,
                    }));
                    setQuantity(1); // Reset quantity when variant changes
                  }}
                  currencySymbol={getSelectedOptionCurrency()}
                  priceInfo={{
                    exchangeRate:
                      (productData as any)?.priceInfo?.exchangeRate || 1,
                    currencySymbol: getSelectedOptionCurrency(),
                  }}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600 text-sm">Quantity:</p>
                    <p className="text-xs text-gray-500">
                      {getSelectedOptionStock() > 0
                        ? `Max: ${getSelectedOptionStock()}`
                        : "Out of Stock"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      type="button"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{quantity}</span>
                    <button
                      className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleIncrease}
                      disabled={quantity >= getSelectedOptionStock()}
                      aria-label="Increase quantity"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              {/* Price and Actions */}
              <div>
                {saleType === "instant" ? (
                  (() => {
                    const variant = productData?.variants?.[0];
                    const variantId = variant?._id || variant?.id || "";
                    const optionId = selectedOptions[variantId];
                    const option = variant?.options?.find(
                      (opt: any) => (opt.id || opt._id) === optionId
                    );
                    const exchangeRate =
                      (productData as any)?.priceInfo?.exchangeRate || 1;
                    const price = (option?.price || 0) * exchangeRate;
                    const salePrice = (option?.salePrice || 0) * exchangeRate;
                    const hasDiscount = salePrice > 0 && salePrice < price;

                    return (
                      <div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="font-roboto text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                              <NumericFormat
                                value={getSelectedOptionPrice()}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={getSelectedOptionCurrency()}
                                decimalScale={2}
                                fixedDecimalScale={true}
                              />
                            </div>
                            {hasDiscount && (
                              <>
                                <div className="font-roboto text-xs md:text-sm text-gray-400 line-through">
                                  <NumericFormat
                                    value={price}
                                    displayType={"text"}
                                    thousandSeparator={true}
                                    prefix={getSelectedOptionCurrency()}
                                    decimalScale={2}
                                    fixedDecimalScale={true}
                                  />
                                </div>
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium">
                                  {Math.round(
                                    ((price - salePrice) / price) * 100
                                  )}
                                  % OFF
                                </span>
                              </>
                            )}
                          </div>
                          {quantity > 1 && (
                            <div className="font-roboto text-xs text-gray-600">
                              Total:{" "}
                              <NumericFormat
                                value={getTotalPrice()}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={getSelectedOptionCurrency()}
                                decimalScale={2}
                                fixedDecimalScale={true}
                              />{" "}
                              ({quantity} × {getSelectedOptionCurrency()}
                              {getSelectedOptionPrice().toFixed(2)})
                            </div>
                          )}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Buy now
                        </div>
                      </div>
                    );
                  })()
                ) : saleType === "auction" ? (
                  (() => {
                    const bidsFromApi = (bids as any)?.bids || [];
                    const auctionInfoApi = (bids as any)?.auctionInfo;
                    const winningBid = bidsFromApi.find(
                      (bid: any) => bid.isWinning
                    );
                    // auctionInfo.startBidPrice is already in USD from backend
                    // Fallback chain: winningBid → auctionInfoApi.startBidPrice → productData startBidPrice → 0
                    const highestBidUSD = winningBid
                      ? winningBid.currentAmount
                      : auctionInfoApi?.startBidPrice || productData?.inventory?.listing?.auction?.startBidPrice || 0;
                    const isAuctionStarted = auction?.isStarted;

                    // For local currency equivalent:
                    // - If there's a winning bid (USD), use USD→user rate from priceInfo
                    // - If no bids, use exact vendor start price × vendorToUserRate
                    // - If bids data is unavailable, use productData.priceInfo.exchangeRate as fallback
                    const bidsDataAvailable = !!(bids as any)?.priceInfo;
                    const usdToUserRate = (bids as any)?.priceInfo?.exchangeRate || (productData as any)?.priceInfo?.exchangeRate || 1;
                    const v2uRate = auctionInfoApi?.vendorToUserRate || 1;
                    const vendorStartBid = auctionInfoApi?.vendorStartBidPrice || 0;
                    const localEquivalent = winningBid
                      ? highestBidUSD * usdToUserRate
                      : bidsDataAvailable
                        ? vendorStartBid * v2uRate
                        : highestBidUSD * usdToUserRate;
                    const userCurrencyCode = (bids as any)?.priceInfo?.userCurrency || (productData as any)?.priceInfo?.displayCurrency || "USD";
                    const currSymbol = (bids as any)?.priceInfo?.displayCurrency || (productData as any)?.priceInfo?.currencySymbol || "$";
                    const isNonUSD = userCurrencyCode.toUpperCase() !== "USD";

                    return (
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-roboto text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                            <NumericFormat
                              value={highestBidUSD}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix="$"
                              decimalScale={2}
                              fixedDecimalScale={true}
                            />
                            <span className="text-sm ml-1">USD</span>
                          </div>
                        </div>
                        {isNonUSD && (
                          <div className="font-roboto text-xs text-gray-500">
                            ≈{" "}
                            <NumericFormat
                              value={localEquivalent}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={currSymbol}
                              decimalScale={2}
                              fixedDecimalScale={true}
                            />
                            {" "}{userCurrencyCode}
                          </div>
                        )}
                        <div className="text-xs md:text-sm text-gray-500">
                          {isAuctionStarted ? "Bid now" : "Buy now"}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div>
                    <div className="font-roboto text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                      <NumericFormat
                        value={(productData as any)?.priceInfo?.displayPrice}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      Buy now
                    </div>
                  </div>
                )}
              </div>
              {productData?.inventory?.listing?.type !== "auction" && (
                <div className="flex items-center gap-2">
                  <Wishlist
                    productData={productData}
                    price={(() => {
                      const variant = productData?.variants?.[0];
                      const optionId =
                        selectedOptions[variant?._id || variant?.id || ""];
                      const option = variant?.options?.find(
                        (opt: any) => (opt.id || opt._id) === optionId
                      );
                      return option?.salePrice || option?.price || 0;
                    })()}
                    optionId={(() => {
                      const variant = productData?.variants?.[0];
                      return selectedOptions[variant?._id || variant?.id || ""];
                    })()}
                    variantId={
                      productData?.variants?.[0]?._id ||
                      productData?.variants?.[0]?.id
                    }
                  />
                  <span className="font-roboto text-gray-600 text-xs">Add to Wishlist</span>
                </div>
              )}
              {productData?.inventory?.listing?.type !== "auction" &&
                (productData?.inventory?.listing?.instant?.acceptOffer ? (
                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => {
                        if (!user) {
                          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                          openModal();
                          return;
                        }
                        setShowOfferModal(true);
                      }}
                      className="p-2 rounded-sm hover:bg-orange-100 bg-orange-50 transition-colors cursor-pointer"
                    >
                      <Tag className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="font-roboto text-gray-600 text-xs">Make Offer</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      onClick={isJoiningChat ? undefined : handleMessageSeller}
                      className={`p-2 rounded-sm hover:bg-orange-100 bg-orange-50 transition-colors ${
                        isJoiningChat
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5 text-orange-300" />
                    </div>
                    <span className="font-roboto text-gray-600 text-xs">
                      Message Seller
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Auction Countdown */}
          {productData?.inventory?.listing?.type === "auction" && (
            <AuctionCountdown auction={productData.inventory.listing.auction} />
          )}

          {/* Action Buttons */}
          {productData?.inventory?.listing?.type !== "auction" ? (
            <div className={`grid grid-cols-1 ${acceptOffer ? 'sm:grid-cols-8' : 'sm:grid-cols-7'} gap-3`}>
              <button
                onClick={handleMessageSeller}
                disabled={isJoiningChat}
                className="font-roboto bg-white border-2 border-orange-300 text-orange-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2 cursor-pointer"
              >
                {isJoiningChat ? "Joining..." : "Message"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isBuyingNow || getSelectedOptionStock() === 0}
                className={`font-roboto bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors ${acceptOffer ? 'sm:col-span-2' : 'sm:col-span-3'} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isBuyingNow ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : getSelectedOptionStock() === 0 ? (
                  "Out of Stock"
                ) : (
                  "Buy Now"
                )}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isLoading || getSelectedOptionStock() === 0}
                className="font-roboto bg-orange-400 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2 cursor-pointer"
              >
                {isLoading
                  ? "Adding..."
                  : getSelectedOptionStock() === 0
                  ? "Out of Stock"
                  : "Add To Cart"}
              </button>
              {acceptOffer && (
                <button
                  onClick={() => setShowOfferModal(true)}
                  disabled={getSelectedOptionStock() === 0}
                  className="font-roboto bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2 cursor-pointer"
                >
                  Make Offer
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center gap-4">
              {!productData.inventory.listing.auction?.isStarted && (
                <button
                  onClick={handleBuyNow}
                  disabled={
                    isBuyingNow ||
                    productData.inventory.listing.auction?.isExpired
                  }
                  className={`font-roboto w-full px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2
                      ${
                        isBuyingNow ||
                        productData.inventory.listing.auction?.isExpired
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : "bg-orange-400 hover:bg-orange-500 cursor-pointer text-white"
                      }`}
                >
                  {isBuyingNow ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Buy Now"
                  )}
                </button>
              )}

              <button
                onClick={handlePlaceBidClicked}
                disabled={
                  isLoading ||
                  productData.inventory.listing.auction?.isExpired ||
                  !productData.inventory.listing.auction?.isStarted
                }
                className={`font-roboto w-full px-4 py-2 rounded-lg text-xs font-medium transition-colors 
                ${
                  isLoading ||
                  productData.inventory.listing.auction?.isExpired ||
                  !productData.inventory.listing.auction?.isStarted
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer text-white"
                }`}
              >
                {isLoading ? (
                  <ClipLoader color="white" size={18} />
                ) : (
                  "Place Bid"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <BidModal1
        isBid={isBidModalOpen}
        closeBid={() => setIsBidModalOpen(false)}
        productData={productData}
        onSubmitBid={handleSubmitBid}
        isPlacingBid={isPlacingBid}
      />

      {summaryData && (
        <BuyNowSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          orderData={summaryData}
        />
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <OfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          productData={productData}
          onSubmitOffer={handleSubmitOffer}
          isSubmitting={isSubmittingOffer}
          selectedOptionId={
            selectedOptions[
              productData?.variants?.[0]?._id ??
                productData?.variants?.[0]?.id ??
                ""
            ] || ""
          }
        />
      )}
    </div>
  );
};

export default ProductInfo;
