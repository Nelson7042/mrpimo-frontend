import { ProductType } from "@/types/product.type";

/**
 * Get the display price from a product
 * @param product - The product object
 * @returns The display price as a number, or 0 if not available
 */
export const getDisplayPrice = (product: any): number => {
  // Priority 1: Use priceInfo.displayPrice if available
  if (product?.priceInfo && typeof product.priceInfo.displayPrice === 'number' && !isNaN(product.priceInfo.displayPrice) && product.priceInfo.displayPrice > 0) {
    return product.priceInfo.displayPrice;
  }
  
  // Priority 2: Check if variant option has displayPrice
  const variantOption = product?.variants?.[0]?.options?.[0];
  if (variantOption?.displayPrice && typeof variantOption.displayPrice === 'number' && variantOption.displayPrice > 0) {
    return variantOption.displayPrice;
  }
  
  // Priority 3: Calculate from originalPrice * exchangeRate if available
  if (product?.priceInfo?.originalPrice && product?.priceInfo?.exchangeRate) {
    const calculatedPrice = product.priceInfo.originalPrice * product.priceInfo.exchangeRate;
    if (!isNaN(calculatedPrice) && calculatedPrice > 0) {
      return calculatedPrice;
    }
  }
  
  // Priority 4: Calculate from variant price * exchangeRate if available
  if (variantOption?.price && product?.priceInfo?.exchangeRate) {
    const calculatedPrice = variantOption.price * product.priceInfo.exchangeRate;
    if (!isNaN(calculatedPrice) && calculatedPrice > 0) {
      return calculatedPrice;
    }
  }
  
  // Priority 5: Fallback to variant price (this will be in original currency)
  // Note: This should only happen if priceInfo is not available from the API
  if (variantOption?.price) {
    return variantOption.price;
  }
  
  return 0;
};

/**
 * Get the currency symbol from a product
 * @param product - The product object
 * @returns The currency symbol, or "$" as default
 */
export const getCurrencySymbol = (product: any): string => {
  if (product?.priceInfo?.currencySymbol) {
    return product.priceInfo.currencySymbol;
  }
  
  if (product?.priceInfo?.displayCurrency) {
    return product.priceInfo.displayCurrency;
  }
  
  // Fallback to variant currency or default
  return product?.variants?.[0]?.options?.[0]?.currencySymbol || "$";
};

/**
 * Format a product price as a string
 * @param product - The product object
 * @param options - Formatting options
 * @returns Formatted price string (e.g., "$9.64" or "₦1,320.00")
 */
export const formatProductPrice = (
  product: any,
  options: {
    showDecimals?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const price = getDisplayPrice(product);
  const currency = getCurrencySymbol(product);
  
  const {
    showDecimals = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;
  
  if (showDecimals) {
    return `${currency}${price.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  }
  
  return `${currency}${price.toLocaleString()}`;
};

