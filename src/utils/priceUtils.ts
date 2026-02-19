/**
 * Price Utility Functions for Cart and Wishlist Price Display
 *
 * SINGLE SOURCE OF TRUTH PRINCIPLE:
 * The backend is the single source of truth for price conversion.
 * The frontend should NEVER perform currency conversion calculations.
 *
 * The backend's `getCart` and wishlist methods return `priceInfo.displayPrice` which is
 * already converted to the user's currency. Frontend components should use
 * this value directly without any additional multiplication by exchange rates.
 *
 * This module provides centralized functions for price display to ensure
 * consistent behavior across all cart and wishlist components and prevent the
 * double-conversion bug where prices were incorrectly multiplied by exchange
 * rates twice.
 */

import { CartItem } from '@/types/product.type';
import { Wishlist } from '@/types/wishlist.type';

/**
 * PriceInfo interface representing the price information returned by the backend.
 * The displayPrice is pre-converted to the user's currency.
 */
export interface PriceInfo {
  originalPrice: number;
  originalCurrency: string;
  displayPrice: number;
  displayCurrency: string;
  currencySymbol: string;
  exchangeRate: number;
}

/**
 * Generic interface for items that have price information.
 * Both CartItem and Wishlist items conform to this interface.
 */
export interface ItemWithPriceInfo {
  priceInfo?: PriceInfo;
  /** Fallback price when priceInfo is not available */
  fallbackPrice?: number;
}

/**
 * Validates that a display price is a valid positive number.
 *
 * A valid display price must be:
 * - A number (not undefined or null)
 * - Finite (not Infinity or -Infinity)
 * - Not NaN
 * - Greater than zero
 *
 * @param price - The price value to validate
 * @returns true if the price is a valid positive finite number, false otherwise
 *
 * **Validates: Requirements 6.3**
 */
export const validateDisplayPrice = (price: unknown): boolean => {
  if (typeof price !== 'number') {
    return false;
  }

  if (!Number.isFinite(price)) {
    return false;
  }

  return price > 0;
};

/**
 * Gets the display price for a cart item.
 *
 * IMPORTANT: This function returns the backend-calculated displayPrice directly.
 * It does NOT perform any currency conversion - that is the backend's responsibility.
 *
 * Fallback chain:
 * 1. Primary: Use `priceInfo.displayPrice` (backend-calculated, already converted)
 * 2. Fallback: Use `selectedVariant.price` (may be in wrong currency - logs warning)
 * 3. Last resort: Return 0 (logs error)
 *
 * @param item - The cart item to get the display price for
 * @returns The display price as a number
 *
 * **Validates: Requirements 1.3, 1.4, 2.1, 2.3**
 */
export const getDisplayPrice = (item: CartItem): number => {
  // Primary: Use backend-calculated displayPrice
  if (validateDisplayPrice(item.priceInfo?.displayPrice)) {
    return item.priceInfo!.displayPrice;
  }

  // Fallback: Use variant price (may be in wrong currency)
  if (validateDisplayPrice(item.selectedVariant?.price)) {
    console.warn(
      `[priceUtils] Using fallback price for item ${item.product._id}. ` +
        `priceInfo.displayPrice was invalid or missing. ` +
        `This may result in incorrect currency display.`
    );
    return item.selectedVariant!.price;
  }

  // Last resort
  console.error(
    `[priceUtils] No valid price for item ${item.product._id}. ` +
      `Both priceInfo.displayPrice and selectedVariant.price are invalid or missing.`
  );
  return 0;
};

/**
 * Calculates the total price for a cart item (displayPrice × quantity).
 *
 * IMPORTANT: This function uses the backend-calculated displayPrice directly.
 * It does NOT apply any exchange rate multiplication.
 *
 * @param item - The cart item to calculate the total for
 * @returns The item total (displayPrice × quantity)
 *
 * **Validates: Requirements 2.2, 2.4**
 */
export const getItemTotal = (item: CartItem): number => {
  const displayPrice = getDisplayPrice(item);
  return displayPrice * item.quantity;
};


/**
 * Gets the display price for a wishlist item.
 *
 * IMPORTANT: This function returns the backend-calculated displayPrice directly.
 * It does NOT perform any currency conversion - that is the backend's responsibility.
 *
 * This function ensures wishlist items use the same price display logic as cart items,
 * maintaining consistency across the shopping experience.
 *
 * Fallback chain:
 * 1. Primary: Use `priceInfo.displayPrice` (backend-calculated, already converted)
 * 2. Fallback: Use `price` field (may be in wrong currency - logs warning)
 * 3. Last resort: Return 0 (logs error)
 *
 * @param item - The wishlist item to get the display price for
 * @returns The display price as a number
 *
 * **Validates: Requirements 5.1, 5.3, 5.5**
 */
export const getWishlistDisplayPrice = (item: Wishlist): number => {
  // Primary: Use backend-calculated displayPrice
  if (validateDisplayPrice(item.priceInfo?.displayPrice)) {
    return item.priceInfo!.displayPrice;
  }

  // Fallback: Use price field (may be in wrong currency)
  if (validateDisplayPrice(item.price)) {
    console.warn(
      `[priceUtils] Using fallback price for wishlist item ${item.productId}. ` +
        `priceInfo.displayPrice was invalid or missing. ` +
        `This may result in incorrect currency display.`
    );
    return item.price;
  }

  // Last resort
  console.error(
    `[priceUtils] No valid price for wishlist item ${item.productId}. ` +
      `Both priceInfo.displayPrice and price are invalid or missing.`
  );
  return 0;
};
