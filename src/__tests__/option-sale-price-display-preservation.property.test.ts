// Feature: option-sale-price-display, Property 2: Preservation - Non-Sale and Pre-Calculated Price Behavior
// **Validates: Requirements 2.2, 3.1, 3.2, 3.3, 3.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the CURRENT (unfixed) getDisplayPrice logic from
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

describe('Property 2: Preservation - Non-Sale and Pre-Calculated Price Behavior', () => {
  it('for all inputs with option.displayPrice set, result equals option.displayPrice', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.record({
          price: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
          salePrice: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        }),
        fc.record({
          displayPrice: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
          exchangeRate: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
        }),
        (optionDisplayPrice, optionPrices, priceInfoFields) => {
          const option = {
            displayPrice: optionDisplayPrice,
            price: optionPrices.price,
            salePrice: optionPrices.salePrice,
          };
          const priceInfo = {
            displayPrice: priceInfoFields.displayPrice,
            exchangeRate: priceInfoFields.exchangeRate,
          };

          const result = getDisplayPrice(option, priceInfo);

          // When option.displayPrice exists, it is always returned directly
          expect(result).toBe(optionDisplayPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for all inputs with priceInfo.displayPrice set (no option.displayPrice), result equals priceInfo.displayPrice', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.record({
          price: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
          salePrice: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        }),
        fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
        (priceInfoDisplayPrice, optionPrices, exchangeRate) => {
          const option = {
            // No displayPrice on option
            price: optionPrices.price,
            salePrice: optionPrices.salePrice,
          };
          const priceInfo = {
            displayPrice: priceInfoDisplayPrice,
            exchangeRate: exchangeRate,
          };

          const result = getDisplayPrice(option, priceInfo);

          // When priceInfo.displayPrice exists and option.displayPrice does not,
          // priceInfo.displayPrice is returned
          expect(result).toBe(priceInfoDisplayPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for all inputs with exchangeRate but no salePrice (or salePrice >= price), result equals option.price * exchangeRate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.option(
          fc.integer({ min: 1, max: 20000 }),
          { nil: undefined }
        ),
        (price, exchangeRate, maybeSalePrice) => {
          // Ensure salePrice is either undefined or >= price (non-bug-condition)
          const salePrice = maybeSalePrice !== undefined && maybeSalePrice < price
            ? undefined // discard values that would trigger bug condition
            : maybeSalePrice;

          const option = {
            // No displayPrice
            price: price,
            salePrice: salePrice,
          };
          const priceInfo = {
            // No displayPrice
            exchangeRate: exchangeRate,
          };

          const result = getDisplayPrice(option, priceInfo);

          // When exchangeRate exists and there's no valid salePrice < price,
          // result should be price * exchangeRate
          expect(result).toBe(price * exchangeRate);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for all inputs without exchangeRate or displayPrice, result equals option.salePrice || option.price || 0', () => {
    fc.assert(
      fc.property(
        fc.record({
          price: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
          salePrice: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        }),
        (optionPrices) => {
          const option = {
            // No displayPrice
            price: optionPrices.price,
            salePrice: optionPrices.salePrice,
          };
          const priceInfo = {
            // No displayPrice, no exchangeRate
          };

          const result = getDisplayPrice(option, priceInfo);

          // Last resort fallback: salePrice || price || 0
          const expected = option.salePrice || option.price || 0;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
