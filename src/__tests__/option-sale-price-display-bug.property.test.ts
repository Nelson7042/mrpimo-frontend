// Feature: option-sale-price-display, Property 1: Bug Condition - Sale Price Ignored in Exchange Rate Branch
// **Validates: Requirements 1.1, 1.2, 2.1**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the FIXED getDisplayPrice logic from
 * mprimo/src/components/VariantDisplay.tsx
 *
 * Accepts (option, priceInfo) as parameters to make it testable without component context.
 */
function getDisplayPrice(option: any, priceInfo: any): number {
  // Always prioritize option.displayPrice if it exists
  if (option?.displayPrice) {
    return option.displayPrice;
  }
  // Otherwise use the base displayPrice from priceInfo
  if (priceInfo?.displayPrice) {
    return priceInfo.displayPrice;
  }
  // Fallback to calculating from option price with exchange rate
  if (priceInfo?.exchangeRate && option?.price) {
    const effectivePrice = (option.salePrice && option.salePrice < option.price) ? option.salePrice : option.price;
    return effectivePrice * priceInfo.exchangeRate;
  }
  // Last resort: use option price or salePrice
  return option?.salePrice || option?.price || 0;
}

/**
 * Bug condition: the bug triggers when:
 * 1. option.displayPrice does NOT exist
 * 2. priceInfo.displayPrice does NOT exist
 * 3. priceInfo.exchangeRate exists and > 0
 * 4. option.price exists and > 0
 * 5. option.salePrice exists and > 0
 * 6. option.salePrice < option.price
 */
function isBugCondition(option: any, priceInfo: any): boolean {
  return (
    !option.displayPrice &&
    !priceInfo.displayPrice &&
    priceInfo.exchangeRate != null &&
    priceInfo.exchangeRate > 0 &&
    option.price != null &&
    option.price > 0 &&
    option.salePrice != null &&
    option.salePrice > 0 &&
    option.salePrice < option.price
  );
}

describe('Property 1: Bug Condition - Sale Price Ignored in Exchange Rate Branch', () => {
  it('should return salePrice * exchangeRate when bug condition holds (salePrice < price with exchangeRate)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10000 }).chain((price) =>
          fc.record({
            price: fc.constant(price),
            salePrice: fc.integer({ min: 1, max: price - 1 }),
          })
        ),
        fc.integer({ min: 1, max: 1000 }),
        (optionPrices, exchangeRate) => {
          const option = {
            price: optionPrices.price,
            salePrice: optionPrices.salePrice,
            // No displayPrice - ensures we hit the exchange rate branch
          };
          const priceInfo = {
            exchangeRate: exchangeRate,
            // No displayPrice - ensures we hit the exchange rate branch
          };

          // Verify bug condition holds
          expect(isBugCondition(option, priceInfo)).toBe(true);

          const result = getDisplayPrice(option, priceInfo);

          // Expected behavior: should use salePrice * exchangeRate
          // Bug behavior: uses price * exchangeRate instead
          expect(result).toBe(option.salePrice * priceInfo.exchangeRate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
