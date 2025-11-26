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
  const { summary } = useCartStore();
  const hasValidatedRef = React.useRef(false);
  const prevItemsCountRef = React.useRef(summary.totalItems);

  useEffect(() => {
    // Reset validation flag when items count changes
    if (prevItemsCountRef.current !== summary.totalItems) {
      hasValidatedRef.current = false;
      prevItemsCountRef.current = summary.totalItems;
    }

    if (summary.totalItems === 0 || hasValidatedRef.current) return;

    const runValidation = async () => {
      try {
        const result = await validateCart();
        hasValidatedRef.current = true;
      } catch (err) {
        console.error("Validation failed:", err);
      }
    };

    runValidation();
  }, [summary.totalItems]);

    if (isValidating) {
      return (<CartTotalSkeleton />)
    }


  return (
    <div className="lg:col-span-1">
      <div>
        <div className="">
          <h3 className="font-semibold text-center text-lg mb-4">Cart Total</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Sub Total:</span>
              <span>
                {data?.checkout?.pricing?.currency}{" "}
                {data?.checkout?.pricing?.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              {data?.checkout?.pricing?.currency}{" "}
              {data?.checkout?.pricing?.shipping.toLocaleString()}
            </div>
            {/* <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>₦ {discount.toLocaleString()}</span>
                  </div> */}
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                {data?.checkout?.pricing?.currency}{" "}
                {data?.checkout?.pricing?.tax.toLocaleString()}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>
                {data?.checkout?.pricing?.currency}{" "}
                {data?.checkout?.pricing?.total.toLocaleString()}
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
