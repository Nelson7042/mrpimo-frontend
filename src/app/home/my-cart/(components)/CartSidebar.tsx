"use client";

import { Button } from "@/components/ui/button";
import { useValidateCart } from "@/hooks/useCheckout";
import React, { useEffect } from "react";
import CartTotalSkeleton from "./CartTotalSkeleton";
import { useCartStore } from "@/stores/cartStore";

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

  // Get currency from totals (backend) or first item's priceInfo (fallback)
  const currencySymbol = totals?.currencySymbol || items[0]?.priceInfo?.currencySymbol || "$";
  const displayCurrency = totals?.currency || items[0]?.priceInfo?.displayCurrency || "USD";

  // Use backend totals if available (online), otherwise use local summary (offline)
  const subtotal = totals?.subtotal ?? summary.subtotal;
  const shipping = data?.checkout?.pricing?.shipping || totals?.shipping || 0;
  const tax = data?.checkout?.pricing?.tax || totals?.tax || 0;
  const total = data?.checkout?.pricing?.total || (totals ? subtotal + shipping + tax : summary.total);
  const currency = data?.checkout?.pricing?.currency || totals?.currency || displayCurrency;

  return (
    <div className="lg:col-span-1">
      <div>
        <div className="">
          <h3 className="font-semibold text-center text-lg mb-4">Cart Total</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Sub Total:</span>
              <span>
                {currencySymbol} {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>
                {currencySymbol} {shipping.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                {currencySymbol} {tax.toFixed(2)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>
                {currencySymbol} {total.toFixed(2)}
              </span>
            </div>
            {!isLoggedIn && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Login to see shipping and tax
              </p>
            )}
          </div>
          <div className="space-y-3 mt-6">
            <Button
              onClick={async () => {
                if (!props.user) {
                  props.openModal();
                  return;
                }

                const result = await validateCart();
                if (result.data) {
                  props.setValidationData(result.data);
                  props.setShowValidationModal(true);
                }
              }}
              disabled={isValidating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isValidating ? "Validating..." : "Checkout"}
            </Button>
            <Button
              variant="outline"
              className="w-full bg-secondary text-black border-orange-200 hover:bg-orange-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
