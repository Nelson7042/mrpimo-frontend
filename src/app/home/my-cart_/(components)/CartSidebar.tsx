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
    error,
  } = useValidateCart();
  const { summary, items } = useCartStore();
  const hasValidatedRef = React.useRef(false);
  const prevItemsCountRef = React.useRef(summary.totalItems);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Force re-render when cart summary changes
  useEffect(() => {
    forceUpdate();
  }, [summary.subtotal, summary.total, summary.totalItems]);

  // useEffect(() => {
  //   if (prevItemsCountRef.current !== summary.totalItems) {
  //     hasValidatedRef.current = false;
  //     prevItemsCountRef.current = summary.totalItems;
  //   }

  //   if (!props.user || summary.totalItems === 0 || hasValidatedRef.current) return;

  //   const runValidation = async () => {
  //     try {
  //       const result = await validateCart();
  //       hasValidatedRef.current = true;
  //     } catch (err) {
  //       console.error("Validation failed:", err);
  //     }
  //   };

  //   runValidation();
  // }, [summary.totalItems, props.user]);

  // if (isValidating && props.user) {
  //   return (<CartTotalSkeleton />)
  // }

  const pricing = props.user && data?.checkout?.pricing ? data.checkout.pricing : {
    currency: items[0]?.priceInfo?.currencySymbol || "₦",
    subtotal: summary.subtotal || 0,
    shipping: 0,
    tax: 0,
    total: summary.subtotal || 0
  };

  return (
    <div className="lg:col-span-1">
      <div>
        <div className="">
          <h3 className="font-semibold text-center text-lg mb-4">Cart Total</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Sub Total:</span>
              <span>
                {pricing.currency}
                {pricing.subtotal?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>
                {pricing.currency}
                {pricing.shipping?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                {pricing.currency}
                {pricing.tax?.toFixed(2)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>
                {pricing.currency}
                {pricing.total?.toFixed(2)}
              </span>
            </div>
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
