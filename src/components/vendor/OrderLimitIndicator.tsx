"use client";

import React from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";

const PERSONAL_ACCOUNT_ORDER_LIMIT = 100;
const THEME_COLOR = "#002f7a";

interface OrderLimitIndicatorProps {
  accountType: "personal" | "business";
  fulfilledOrders: number;
  onUpgradeClick?: () => void;
}

const OrderLimitIndicator: React.FC<OrderLimitIndicatorProps> = ({
  accountType,
  fulfilledOrders,
  onUpgradeClick,
}) => {
  // Only show for personal accounts
  if (accountType !== "personal") {
    return null;
  }

  const remainingOrders = Math.max(0, PERSONAL_ACCOUNT_ORDER_LIMIT - fulfilledOrders);
  const progressPercentage = Math.min(
    (fulfilledOrders / PERSONAL_ACCOUNT_ORDER_LIMIT) * 100,
    100
  );
  const isApproachingLimit = fulfilledOrders >= 80;
  const isAtLimit = fulfilledOrders >= PERSONAL_ACCOUNT_ORDER_LIMIT;

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm w-full font-roboto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} style={{ color: THEME_COLOR }} />
          <p className="font-medium text-[#211f1f]">Order Fulfillment</p>
        </div>
        {isApproachingLimit && !isAtLimit && (
          <div className="flex items-center gap-1 text-amber-600 text-xs">
            <AlertTriangle size={14} />
            <span>Approaching limit</span>
          </div>
        )}
        {isAtLimit && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertTriangle size={14} />
            <span>Limit reached</span>
          </div>
        )}
      </div>

      {/* Stats Display */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-2xl font-medium text-[#211f1f]">
            {fulfilledOrders}
            <span className="text-sm text-gray-500 font-normal ml-1">
              / {PERSONAL_ACCOUNT_ORDER_LIMIT}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Orders fulfilled</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium" style={{ color: isAtLimit ? "#dc2626" : THEME_COLOR }}>
            {remainingOrders}
          </p>
          <p className="text-xs text-gray-500">Remaining</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="h-2.5 rounded-full transition-all duration-300"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: isAtLimit
              ? "#dc2626"
              : isApproachingLimit
              ? "#f59e0b"
              : THEME_COLOR,
          }}
        />
      </div>

      {/* Upgrade CTA for approaching/at limit */}
      {isApproachingLimit && onUpgradeClick && (
        <div
          className={`p-3 rounded-lg ${
            isAtLimit ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
          }`}
          role="alert"
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle 
              size={16} 
              className={`flex-shrink-0 mt-0.5 ${isAtLimit ? "text-red-600" : "text-amber-600"}`} 
            />
            <p className={`text-sm ${isAtLimit ? "text-red-700" : "text-amber-700"}`}>
              {isAtLimit
                ? "You've reached the 100 order limit for personal accounts. Upgrade to continue fulfilling orders."
                : `You've fulfilled ${fulfilledOrders} of ${PERSONAL_ACCOUNT_ORDER_LIMIT} orders. Consider upgrading for unlimited fulfillment.`}
            </p>
          </div>
          <button
            onClick={onUpgradeClick}
            className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: THEME_COLOR }}
          >
            Upgrade to Business Account
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderLimitIndicator;
