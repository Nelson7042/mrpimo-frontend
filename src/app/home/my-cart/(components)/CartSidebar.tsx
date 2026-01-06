"use client";

import { Button } from "@/components/ui/button";
import { useValidateCart } from "@/hooks/useCheckout";
import React, { useEffect } from "react";
import CartTotalSkeleton from "./CartTotalSkeleton";
import { useCartStore } from "@/stores/cartStore";
import { NumericFormat } from "react-number-format";

type Props = {
  openModal: () => void;
  user: any;
  setValidationData: (data: any) => void;
  setShowValidationModal: (show: boolean) => void;
};

const getItemPrice = (item: any) => {
  return item.selectedVariant?.price * item?.priceInfo?.exchangeRate || 0;
};

const CartSidebar = (props: Props) => {
  const {
    refetch: validateCart,
    isLoading: isValidating,
    data,
    error,
  } = useValidateCart();
  // Just rely on store's derived state
  const { summary, items } = useCartStore();
  const hasValidatedRef = React.useRef(false);
  const prevItemsCountRef = React.useRef(summary.totalItems);
  const isLoggedIn = !!props.user;

  useEffect(() => {
    if (!isLoggedIn) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.totalItems, isLoggedIn, validateCart]);

  if (isValidating && isLoggedIn) {
    return <CartTotalSkeleton />;
  }

  // Get currency from first item's priceInfo
  const currencySymbol = items[0]?.priceInfo?.currencySymbol || "$";
  const displayCurrency = items[0]?.priceInfo?.displayCurrency || "USD";

  // Use validated data if available (online), otherwise use local summary (offline)
  const subtotal = data?.checkout?.pricing?.subtotal || summary.subtotal;
  // console.log("subtotal", subtotal)
  const shipping = data?.checkout?.pricing?.shipping || 0;
  // console.log("shipping", shipping)

  const tax = data?.checkout?.pricing?.tax || 0;
  // console.log("tax", tax)
  
  const total = data?.checkout?.pricing?.total || summary.total;
  // console.log("total", total)

  const currency = data?.checkout?.pricing?.currency || displayCurrency;

  return (
    <div className="lg:col-span-1">
      <div>
        <div className="">
          <h3 className="font-semibold text-center text-lg mb-4">Cart Total</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Sub Total:</span>
              <span>
                <NumericFormat
                  value={subtotal.toFixed(2)}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={currency || "$"}
                  decimalScale={2}
                  fixedDecimalScale={true}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>
                <NumericFormat
                  value={shipping.toFixed(2)}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={currency || "$"}
                  decimalScale={2}
                  fixedDecimalScale={true}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>
                <NumericFormat
                  value={tax.toFixed(2)}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={currency || "$"}
                  decimalScale={2}
                  fixedDecimalScale={true}
                />
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>
                <NumericFormat
                  value={total.toFixed(2)}
                  displayType={"text"}
                  thousandSeparator={true}
                  prefix={currency || "$"}
                  decimalScale={2}
                  fixedDecimalScale={true}
                />
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
