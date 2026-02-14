"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Minus, Plus, X, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Home/Header";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useCartSync } from "@/hooks/useCartSync";
import { useValidateCart } from "@/hooks/useCheckout";
import { CartValidationModal } from "@/components/CartValidationModal";
import { CartValidationResponse } from "@/utils/checkoutService";
import { cartService } from "@/utils/cartService";
import CartSidebar from "./(components)/CartSidebar";
import { NumericFormat } from "react-number-format";
import { toast } from "react-hot-toast";
// import { BidModal1 } from "../product-details/[id]/(component)/(component)/BidModal";

const isHexColor = (value: string) => /^#[0-9A-F]{6}$/i.test(value);

const extractColorFromValue = (value: string) => {
  const colors = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "orange",
    "gray",
    "grey",
    "silver",
    "gold",
    "rose",
    "space",
  ];
  const lowerValue = value.toLowerCase();
  return colors.find((color) => lowerValue.includes(color)) || null;
};

const getColorForValue = (value: string) => {
  // Check if it starts with a hex color
  const hexMatch = value.match(/^#[0-9A-F]{6}/i);
  if (hexMatch) return hexMatch[0];

  const colorMap: { [key: string]: string } = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    blue: "#0000FF",
    green: "#008000",
    yellow: "#FFFF00",
    purple: "#800080",
    pink: "#FFC0CB",
    orange: "#FFA500",
    gray: "#808080",
    grey: "#808080",
    silver: "#C0C0C0",
    gold: "#FFD700",
    rose: "#FF69B4",
    space: "#2F2F2F",
  };

  const colorName = extractColorFromValue(value);
  return colorName ? colorMap[colorName] : null;
};

const getItemPrice = (item: any) => {
  return item.selectedVariant?.price * item?.priceInfo?.exchangeRate || 0;
};

const getItemTotal = (item: any) => {
  return getItemPrice(item) * item.quantity;
};

export default function CartPage() {
  const {
    items: cartItem,
    summary: cartSummary,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,
  } = useCartStore();

  const { user } = useUserStore();
  const isLoggedIn = !!user;
  const { openModal } = useAuthModalStore();

  const hasLoadedRef = useRef(false);

  useCartSync();

  // Remove this effect since useCartSync already handles loading

  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedAuctionItem, setSelectedAuctionItem] = useState<any>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationData, setValidationData] =
    useState<CartValidationResponse | null>(null);
  const [availableQuantities, setAvailableQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [isCheckingQuantity, setIsCheckingQuantity] = useState<{
    [key: string]: boolean;
  }>({});
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const hasCheckedQuantities = useRef(false);

  const buyItems = cartItem || [];

  const removeAll = async () => {
    await clearCart();
  };

  const handleRemove = async (item: any) => {
    const productId = item?.product?._id;
    const variantKey = item?.selectedVariant
      ? `${item.selectedVariant.variantId}::${item.selectedVariant.optionId}`
      : undefined;
    await removeFromCart(productId, variantKey);
    toast.success("Item removed from cart");
  };

  const checkAvailableQuantity = useCallback(async (item: any) => {
    if (!item?.selectedVariant || !item?.product?._id) return;

    const key = `${item.product._id}-${item.selectedVariant.optionId}`;
    setIsCheckingQuantity((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await cartService.getOptionQuantity(
        item.product._id,
        item.selectedVariant.variantId,
        item.selectedVariant.optionId
      );

      if (result.success && result.data) {
        setAvailableQuantities((prev) => ({
          ...prev,
          [key]: result.data!.quantity,
        }));
      }
    } catch (error) {
      console.error("Failed to check quantity:", error);
      // Set a default high value so buttons aren't disabled on error
      setAvailableQuantities((prev) => ({ ...prev, [key]: 999 }));
    } finally {
      setIsCheckingQuantity((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const [pendingUpdates, setPendingUpdates] = useState<{ [key: string]: number }>({});
  const updateTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleQuantityChange = useCallback(
    (item: any, newQuantity: number) => {
      if (newQuantity < 1) return;

      const productId = item?.product?._id;
      const variantKey = item?.selectedVariant
        ? `${item.selectedVariant.variantId}::${item.selectedVariant.optionId}`
        : undefined;
      const key = `${productId}-${item?.selectedVariant?.optionId}`;

      // Update UI immediately for better UX
      setPendingUpdates(prev => ({ ...prev, [key]: newQuantity }));

      // Clear existing timer
      if (updateTimers.current[key]) {
        clearTimeout(updateTimers.current[key]);
      }

      // Debounce the actual update
      updateTimers.current[key] = setTimeout(async () => {
        try {
          await updateQuantity(productId, newQuantity, variantKey);
          setPendingUpdates(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        } catch (error) {
          // Revert UI on error
          setPendingUpdates(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }
      }, 500);
    },
    [updateQuantity]
  );

  const getDisplayQuantity = (item: any) => {
    const key = `${item.product._id}-${item.selectedVariant?.optionId}`;
    return pendingUpdates[key] ?? item.quantity;
  };

  const isQuantityPending = (item: any) => {
    const key = `${item.product._id}-${item.selectedVariant?.optionId}`;
    return key in pendingUpdates;
  };

  useEffect(() => {
    // Check quantities only once on mount or when cart items change
    if (buyItems.length > 0 && !hasCheckedQuantities.current) {
      buyItems.forEach((item) => {
        if (item?.selectedVariant) {
          checkAvailableQuantity(item);
        }
      });
      hasCheckedQuantities.current = true;
    }
  }, [buyItems.length, checkAvailableQuantity]);

  useEffect(() => {
    return () => {
      // Cleanup timers on unmount
      Object.values(debounceTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/home/my-cart" },
    { label: "Buy Now", href: null },
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item?.href);
    }
  };

  const BuyNow = () => {
    const subtotal = cartSummary.subtotal;
    const shipping = 50000;
    const discount = 5000;
    const tax = 5000;
    const total = subtotal + shipping - discount + tax;
    return (
      <div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
                <div className="col-span-4">Products</div>
                <div className="col-span-2">Variant</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Sub Total</div>
              </div>

              {/* Items */}
              <div className="divide-y overflow-x-auto">
                {buyItems.map((item) => (
                  <div
                    key={`${item.product?._id}::${item.selectedVariant?.variantId || ''}::${item.selectedVariant?.optionId || ''}`}
                    className="p-4"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0 text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 z-10"
                        onClick={() => handleRemove(item)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Link
                        href={{
                          pathname: "/home/product-details/[id]",
                          query: {
                            id: item?.product._id,
                            productData: JSON.stringify(item?.product),
                          },
                        }}
                        as={`/home/product-details/${item?.product._id}`}
                        className="block"
                      >
                        <div className="flex gap-3 mb-3">
                          <Image
                            src={
                              item?.product?.images?.[0] || "/placeholder.svg"
                            }
                            alt={item?.product?.name || "product image"}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 pr-6">
                            <h3 className="font-semibold text-sm leading-tight mb-1">
                              {item?.product?.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {item?.product?.description}
                            </p>
                            {item?.selectedVariant && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-xs text-gray-500">
                                  {item.selectedVariant.variantName}:
                                </span>
                                {getColorForValue(
                                  item.selectedVariant.optionValue
                                ) ? (
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                      style={{
                                        backgroundColor:
                                          getColorForValue(
                                            item.selectedVariant.optionValue
                                          ) || undefined,
                                      }}
                                    />
                                    <span className="text-xs font-medium">
                                      {item.selectedVariant.optionValue}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium">
                                    {item.selectedVariant.optionValue}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-base font-bold text-gray-900">
                              <NumericFormat
                                value={getItemPrice(item).toFixed(2)}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={item?.priceInfo?.currencySymbol || "$"}
                                decimalScale={2}
                                fixedDecimalScale={true}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-md"
                            onClick={() =>
                              handleQuantityChange(item, getDisplayQuantity(item) - 1)
                            }
                            disabled={isQuantityPending(item)}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">
                            {getDisplayQuantity(item)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-md"
                            disabled={(() => {
                              const key = `${item.product._id}-${item.selectedVariant?.optionId}`;
                              const available = availableQuantities[key];
                              return (
                                isQuantityPending(item) ||
                                (available !== undefined &&
                                getDisplayQuantity(item) >= available)
                              );
                            })()}
                            onClick={() =>
                              handleQuantityChange(item, getDisplayQuantity(item) + 1)
                            }
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="text-base font-bold text-gray-900">
                          <NumericFormat
                            value={getItemTotal(item).toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={item?.priceInfo?.currencySymbol || "$"}
                            decimalScale={2}
                            fixedDecimalScale={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 z-10"
                        onClick={() => handleRemove(item)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="col-span-4 flex items-center space-x-3">
                        <Link
                          href={{
                            pathname: "/home/product-details/[id]",
                            query: {
                              id: item?.product._id,
                              productData: JSON.stringify(item?.product), // Pass full product data
                            },
                          }}
                          as={`/home/product-details/${item?.product._id}`} // Clean URL in browser
                          className="flex items-center space-x-3"
                        >
                          {" "}
                          <div className="relative">
                            <Image
                              src={
                                item?.product?.images?.[0] || "/placeholder.svg"
                              }
                              alt={item?.product?.name || "product image"}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {item?.product?.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {item?.product?.description}
                            </p>
                          </div>
                        </Link>
                      </div>
                      <div className="col-span-2">
                        {item?.selectedVariant && (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">
                              {item.selectedVariant.variantName}
                            </span>
                            {getColorForValue(
                              item.selectedVariant.optionValue
                            ) ? (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-5 h-5 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor:
                                      getColorForValue(
                                        item.selectedVariant.optionValue
                                      ) || undefined,
                                  }}
                                />
                                <span className="text-sm font-medium">
                                  {item.selectedVariant.optionValue}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">
                                {item.selectedVariant.optionValue}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">
                            <NumericFormat
                              value={getItemPrice(item).toFixed(2)}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={item?.priceInfo?.currencySymbol || "$"}
                              decimalScale={2}
                              fixedDecimalScale={true}
                            />
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleQuantityChange(item, getDisplayQuantity(item) - 1)
                            }
                            disabled={isQuantityPending(item)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {getDisplayQuantity(item).toString().padStart(2, "0")}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={(() => {
                              const key = `${item.product._id}-${item.selectedVariant?.optionId}`;
                              const available = availableQuantities[key];
                              return (
                                isQuantityPending(item) ||
                                (available !== undefined &&
                                getDisplayQuantity(item) >= available)
                              );
                            })()}
                            onClick={() =>
                              handleQuantityChange(item, getDisplayQuantity(item) + 1)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2 font-bold">
                        <NumericFormat
                          value={getItemTotal(item).toFixed(2)}
                          displayType={"text"}
                          thousandSeparator={true}
                          prefix={item?.priceInfo?.currencySymbol || "$"}
                          decimalScale={2}
                          fixedDecimalScale={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Total Sidebar */}
          <CartSidebar
            user={user}
            setShowValidationModal={setShowValidationModal}
            openModal={openModal}
            setValidationData={setValidationData}
          />
        </div>
      </div>
    );
  };

  if (!isLoading && buyItems && buyItems.length < 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 md:py-8 lg:py-10 font-roboto">
          <div className="pt-4">
            {/* Breadcrumb */}
            <Breadcrumbs
              items={manualBreadcrumbs}
              onItemClick={handleBreadcrumbClick}
              className="mb-4"
            />
          </div>
          <div className="flex flex-col items-center justify-center h-full mt-15">
            <div className="text-center">
              <h1 className=" text-lg md:text-2xl font-bold mb-2">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Button
                variant="outline"
                className="text-blue-600 hover:text-blue-800"
                onClick={() => router.push("/home")}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-8 lg:py-10 font-roboto">
        <div className="">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          {/* Header */}
          <div className="flex flex-row items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold">My Cart</h1>
              <span className="text-gray-600">
                {cartSummary.totalItems} Items
              </span>
            </div>

            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
              onClick={removeAll}
            >
              Remove All
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-2 md:py-4">
          <BuyNow />
        </div>

        {/* {selectedAuctionItem && (
          <BidModal1
            isOpen={showBidModal}
            onClose={() => setShowBidModal(false)}
            auctionItem={selectedAuctionItem}
          />
        )} */}

        <CartValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          validationData={validationData}
          onProceed={() => {
            setShowValidationModal(false);
            router.push("/home/checkout");
          }}
        />
      </div>
    </div>
  );
}
