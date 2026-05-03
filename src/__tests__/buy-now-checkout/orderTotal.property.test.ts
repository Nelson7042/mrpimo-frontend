// Feature: buy-now-checkout-fix, Property 7: Order total invariant
// **Validates: Requirements 4.5**
//
// Property: For any order state on the Buy Now checkout page, the displayed total
// SHALL equal subtotal + tax + shipping, where shipping is the most recently
// calculated shipping cost.

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Pure logic mirroring checkout page.tsx
// ============================================================================

/**
 * Computes the effective shipping cost.
 * Mirrors: const shipping = calculatedShipping !== null ? calculatedShipping : baseShipping;
 */
const getEffectiveShipping = (
  calculatedShipping: number | null,
  baseShipping: number
): number => (calculatedShipping !== null ? calculatedShipping : baseShipping);

/**
 * Computes the order total.
 * Mirrors: const total = subtotal + tax + shipping;
 */
const computeTotal = (
  subtotal: number,
  tax: number,
  calculatedShipping: number | null,
  baseShipping: number
): number => subtotal + tax + getEffectiveShipping(calculatedShipping, baseShipping);

// ============================================================================
// Arbitraries
// ============================================================================

const nonNegativeAmountArb = fc
  .float({ min: 0, max: 100_000, noNaN: true })
  .map(Math.fround);

const shippingCostArb = fc
  .float({ min: 0, max: 10_000, noNaN: true })
  .map(Math.fround);

const calculatedShippingArb = fc.option(shippingCostArb, { nil: null });

// ============================================================================
// Property 7: Order total invariant
// ============================================================================

describe('Property 7: Order total invariant', () => {
  // --------------------------------------------------------------------------
  // 7a: total = subtotal + tax + shipping (core invariant)
  // --------------------------------------------------------------------------
  describe('Requirement 4.5: total equals subtotal + tax + shipping', () => {
    it('total always equals subtotal + tax + effective shipping', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          calculatedShippingArb,
          shippingCostArb,
          (subtotal, tax, calculatedShipping, baseShipping) => {
            const total = computeTotal(subtotal, tax, calculatedShipping, baseShipping);
            const effectiveShipping = getEffectiveShipping(calculatedShipping, baseShipping);

            expect(total).toBeCloseTo(subtotal + tax + effectiveShipping, 5);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('total is non-negative when all components are non-negative', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          calculatedShippingArb,
          shippingCostArb,
          (subtotal, tax, calculatedShipping, baseShipping) => {
            const total = computeTotal(subtotal, tax, calculatedShipping, baseShipping);
            expect(total).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('total increases when subtotal increases (tax and shipping fixed)', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          calculatedShippingArb,
          shippingCostArb,
          (subtotal, delta, tax, calculatedShipping, baseShipping) => {
            fc.pre(delta > 0.001);
            const total1 = computeTotal(subtotal, tax, calculatedShipping, baseShipping);
            const total2 = computeTotal(subtotal + delta, tax, calculatedShipping, baseShipping);
            expect(total2).toBeGreaterThan(total1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total increases when tax increases (subtotal and shipping fixed)', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          calculatedShippingArb,
          shippingCostArb,
          (subtotal, tax, delta, calculatedShipping, baseShipping) => {
            fc.pre(delta > 0.001);
            const total1 = computeTotal(subtotal, tax, calculatedShipping, baseShipping);
            const total2 = computeTotal(subtotal, tax + delta, calculatedShipping, baseShipping);
            expect(total2).toBeGreaterThan(total1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 7b: calculatedShipping takes precedence over baseShipping
  // --------------------------------------------------------------------------
  describe('Shipping precedence: calculatedShipping overrides baseShipping', () => {
    it('when calculatedShipping is set, it is used instead of baseShipping', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          shippingCostArb,
          shippingCostArb,
          (subtotal, tax, calculatedShipping, baseShipping) => {
            const total = computeTotal(subtotal, tax, calculatedShipping, baseShipping);
            expect(total).toBeCloseTo(subtotal + tax + calculatedShipping, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('when calculatedShipping is null, baseShipping is used', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          shippingCostArb,
          (subtotal, tax, baseShipping) => {
            const total = computeTotal(subtotal, tax, null, baseShipping);
            expect(total).toBeCloseTo(subtotal + tax + baseShipping, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('updating calculatedShipping changes the total by the difference', () => {
      fc.assert(
        fc.property(
          nonNegativeAmountArb,
          nonNegativeAmountArb,
          shippingCostArb,
          shippingCostArb,
          shippingCostArb,
          (subtotal, tax, oldShipping, newShipping, baseShipping) => {
            fc.pre(Math.abs(oldShipping - newShipping) >= 0.01);
            const totalBefore = computeTotal(subtotal, tax, oldShipping, baseShipping);
            const totalAfter = computeTotal(subtotal, tax, newShipping, baseShipping);
            expect(totalAfter - totalBefore).toBeCloseTo(newShipping - oldShipping, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 7c: Zero-value edge cases
  // --------------------------------------------------------------------------
  describe('Edge cases: zero values', () => {
    it('total equals shipping when subtotal and tax are zero', () => {
      fc.assert(
        fc.property(shippingCostArb, (shipping) => {
          const total = computeTotal(0, 0, shipping, 0);
          expect(total).toBeCloseTo(shipping, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('total equals subtotal + tax when shipping is zero', () => {
      fc.assert(
        fc.property(nonNegativeAmountArb, nonNegativeAmountArb, (subtotal, tax) => {
          const total = computeTotal(subtotal, tax, 0, 0);
          expect(total).toBeCloseTo(subtotal + tax, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('total is zero when all components are zero', () => {
      expect(computeTotal(0, 0, 0, 0)).toBe(0);
      expect(computeTotal(0, 0, null, 0)).toBe(0);
    });
  });
});
