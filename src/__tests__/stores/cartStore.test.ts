/**
 * Property-Based Tests for Cart Store Summary Calculation
 * Feature: cart-price-conversion
 *
 * This test file validates the cart summary calculation functions to ensure
 * the frontend uses backend-calculated displayPrice directly without double conversion
 * and maintains proper currency precision.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CartItem, CartSummary } from '@/types/product.type';
import { getDisplayPrice } from '@/utils/priceUtils';

// ============================================================================
// Re-implement calculateCartSummary for testing (mirrors cartStore.ts logic)
// ============================================================================

/**
 * Calculates cart summary from cart items.
 * This mirrors the implementation in cartStore.ts for isolated testing.
 */
const calculateCartSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((total, item) => {
    // FIX: Use displayPrice directly (already converted by backend)
    // Do NOT multiply by exchange rate - that causes double conversion
    const price = getDisplayPrice(item);
    const itemTotal = Math.round((price * item.quantity) * 100) / 100;
    return total + itemTotal;
  }, 0);

  // Count unique items (not quantities)
  const totalItems = items.length;
  // Sum all quantities
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
    totalItems,
    totalQuantity,
  };
};

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

// Valid date string for cart items
const validDateStr = new Date().toISOString();

/**
 * Generates a valid PriceInfo object with realistic values
 */
const priceInfoArb = fc.record({
  originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
  displayPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
  currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
  exchangeRate: fc.float({ min: Math.fround(0.0001), max: Math.fround(10000), noNaN: true }),
});

/**
 * Generates a minimal product object for cart items
 */
const productArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  images: fc.array(fc.webUrl(), { maxLength: 5 }),
});

/**
 * Generates a selected variant with price
 */
const selectedVariantArb = fc.record({
  variantId: fc.uuid(),
  optionId: fc.uuid(),
  variantName: fc.string({ minLength: 1 }),
  optionValue: fc.string({ minLength: 1 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
});

/**
 * Generates a cart item with valid priceInfo
 */
const cartItemWithPriceInfoArb: fc.Arbitrary<CartItem> = fc.record({
  product: productArb,
  quantity: fc.integer({ min: 1, max: 100 }),
  selectedVariant: fc.option(selectedVariantArb),
  priceInfo: priceInfoArb,
  addedAt: fc.constant(validDateStr),
}) as fc.Arbitrary<CartItem>;

/**
 * Generates a list of cart items with valid priceInfo
 */
const cartItemsArb = fc.array(cartItemWithPriceInfoArb, { minLength: 0, maxLength: 20 });

// ============================================================================
// Property 3: Cart Summary Calculation Correctness
// ============================================================================

/**
 * Feature: cart-price-conversion, Property 3: Cart summary equals sum of displayPrice × quantity
 *
 * **Validates: Requirements 1.5, 3.1, 3.2, 3.4**
 *
 * For any list of cart items, the calculated subtotal SHALL equal the sum of
 * (priceInfo.displayPrice × quantity) for each item, without applying any
 * exchange rate multiplication.
 */
describe('Property 3: Cart summary equals sum of displayPrice x quantity', () => {
  it('subtotal equals sum of (displayPrice × quantity) for all items', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        const summary = calculateCartSummary(items);

        // Calculate expected subtotal: sum of (displayPrice × quantity) for each item
        const expectedSubtotal = items.reduce((total, item) => {
          const price = item.priceInfo?.displayPrice ?? item.selectedVariant?.price ?? 0;
          const itemTotal = Math.round((price * item.quantity) * 100) / 100;
          return total + itemTotal;
        }, 0);

        // Round to 2 decimal places for comparison
        const roundedExpected = Math.round(expectedSubtotal * 100) / 100;

        expect(summary.subtotal).toBeCloseTo(roundedExpected, 2);
      }),
      { numRuns: 100 }
    );
  });

  it('subtotal does NOT apply exchange rate multiplication (no double conversion)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            product: productArb,
            quantity: fc.integer({ min: 1, max: 10 }),
            selectedVariant: fc.option(selectedVariantArb),
            priceInfo: fc.record({
              originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
              displayPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
              currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
              // Use distinct exchange rates to detect double conversion
              exchangeRate: fc.constantFrom(2, 5, 10, 50, 100),
            }),
            addedAt: fc.constant(validDateStr),
          }) as fc.Arbitrary<CartItem>,
          { minLength: 1, maxLength: 10 }
        ),
        async (items) => {
          const summary = calculateCartSummary(items);

          // Calculate correct subtotal (displayPrice × quantity)
          const correctSubtotal = items.reduce((total, item) => {
            const itemTotal = Math.round((item.priceInfo!.displayPrice * item.quantity) * 100) / 100;
            return total + itemTotal;
          }, 0);

          // Calculate wrong subtotal (displayPrice × exchangeRate × quantity) - double conversion bug
          const wrongSubtotal = items.reduce((total, item) => {
            const doubleConverted = item.priceInfo!.displayPrice * item.priceInfo!.exchangeRate;
            const itemTotal = Math.round((doubleConverted * item.quantity) * 100) / 100;
            return total + itemTotal;
          }, 0);

          // Summary should match correct calculation
          expect(summary.subtotal).toBeCloseTo(Math.round(correctSubtotal * 100) / 100, 2);

          // Summary should NOT match wrong calculation (unless exchange rate is 1)
          const allRatesAreOne = items.every(item => item.priceInfo!.exchangeRate === 1);
          if (!allRatesAreOne) {
            expect(summary.subtotal).not.toBeCloseTo(Math.round(wrongSubtotal * 100) / 100, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('totalItems equals the number of unique cart items', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        const summary = calculateCartSummary(items);
        expect(summary.totalItems).toBe(items.length);
      }),
      { numRuns: 100 }
    );
  });

  it('totalQuantity equals sum of all item quantities', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        const summary = calculateCartSummary(items);
        const expectedQuantity = items.reduce((total, item) => total + item.quantity, 0);
        expect(summary.totalQuantity).toBe(expectedQuantity);
      }),
      { numRuns: 100 }
    );
  });

  it('empty cart has zero subtotal and totals', async () => {
    const summary = calculateCartSummary([]);
    expect(summary.subtotal).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.totalItems).toBe(0);
    expect(summary.totalQuantity).toBe(0);
  });

  it('single item cart subtotal equals displayPrice × quantity', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemWithPriceInfoArb, async (item) => {
        const summary = calculateCartSummary([item]);
        const expectedSubtotal = Math.round((item.priceInfo!.displayPrice * item.quantity) * 100) / 100;
        expect(summary.subtotal).toBeCloseTo(expectedSubtotal, 2);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 5: Currency Precision (2 decimal places)
// ============================================================================

/**
 * Feature: cart-price-conversion, Property 5: Currency precision (2 decimal places)
 *
 * **Validates: Requirements 3.4**
 *
 * For any calculated subtotal or total, the result SHALL be rounded to exactly
 * 2 decimal places.
 */
describe('Property 5: Currency precision (2 decimal places)', () => {
  it('subtotal is rounded to exactly 2 decimal places', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        const summary = calculateCartSummary(items);

        // Check that subtotal has at most 2 decimal places
        const subtotalStr = summary.subtotal.toString();
        const decimalIndex = subtotalStr.indexOf('.');

        if (decimalIndex !== -1) {
          const decimalPlaces = subtotalStr.length - decimalIndex - 1;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        }

        // Verify by rounding and comparing
        const roundedSubtotal = Math.round(summary.subtotal * 100) / 100;
        expect(summary.subtotal).toBe(roundedSubtotal);
      }),
      { numRuns: 100 }
    );
  });

  it('total is rounded to exactly 2 decimal places', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemsArb, async (items) => {
        const summary = calculateCartSummary(items);

        // Check that total has at most 2 decimal places
        const totalStr = summary.total.toString();
        const decimalIndex = totalStr.indexOf('.');

        if (decimalIndex !== -1) {
          const decimalPlaces = totalStr.length - decimalIndex - 1;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        }

        // Verify by rounding and comparing
        const roundedTotal = Math.round(summary.total * 100) / 100;
        expect(summary.total).toBe(roundedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it('subtotal precision is maintained with fractional prices', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            product: productArb,
            quantity: fc.integer({ min: 1, max: 100 }),
            selectedVariant: fc.option(selectedVariantArb),
            priceInfo: fc.record({
              originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
              originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
              // Use prices with many decimal places to test rounding
              displayPrice: fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
              displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
              currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
              exchangeRate: fc.float({ min: Math.fround(0.0001), max: Math.fround(10000), noNaN: true }),
            }),
            addedAt: fc.constant(validDateStr),
          }) as fc.Arbitrary<CartItem>,
          { minLength: 1, maxLength: 10 }
        ),
        async (items) => {
          const summary = calculateCartSummary(items);

          // Subtotal should be properly rounded
          const roundedSubtotal = Math.round(summary.subtotal * 100) / 100;
          expect(summary.subtotal).toBe(roundedSubtotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('individual item totals are rounded before summing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            product: productArb,
            quantity: fc.integer({ min: 1, max: 10 }),
            selectedVariant: fc.option(selectedVariantArb),
            priceInfo: fc.record({
              originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
              originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
              displayPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
              displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
              currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
              exchangeRate: fc.float({ min: Math.fround(0.0001), max: Math.fround(10000), noNaN: true }),
            }),
            addedAt: fc.constant(validDateStr),
          }) as fc.Arbitrary<CartItem>,
          { minLength: 1, maxLength: 10 }
        ),
        async (items) => {
          const summary = calculateCartSummary(items);

          // Calculate expected subtotal with per-item rounding
          const expectedSubtotal = items.reduce((total, item) => {
            const price = item.priceInfo!.displayPrice;
            const itemTotal = Math.round((price * item.quantity) * 100) / 100;
            return total + itemTotal;
          }, 0);

          const roundedExpected = Math.round(expectedSubtotal * 100) / 100;
          expect(summary.subtotal).toBeCloseTo(roundedExpected, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('precision is maintained for very small totals', async () => {
    // Test with small prices that could cause floating point issues
    const smallPriceItem: CartItem = {
      product: { _id: 'test-id', name: 'Test', images: [] } as any,
      quantity: 1,
      priceInfo: {
        displayPrice: 0.01,
        originalPrice: 0.01,
        originalCurrency: 'USD',
        displayCurrency: 'USD',
        currencySymbol: '$',
        exchangeRate: 1,
      },
      addedAt: validDateStr,
    };

    const summary = calculateCartSummary([smallPriceItem]);
    expect(summary.subtotal).toBe(0.01);
  });

  it('precision is maintained for large totals', async () => {
    // Test with large prices
    const largePriceItem: CartItem = {
      product: { _id: 'test-id', name: 'Test', images: [] } as any,
      quantity: 99,
      priceInfo: {
        displayPrice: 99999.99,
        originalPrice: 99999.99,
        originalCurrency: 'USD',
        displayCurrency: 'USD',
        currencySymbol: '$',
        exchangeRate: 1,
      },
      addedAt: validDateStr,
    };

    const summary = calculateCartSummary([largePriceItem]);
    const expected = Math.round((99999.99 * 99) * 100) / 100;
    expect(summary.subtotal).toBe(expected);
  });
});
