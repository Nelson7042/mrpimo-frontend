"use client";

import React from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

const PERSONAL_ACCOUNT_ORDER_LIMIT = 100;
const WARNING_THRESHOLD = 80;
const THEME_COLOR = "#002f7a";

interface OrderLimitWarningBannerProps {
  accountType: "personal" | "business";
  fulfilledOrders: number;
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
  isDismissed?: boolean;
}

const OrderLimitWarningBanner: React.FC<OrderLimitWarningBannerProps> = ({
  accountType,
  fulfilledOrders,
  onUpgradeClick,
  onDismiss,
  isDismissed = false,
}) => {
  // Only show for personal accounts approaching the limit (80+)
  if (accountType !== "personal" || fulfilledOrders < WARNING_THRESHOLD || isDismissed) {
    return null;
  }

  const remainingOrders = Math.max(0, PERSONAL_ACCOUNT_ORDER_LIMIT - fulfilledOrders);
  const isAtLimit = fulfilledOrders >= PERSONAL_ACCOUNT_ORDER_LIMIT;

  return (
    <div
      className={`relative w-full rounded-lg p-4 mb-4 font-roboto ${
        isAtLimit
          ? "bg-red-50 border border-red-300"
          : "bg-amber-50 border border-amber-300"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div
          className={`flex-shrink-0 p-2 rounded-full ${
            isAtLimit ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          <AlertTriangle
            size={20}
            className={isAtLimit ? "text-red-600" : "text-amber-600"}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-sm md:text-base ${
              isAtLimit ? "text-red-800" : "text-amber-800"
            }`}
          >
            {isAtLimit
              ? "Order Fulfillment Limit Reached"
              : "Approaching Order Fulfillment Limit"}
          </h3>
          <p
            className={`mt-1 text-sm ${
              isAtLimit ? "text-red-700" : "text-amber-700"
            }`}
          >
            {isAtLimit
              ? "You've reached the 100 order limit for personal accounts. Upgrade to a business account to continue fulfilling orders without restrictions."
              : `You've fulfilled ${fulfilledOrders} of ${PERSONAL_ACCOUNT_ORDER_LIMIT} orders. Only ${remainingOrders} orders remaining before reaching your limit.`}
          </p>

          {/* Upgrade CTA Button */}
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: THEME_COLOR,
                focusRingColor: THEME_COLOR,
              }}
            >
              Upgrade to Business Account
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Dismiss Button (only for warning, not when at limit) */}
        {!isAtLimit && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full text-amber-600 hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Dismiss warning"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderLimitWarningBanner;
