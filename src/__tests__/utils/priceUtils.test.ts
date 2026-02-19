/**
 * Property-Based Tests for Price Utility Functions
 * Feature: cart-price-conversion
 *
 * This test file validates the price utility functions that ensure the frontend
 * uses backend-calculated displayPrice directly without double conversion.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getDisplayPrice,
  getItemTotal,
  validateDisplayPrice,
  getWishlistDisplayPrice,
  PriceInfo,
} from '@/utils/priceUtils';
import { CartItem } from '@/types/product.type';
import { Wishlist } from '@/types/wishlist.type';

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
 * Generates a cart item without priceInfo (fallback scenario)
 */
const cartItemWithoutPriceInfoArb: fc.Arbitrary<CartItem> = fc.record({
  product: productArb,
  quantity: fc.integer({ min: 1, max: 100 }),
  selectedVariant: selectedVariantArb,
  priceInfo: fc.constant(undefined),
  addedAt: fc.constant(validDateStr),
}) as fc.Arbitrary<CartItem>;

// ============================================================================
// Property 2: Display Function Returns displayPrice Directly
// ============================================================================

/**
 * Feature: cart-price-conversion, Property 2: Display function returns displayPrice directly
 *
 * **Validates: Requirements 1.3, 1.4, 2.1, 2.3**
 *
 * For any cart item with a valid priceInfo.displayPrice, the getDisplayPrice function
 * SHALL return exactly priceInfo.displayPrice without any multiplication by exchangeRate.
 */
describe('Property 2: Display function returns displayPrice directly', () => {
  it('getDisplayPrice returns priceInfo.displayPrice exactly when valid', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemWithPriceInfoArb, async (item) => {
        const result = getDisplayPrice(item);

        // The function should return displayPrice directly, NOT multiplied by exchangeRate
        expect(result).toBe(item.priceInfo!.displayPrice);

        // Verify it's NOT doing double conversion (displayPrice * exchangeRate)
        const wrongDoubleConversion =
          item.priceInfo!.displayPrice * item.priceInfo!.exchangeRate;
        if (item.priceInfo!.exchangeRate !== 1) {
          expect(result).not.toBe(wrongDoubleConversion);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('getDisplayPrice never multiplies by exchangeRate', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          product: productArb,
          quantity: fc.integer({ min: 1, max: 100 }),
          selectedVariant: fc.option(selectedVariantArb),
          priceInfo: fc.record({
            originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
            displayPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
            currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
            // Use exchange rates that would make double conversion obvious
            exchangeRate: fc.constantFrom(2, 10, 100, 1000),
          }),
          addedAt: fc.constant(new Date().toISOString()),
        }) as fc.Arbitrary<CartItem>,
        async (item) => {
          const result = getDisplayPrice(item);

          // Result should be exactly displayPrice
          expect(result).toBe(item.priceInfo!.displayPrice);

          // Result should NOT be displayPrice * exchangeRate (double conversion bug)
          const doubleConverted =
            item.priceInfo!.displayPrice * item.priceInfo!.exchangeRate;
          expect(result).not.toBe(doubleConverted);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDisplayPrice falls back to selectedVariant.price when priceInfo is missing', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemWithoutPriceInfoArb, async (item) => {
        const result = getDisplayPrice(item);

        // Should fall back to selectedVariant.price
        expect(result).toBe(item.selectedVariant!.price);
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 4: Item Total Equals displayPrice × quantity
// ============================================================================

/**
 * Feature: cart-price-conversion, Property 4: Item total equals displayPrice × quantity
 *
 * **Validates: Requirements 2.2, 2.4**
 *
 * For any cart item, the getItemTotal function SHALL return exactly
 * (priceInfo.displayPrice × quantity).
 */
describe('Property 4: Item total equals displayPrice x quantity', () => {
  it('getItemTotal returns displayPrice multiplied by quantity', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemWithPriceInfoArb, async (item) => {
        const result = getItemTotal(item);
        const expected = item.priceInfo!.displayPrice * item.quantity;

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('getItemTotal does not apply exchangeRate multiplication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          product: productArb,
          quantity: fc.integer({ min: 1, max: 100 }),
          selectedVariant: fc.option(selectedVariantArb),
          priceInfo: fc.record({
            originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
            displayPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
            currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
            // Use distinct exchange rates to detect double conversion
            exchangeRate: fc.constantFrom(2, 5, 10, 50, 100),
          }),
          addedAt: fc.constant(new Date().toISOString()),
        }) as fc.Arbitrary<CartItem>,
        async (item) => {
          const result = getItemTotal(item);

          // Correct calculation: displayPrice * quantity
          const correctTotal = item.priceInfo!.displayPrice * item.quantity;
          expect(result).toBe(correctTotal);

          // Wrong calculation (double conversion): displayPrice * exchangeRate * quantity
          const wrongTotal =
            item.priceInfo!.displayPrice *
            item.priceInfo!.exchangeRate *
            item.quantity;
          expect(result).not.toBe(wrongTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getItemTotal uses fallback price when priceInfo is missing', async () => {
    await fc.assert(
      fc.asyncProperty(cartItemWithoutPriceInfoArb, async (item) => {
        const result = getItemTotal(item);
        const expected = item.selectedVariant!.price * item.quantity;

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('getItemTotal scales linearly with quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        priceInfoArb,
        productArb,
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        async (priceInfo, product, qty1, qty2) => {
          const item1: CartItem = {
            product: product as any,
            quantity: qty1,
            priceInfo,
            addedAt: new Date().toISOString(),
          };

          const item2: CartItem = {
            product: product as any,
            quantity: qty2,
            priceInfo,
            addedAt: new Date().toISOString(),
          };

          const total1 = getItemTotal(item1);
          const total2 = getItemTotal(item2);

          // Totals should scale proportionally with quantity
          const ratio = qty1 / qty2;
          const totalRatio = total1 / total2;

          expect(totalRatio).toBeCloseTo(ratio, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 12: DisplayPrice Validation
// ============================================================================

/**
 * Feature: cart-price-conversion, Property 12: DisplayPrice validation
 *
 * **Validates: Requirements 6.3**
 *
 * For any displayPrice value passed to the validation function, the function
 * SHALL return true only if the value is a positive finite number.
 */
describe('Property 12: DisplayPrice validation', () => {
  it('validateDisplayPrice returns true for positive finite numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: Math.fround(0.0001), max: Math.fround(1000000), noNaN: true }),
        async (price) => {
          const result = validateDisplayPrice(price);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateDisplayPrice returns false for zero', () => {
    expect(validateDisplayPrice(0)).toBe(false);
  });

  it('validateDisplayPrice returns false for negative numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: Math.fround(-1000000), max: Math.fround(-0.0001), noNaN: true }),
        async (price) => {
          const result = validateDisplayPrice(price);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateDisplayPrice returns false for NaN', () => {
    expect(validateDisplayPrice(NaN)).toBe(false);
  });

  it('validateDisplayPrice returns false for Infinity', () => {
    expect(validateDisplayPrice(Infinity)).toBe(false);
    expect(validateDisplayPrice(-Infinity)).toBe(false);
  });

  it('validateDisplayPrice returns false for non-number types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string(),
          fc.constant(null),
          fc.constant(undefined),
          fc.array(fc.integer()),
          fc.object()
        ),
        async (value) => {
          const result = validateDisplayPrice(value);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateDisplayPrice correctly validates edge case numbers', async () => {
    // Very small positive numbers should be valid
    expect(validateDisplayPrice(0.0001)).toBe(true);
    expect(validateDisplayPrice(Number.MIN_VALUE)).toBe(true);

    // Very large positive numbers should be valid
    expect(validateDisplayPrice(999999999)).toBe(true);

    // Number.MAX_VALUE should be valid (it's finite)
    expect(validateDisplayPrice(Number.MAX_VALUE)).toBe(true);
  });

  it('validateDisplayPrice is consistent with getDisplayPrice fallback logic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Valid prices
          fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          // Invalid prices
          fc.constant(0),
          fc.constant(-1),
          fc.constant(NaN),
          fc.constant(Infinity)
        ),
        async (price) => {
          const isValid = validateDisplayPrice(price);

          // Create a cart item with this price as displayPrice
          const item: CartItem = {
            product: { _id: 'test-id', name: 'Test', images: [] } as any,
            quantity: 1,
            priceInfo: {
              displayPrice: price,
              originalPrice: 100,
              originalCurrency: 'USD',
              displayCurrency: 'USD',
              currencySymbol: '$',
              exchangeRate: 1,
            },
            selectedVariant: {
              variantId: 'v1',
              optionId: 'o1',
              variantName: 'Size',
              optionValue: 'M',
              price: 50, // Fallback price
            },
            addedAt: new Date().toISOString(),
          };

          const displayPrice = getDisplayPrice(item);

          if (isValid) {
            // If price is valid, getDisplayPrice should return it
            expect(displayPrice).toBe(price);
          } else {
            // If price is invalid, getDisplayPrice should fall back
            expect(displayPrice).toBe(50); // Falls back to selectedVariant.price
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 10: Wishlist-Cart Price Consistency
// ============================================================================

/**
 * Feature: cart-price-conversion, Property 10: Wishlist and cart use identical price display logic
 *
 * **Validates: Requirements 5.1, 5.3, 5.5**
 *
 * For any product, the price display logic for wishlist items SHALL produce the same
 * result as the cart price display logic when given identical priceInfo.
 */
describe('Property 10: Wishlist and cart use identical price display logic', () => {
  /**
   * Generates a wishlist item with valid priceInfo
   */
  const wishlistItemArb: fc.Arbitrary<Wishlist> = fc.record({
    productId: fc.uuid(),
    _id: fc.option(fc.uuid()),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    images: fc.array(fc.webUrl(), { maxLength: 5 }),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
    variantId: fc.uuid(),
    optionId: fc.option(fc.uuid()),
    addedAt: fc.constant(new Date().toISOString()),
    priceWhenAdded: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })),
    priceInfo: priceInfoArb,
  }) as fc.Arbitrary<Wishlist>;

  /**
   * Generates a wishlist item without priceInfo (fallback scenario)
   */
  const wishlistItemWithoutPriceInfoArb: fc.Arbitrary<Wishlist> = fc.record({
    productId: fc.uuid(),
    _id: fc.option(fc.uuid()),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    images: fc.array(fc.webUrl(), { maxLength: 5 }),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
    variantId: fc.uuid(),
    optionId: fc.option(fc.uuid()),
    addedAt: fc.constant(new Date().toISOString()),
    priceWhenAdded: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })),
    priceInfo: fc.constant(undefined),
  }) as fc.Arbitrary<Wishlist>;

  it('getWishlistDisplayPrice returns same value as getDisplayPrice for identical priceInfo', async () => {
    await fc.assert(
      fc.asyncProperty(priceInfoArb, async (priceInfo) => {
        // Create a cart item with this priceInfo
        const cartItem: CartItem = {
          product: { _id: 'test-id', name: 'Test Product', images: [] } as any,
          quantity: 1,
          priceInfo,
          addedAt: new Date().toISOString(),
        };

        // Create a wishlist item with the same priceInfo
        const wishlistItem: Wishlist = {
          productId: 'test-id',
          name: 'Test Product',
          images: [],
          price: 100, // Fallback price
          variantId: 'v1',
          addedAt: new Date().toISOString(),
          priceInfo,
        };

        const cartPrice = getDisplayPrice(cartItem);
        const wishlistPrice = getWishlistDisplayPrice(wishlistItem);

        // Both should return the same displayPrice
        expect(wishlistPrice).toBe(cartPrice);
        expect(wishlistPrice).toBe(priceInfo.displayPrice);
      }),
      { numRuns: 100 }
    );
  });

  it('getWishlistDisplayPrice uses priceInfo.displayPrice directly without exchange rate multiplication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          productId: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          images: fc.array(fc.webUrl(), { maxLength: 5 }),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
          variantId: fc.uuid(),
          addedAt: fc.constant(new Date().toISOString()),
          priceInfo: fc.record({
            originalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            originalCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
            displayPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
            displayCurrency: fc.constantFrom('USD', 'NGN', 'EUR', 'GBP'),
            currencySymbol: fc.constantFrom('$', 'N', 'E', 'P'),
            // Use exchange rates that would make double conversion obvious
            exchangeRate: fc.constantFrom(2, 10, 100, 1000),
          }),
        }) as fc.Arbitrary<Wishlist>,
        async (wishlistItem) => {
          const result = getWishlistDisplayPrice(wishlistItem);

          // Result should be exactly displayPrice
          expect(result).toBe(wishlistItem.priceInfo!.displayPrice);

          // Result should NOT be displayPrice * exchangeRate (double conversion bug)
          const doubleConverted =
            wishlistItem.priceInfo!.displayPrice * wishlistItem.priceInfo!.exchangeRate;
          expect(result).not.toBe(doubleConverted);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getWishlistDisplayPrice falls back to price when priceInfo is missing', async () => {
    await fc.assert(
      fc.asyncProperty(wishlistItemWithoutPriceInfoArb, async (wishlistItem) => {
        const result = getWishlistDisplayPrice(wishlistItem);

        // Should fall back to price field
        expect(result).toBe(wishlistItem.price);
      }),
      { numRuns: 100 }
    );
  });

  it('cart and wishlist display logic produce consistent results for any valid priceInfo', async () => {
    await fc.assert(
      fc.asyncProperty(
        priceInfoArb,
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        async (priceInfo, productId, productName, fallbackPrice) => {
          // Create equivalent cart and wishlist items with the same priceInfo
          const cartItem: CartItem = {
            product: { _id: productId, name: productName, images: [] } as any,
            quantity: 1,
            selectedVariant: {
              variantId: 'v1',
              optionId: 'o1',
              variantName: 'Size',
              optionValue: 'M',
              price: fallbackPrice,
            },
            priceInfo,
            addedAt: new Date().toISOString(),
          };

          const wishlistItem: Wishlist = {
            productId,
            name: productName,
            images: [],
            price: fallbackPrice,
            variantId: 'v1',
            addedAt: new Date().toISOString(),
            priceInfo,
          };

          const cartPrice = getDisplayPrice(cartItem);
          const wishlistPrice = getWishlistDisplayPrice(wishlistItem);

          // Both functions should return identical results
          expect(wishlistPrice).toBe(cartPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cart and wishlist fallback logic produce consistent results when priceInfo is invalid', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
        fc.oneof(
          fc.constant(0),
          fc.constant(-1),
          fc.constant(NaN),
          fc.constant(Infinity)
        ),
        async (productId, productName, fallbackPrice, invalidDisplayPrice) => {
          // Create cart item with invalid displayPrice
          const cartItem: CartItem = {
            product: { _id: productId, name: productName, images: [] } as any,
            quantity: 1,
            selectedVariant: {
              variantId: 'v1',
              optionId: 'o1',
              variantName: 'Size',
              optionValue: 'M',
              price: fallbackPrice,
            },
            priceInfo: {
              displayPrice: invalidDisplayPrice,
              originalPrice: 100,
              originalCurrency: 'USD',
              displayCurrency: 'USD',
              currencySymbol: '$',
              exchangeRate: 1,
            },
            addedAt: new Date().toISOString(),
          };

          // Create wishlist item with same invalid displayPrice
          const wishlistItem: Wishlist = {
            productId,
            name: productName,
            images: [],
            price: fallbackPrice,
            variantId: 'v1',
            addedAt: new Date().toISOString(),
            priceInfo: {
              displayPrice: invalidDisplayPrice,
              originalPrice: 100,
              originalCurrency: 'USD',
              displayCurrency: 'USD',
              currencySymbol: '$',
              exchangeRate: 1,
            },
          };

          const cartPrice = getDisplayPrice(cartItem);
          const wishlistPrice = getWishlistDisplayPrice(wishlistItem);

          // Both should fall back to their respective fallback prices
          expect(cartPrice).toBe(fallbackPrice);
          expect(wishlistPrice).toBe(fallbackPrice);
        }
      ),
      { numRuns: 100 }
    );
  });
});
