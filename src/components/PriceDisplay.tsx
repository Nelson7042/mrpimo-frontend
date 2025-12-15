"use client";

import React from "react";
import { formatProductPrice, getDisplayPrice, getCurrencySymbol } from "@/utils/formatPrice";
import { NumericFormat } from "react-number-format";

interface PriceDisplayProps {
  product: any;
  variant?: "small" | "medium" | "large";
  showOriginal?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  product,
  variant = "medium",
  showOriginal = false,
  className = "",
}) => {
  const price = getDisplayPrice(product);
  const currency = getCurrencySymbol(product);
  const originalPrice = product?.priceInfo?.originalPrice;
  const hasDiscount = originalPrice && originalPrice > price;

  const sizeClasses = {
    small: "text-sm",
    medium: "text-base md:text-lg",
    large: "text-xl md:text-2xl lg:text-3xl",
  };

  if (price === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className={`font-semibold text-gray-900 ${sizeClasses[variant]}`}>
        <NumericFormat
          value={price}
          displayType="text"
          thousandSeparator={true}
          prefix={currency}
          decimalScale={2}
          fixedDecimalScale={true}
        />
      </div>
      {showOriginal && hasDiscount && originalPrice && (
        <div className="text-xs md:text-sm text-gray-500 line-through mt-1">
          <NumericFormat
            value={originalPrice}
            displayType="text"
            thousandSeparator={true}
            prefix={product?.priceInfo?.originalCurrency || currency}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;


