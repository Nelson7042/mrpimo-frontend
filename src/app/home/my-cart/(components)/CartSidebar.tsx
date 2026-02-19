"use client";

import { Button } from "@/components/ui/button";
import { useValidateCart } from "@/hooks/useCheckout";
import React from "react";
import { useCartStore } from "@/stores/cartStore";
import { useShippingEstimate } from "@/hooks/useShippingEstimate";
import { Info, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  openModal: () => void;
  user: any;
  setValidationData: (data: any) => void;
  setShowValidationModal: (show: boolean) => void;
};

const CartSidebar = (props: Props) => {
  const {
    refetch: validateCart,
    isLoading: isValidating,
    data,
  } = useValidateCart();
  const { summary, items, totals } = useCartStore();
  const isLoggedIn = !!props.user;

  // Check if user has a shipping address
  const hasShippingAddress = props.user?.addresses?.some(
    (addr: any) => addr.type === "shipping" && addr.isDefault
  );

  // Always fetch shipping estimate when logged in and cart has items
  const {
    data: estimateData,
    isLoading: isEstimateLoading,
  } = useShippingEstimate(isLoggedIn && items.length > 0);

  const estimate = estimateData?.estimate;
  // Check if shipping is based on IP (estimate) or actual address
  const isEstimate = estimate?.estimationType === "ip";
  const hasAddressBasedShipping = estimate?.estimationType === "address";

  // Get currency from totals (backend) or first item's priceInfo (fallback)
  const currencySymbol = totals?.currencySymbol || items[0]?.priceInfo?.currencySymbol || "$";
  const displayCurrency = totals?.currency || items[0]?.priceInfo?.displayCurrency || "USD";

  // Use backend totals if available (online), otherwise use local summary (offline)
  const subtotal = totals?.subtotal ?? summary.subtotal;
  const validatedShipping = data?.checkout?.pricing?.shipping || totals?.shipping || 0;
  // Use estimate shipping if available, otherwise use validated shipping
  const shipping = estimate?.totalShipping ?? validatedShipping;
  const tax = data?.checkout?.pricing?.tax || totals?.tax || 0;
  const total = data?.checkout?.pricing?.total || (totals ? subtotal + shipping + tax : summary.total);
  const currency = data?.checkout?.pricing?.currency || totals?.currency || displayCurrency;

  return (
    <div className="lg:col-span-1 font-roboto">
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <h3 className="font-medium text-center text-sm mb-4 text-gray-800">Cart Total</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Sub Total</span>
            <span className="font-medium text-gray-800">
              {currencySymbol} {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span className="flex items-center gap-1">
              Shipping
              {isEstimate && (
                <span className="text-[10px] text-amber-600 font-medium">(est.)</span>
              )}
              {hasAddressBasedShipping && (
                <CheckCircle className="w-3 h-3 text-blue-600" />
              )}
            </span>
            <span className="font-medium text-gray-800">
              {isEstimateLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              ) : (
                <>
                  {currencySymbol} {shipping.toFixed(2)}
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Tax</span>
            <span className="font-medium text-gray-800">
              {currencySymbol} {tax.toFixed(2)}
            </span>
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between font-medium text-sm text-gray-900 pt-1">
            <span>TOTAL</span>
            <span>
              {currencySymbol} {total.toFixed(2)}
            </span>
          </div>

          {/* Shipping estimate notice */}
          {isLoggedIn && isEstimate && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mt-3">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>
                Shipping is estimated.{" "}
                <Link
                  href="/home/user/settings?section=shipping"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Add address
                </Link>{" "}
                for exact cost.
              </p>
            </div>
          )}

          {/* Address-based shipping confirmation */}
          {isLoggedIn && hasAddressBasedShipping && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mt-3">
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>Shipping calculated from your saved address.</p>
            </div>
          )}

          {!isLoggedIn && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Login to see shipping and tax
            </p>
          )}
        </div>
        <div className="space-y-2.5 mt-5">
          {/* Show message if logged in but no shipping address */}
          {isLoggedIn && !hasShippingAddress && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 mb-2">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>
                Please{" "}
                <Link
                  href="/home/user/settings?section=shipping"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  add a shipping address
                </Link>{" "}
                to checkout.
              </p>
            </div>
          )}
          <Button
            onClick={async () => {
              if (!props.user) {
                props.openModal();
                return;
              }

              // Check for shipping address before proceeding
              if (!hasShippingAddress) {
                return;
              }

              const result = await validateCart();
              if (result.data) {
                props.setValidationData(result.data);
                props.setShowValidationModal(true);
              }
            }}
            disabled={isValidating || (isLoggedIn && !hasShippingAddress)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-9"
          >
            {isValidating ? "Validating..." : "Checkout"}
          </Button>
          <Button
            variant="outline"
            className="w-full bg-secondary text-black border-orange-200 hover:bg-orange-200 text-xs h-9"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
