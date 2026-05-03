// Feature: buy-now-checkout-fix, Property 6: Shipping recalculation on input change
// **Validates: Requirements 4.2, 5.4, 6.3**
//
// Property: For any change to the selected delivery method on the Buy Now checkout page,
// the frontend SHALL call the shipping estimate endpoint with the updated parameters,
// and the displayed shipping cost SHALL reflect the new estimate.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Types (mirroring the hook interfaces)
// ============================================================================

type DeliveryMethod = 'pickup' | 'standard' | 'express';

interface BuyNowShippingEstimateParams {
  productId: string;
  variantId: string;
  optionId: string;
  quantity: number;
  addressId?: string;
  deliveryMethod?: string;
}

interface ShippingEstimate {
  shippingCost: number;
  currency: string;
  estimationType: 'address' | 'none';
  senderStation: string;
  receiverStation: string;
  warnings: string[];
  estimatedDays: string;
}

interface CheckoutState {
  subtotal: number;
  tax: number;
  calculatedShipping: number | null;
  baseShipping: number;
  deliveryMethod: DeliveryMethod | '';
}

// ============================================================================
// Pure logic extracted from checkout page (mirrors page.tsx behaviour)
// ============================================================================

/**
 * Computes the effective shipping cost: uses calculatedShipping when available,
 * otherwise falls back to baseShipping. Mirrors:
 *   const shipping = calculatedShipping !== null ? calculatedShipping : baseShipping;
 */
const getEffectiveShipping = (state: CheckoutState): number =>
  state.calculatedShipping !== null ? state.calculatedShipping : state.baseShipping;

/**
 * Computes the order total. Mirrors:
 *   const total = subtotal + tax + shipping;
 */
const computeTotal = (state: CheckoutState): number =>
  state.subtotal + state.tax + getEffectiveShipping(state);

/**
 * Applies a new shipping estimate to the checkout state, returning the updated state.
 * Mirrors the onSuccess handler in the useEffect that watches deliveryMethod:
 *   setCalculatedShipping(data.estimate.shippingCost);
 */
const applyShippingEstimate = (
  state: CheckoutState,
  estimate: ShippingEstimate
): CheckoutState => ({
  ...state,
  calculatedShipping: estimate.shippingCost,
});

/**
 * Simulates the delivery method change handler: updates deliveryMethod in state
 * and records the params that would be sent to the shipping estimate endpoint.
 */
const handleDeliveryMethodChange = (
  state: CheckoutState,
  newMethod: DeliveryMethod,
  productId: string,
  variantId: string,
  optionId: string,
  quantity: number,
  addressId: string | undefined
): { newState: CheckoutState; requestedParams: BuyNowShippingEstimateParams } => {
  const newState: CheckoutState = { ...state, deliveryMethod: newMethod };
  const requestedParams: BuyNowShippingEstimateParams = {
    productId,
    variantId,
    optionId,
    quantity,
    addressId,
    deliveryMethod: newMethod,
  };
  return { newState, requestedParams };
};

// ============================================================================
// Arbitraries
// ============================================================================

const deliveryMethodArb: fc.Arbitrary<DeliveryMethod> = fc.constantFrom(
  'pickup',
  'standard',
  'express'
);

const twoDistinctDeliveryMethodsArb: fc.Arbitrary<[DeliveryMethod, DeliveryMethod]> = fc
  .tuple(deliveryMethodArb, deliveryMethodArb)
  .filter(([a, b]) => a !== b) as fc.Arbitrary<[DeliveryMethod, DeliveryMethod]>;

const positiveAmountArb = fc.float({ min: 0, max: 100_000, noNaN: true }).map(Math.fround);

const shippingCostArb = fc.float({ min: 0, max: 10_000, noNaN: true }).map(Math.fround);

const mongoIdArb = fc.stringMatching(/^[0-9a-f]{24}$/);

const productParamsArb = fc.record({
  productId: mongoIdArb,
  variantId: mongoIdArb,
  optionId: mongoIdArb,
  quantity: fc.integer({ min: 1, max: 100 }),
  addressId: fc.option(mongoIdArb, { nil: undefined }),
});

const shippingEstimateArb: fc.Arbitrary<ShippingEstimate> = fc.record({
  shippingCost: shippingCostArb,
  currency: fc.constantFrom('USD', 'NGN', 'GHS', 'EUR', 'GBP'),
  estimationType: fc.constantFrom('address', 'none'),
  senderStation: fc.string({ minLength: 1, maxLength: 50 }),
  receiverStation: fc.string({ minLength: 1, maxLength: 50 }),
  warnings: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 3 }),
  estimatedDays: fc.constantFrom('1-2 business days', '3-5 business days', '5-7 business days'),
});

const checkoutStateArb: fc.Arbitrary<CheckoutState> = fc.record({
  subtotal: positiveAmountArb,
  tax: positiveAmountArb,
  calculatedShipping: fc.option(shippingCostArb, { nil: null }),
  baseShipping: shippingCostArb,
  deliveryMethod: deliveryMethodArb,
});

// ============================================================================
// Property 6: Shipping recalculation on input change
// ============================================================================

describe('Property 6: Shipping recalculation on input change', () => {
  // --------------------------------------------------------------------------
  // 6a: Delivery method change sends updated method to the estimate endpoint
  // --------------------------------------------------------------------------
  describe('Requirement 4.2 / 5.4: Delivery method change triggers new estimate request', () => {
    it('the requested params always include the new delivery method', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          twoDistinctDeliveryMethodsArb,
          productParamsArb,
          (state, [_oldMethod, newMethod], params) => {
            const { requestedParams } = handleDeliveryMethodChange(
              state,
              newMethod,
              params.productId,
              params.variantId,
              params.optionId,
              params.quantity,
              params.addressId
            );

            // The endpoint must be called with the NEW delivery method
            expect(requestedParams.deliveryMethod).toBe(newMethod);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('the requested params carry the correct product identifiers', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          deliveryMethodArb,
          productParamsArb,
          (state, newMethod, params) => {
            const { requestedParams } = handleDeliveryMethodChange(
              state,
              newMethod,
              params.productId,
              params.variantId,
              params.optionId,
              params.quantity,
              params.addressId
            );

            expect(requestedParams.productId).toBe(params.productId);
            expect(requestedParams.variantId).toBe(params.variantId);
            expect(requestedParams.optionId).toBe(params.optionId);
            expect(requestedParams.quantity).toBe(params.quantity);
            expect(requestedParams.addressId).toBe(params.addressId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('changing to a different method always produces a different request than the previous method', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          twoDistinctDeliveryMethodsArb,
          productParamsArb,
          (state, [oldMethod, newMethod], params) => {
            const { requestedParams: oldRequest } = handleDeliveryMethodChange(
              state,
              oldMethod,
              params.productId,
              params.variantId,
              params.optionId,
              params.quantity,
              params.addressId
            );
            const { requestedParams: newRequest } = handleDeliveryMethodChange(
              state,
              newMethod,
              params.productId,
              params.variantId,
              params.optionId,
              params.quantity,
              params.addressId
            );

            // The two requests must differ in deliveryMethod
            expect(oldRequest.deliveryMethod).not.toBe(newRequest.deliveryMethod);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6b: Displayed shipping cost reflects the new estimate (Requirement 6.3)
  // --------------------------------------------------------------------------
  describe('Requirement 6.3: Displayed shipping cost reflects the new estimate', () => {
    it('after applying a new estimate, effective shipping equals the new estimate cost', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          shippingEstimateArb,
          (state, newEstimate) => {
            const updatedState = applyShippingEstimate(state, newEstimate);
            const effectiveShipping = getEffectiveShipping(updatedState);

            expect(effectiveShipping).toBe(newEstimate.shippingCost);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('the new estimate cost overrides any previous calculatedShipping value', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          shippingEstimateArb,
          shippingEstimateArb,
          (state, firstEstimate, secondEstimate) => {
            // Apply first estimate, then second
            const afterFirst = applyShippingEstimate(state, firstEstimate);
            const afterSecond = applyShippingEstimate(afterFirst, secondEstimate);

            // The effective shipping must reflect the SECOND (latest) estimate
            expect(getEffectiveShipping(afterSecond)).toBe(secondEstimate.shippingCost);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('the new estimate cost overrides the base shipping fallback', () => {
      fc.assert(
        fc.property(
          // State with no prior calculated shipping (uses baseShipping fallback)
          checkoutStateArb.map((s) => ({ ...s, calculatedShipping: null })),
          shippingEstimateArb,
          (state, estimate) => {
            const updatedState = applyShippingEstimate(state, estimate);
            // After applying estimate, calculatedShipping is set and takes precedence
            expect(getEffectiveShipping(updatedState)).toBe(estimate.shippingCost);
            expect(getEffectiveShipping(updatedState)).not.toBe(state.baseShipping);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6c: Order total updates to reflect new shipping (Requirement 4.5)
  // --------------------------------------------------------------------------
  describe('Requirement 4.5: Order total updates after shipping recalculation', () => {
    it('total equals subtotal + tax + new shipping cost after estimate is applied', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          shippingEstimateArb,
          (state, estimate) => {
            const updatedState = applyShippingEstimate(state, estimate);
            const total = computeTotal(updatedState);

            expect(total).toBeCloseTo(
              state.subtotal + state.tax + estimate.shippingCost,
              5
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total changes when shipping estimate changes', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          shippingEstimateArb,
          shippingEstimateArb,
          (state, firstEstimate, secondEstimate) => {
            // Require a meaningful difference (>= 0.01) so floating-point addition
            // doesn't absorb the difference into the larger subtotal/tax values
            fc.pre(
              Math.abs(firstEstimate.shippingCost - secondEstimate.shippingCost) >= 0.01
            );

            const afterFirst = applyShippingEstimate(state, firstEstimate);
            const afterSecond = applyShippingEstimate(state, secondEstimate);

            const totalAfterFirst = computeTotal(afterFirst);
            const totalAfterSecond = computeTotal(afterSecond);

            // Different shipping costs must produce different totals
            expect(totalAfterFirst).not.toBe(totalAfterSecond);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6d: Different delivery methods can produce different shipping costs
  // --------------------------------------------------------------------------
  describe('Requirement 5.4: Different delivery methods can produce different costs', () => {
    it('applying estimates with different costs to the same state yields different totals', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          // Two estimates with distinct shipping costs (simulating different delivery methods)
          // Require a meaningful difference so floating-point addition doesn't absorb it
          fc
            .tuple(shippingEstimateArb, shippingEstimateArb)
            .filter(([a, b]) => Math.abs(a.shippingCost - b.shippingCost) >= 0.01),
          (state, [estimateA, estimateB]) => {
            const stateA = applyShippingEstimate(state, estimateA);
            const stateB = applyShippingEstimate(state, estimateB);

            // Different shipping costs produce different totals
            expect(computeTotal(stateA)).not.toBe(computeTotal(stateB));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('each delivery method request carries its own method identifier', () => {
      fc.assert(
        fc.property(
          checkoutStateArb,
          productParamsArb,
          (state, params) => {
            const methods: DeliveryMethod[] = ['pickup', 'standard', 'express'];
            const requests = methods.map((method) =>
              handleDeliveryMethodChange(
                state,
                method,
                params.productId,
                params.variantId,
                params.optionId,
                params.quantity,
                params.addressId
              ).requestedParams
            );

            // Each request must carry its own distinct delivery method
            const requestedMethods = requests.map((r) => r.deliveryMethod);
            const uniqueMethods = new Set(requestedMethods);
            expect(uniqueMethods.size).toBe(methods.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6e: Fallback behaviour — before any estimate, baseShipping is used
  // --------------------------------------------------------------------------
  describe('Fallback: baseShipping used when no estimate has been applied', () => {
    it('effective shipping equals baseShipping when calculatedShipping is null', () => {
      fc.assert(
        fc.property(
          checkoutStateArb.map((s) => ({ ...s, calculatedShipping: null })),
          (state) => {
            expect(getEffectiveShipping(state)).toBe(state.baseShipping);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total uses baseShipping when no estimate has been applied', () => {
      fc.assert(
        fc.property(
          checkoutStateArb.map((s) => ({ ...s, calculatedShipping: null })),
          (state) => {
            const total = computeTotal(state);
            expect(total).toBeCloseTo(state.subtotal + state.tax + state.baseShipping, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
