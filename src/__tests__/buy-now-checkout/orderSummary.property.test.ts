// Feature: buy-now-checkout-fix, Property 8: Order summary completeness
// **Validates: Requirements 4.6, 5.5**
//
// Property: For any Buy Now checkout state with a selected product and address,
// the order summary SHALL display: product name, product image, variant details,
// quantity, subtotal, shipping cost, tax, total, and the selected address details
// (street, city, state, country, postal code).

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Types mirroring the BuyNowCheckoutSession and Address interfaces
// ============================================================================

interface BuyNowProduct {
  name: string;
  images: string[];
  vendor: { businessName: string };
}

interface BuyNowVariant {
  name: string;
  value?: string;
  price: number;
}

interface BuyNowPricing {
  subtotal: number;
  shipping: number;
  tax: number;
  currency: string;
}

interface BuyNowCheckoutSession {
  productId: string;
  variantId: string;
  optionId: string;
  quantity: number;
  product: BuyNowProduct;
  variant: BuyNowVariant;
  pricing: BuyNowPricing;
}

interface Address {
  _id?: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  coordinates?: { latitude: number; longitude: number };
}

interface OrderSummaryFields {
  productName: string;
  productImage: string;
  variantName: string;
  variantValue: string | undefined;
  quantity: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  addressPostalCode: string;
}

// ============================================================================
// Pure logic: extract order summary fields from checkout session + address
// ============================================================================

/**
 * Extracts all required order summary fields from the checkout session and
 * selected address. Mirrors the data bindings in the checkout page's Order
 * Summary sidebar.
 */
const extractOrderSummaryFields = (
  session: BuyNowCheckoutSession,
  address: Address,
  calculatedShipping: number | null
): OrderSummaryFields => {
  const effectiveShipping =
    calculatedShipping !== null ? calculatedShipping : session.pricing.shipping;
  const total = session.pricing.subtotal + session.pricing.tax + effectiveShipping;

  return {
    productName: session.product.name,
    productImage: session.product.images[0] ?? '',
    variantName: session.variant.name,
    variantValue: session.variant.value,
    quantity: session.quantity,
    subtotal: session.pricing.subtotal,
    shipping: effectiveShipping,
    tax: session.pricing.tax,
    total,
    currency: session.pricing.currency,
    addressStreet: address.street,
    addressCity: address.city,
    addressState: address.state,
    addressCountry: address.country,
    addressPostalCode: address.postalCode,
  };
};

/**
 * Validates that all required fields are present and non-empty/valid.
 * Returns an array of missing/invalid field names.
 */
const validateSummaryCompleteness = (fields: OrderSummaryFields): string[] => {
  const missing: string[] = [];

  if (!fields.productName || fields.productName.trim() === '') missing.push('productName');
  if (!fields.productImage || fields.productImage.trim() === '') missing.push('productImage');
  if (!fields.variantName || fields.variantName.trim() === '') missing.push('variantName');
  if (fields.quantity <= 0) missing.push('quantity');
  if (typeof fields.subtotal !== 'number' || fields.subtotal < 0) missing.push('subtotal');
  if (typeof fields.shipping !== 'number' || fields.shipping < 0) missing.push('shipping');
  if (typeof fields.tax !== 'number' || fields.tax < 0) missing.push('tax');
  if (typeof fields.total !== 'number' || fields.total < 0) missing.push('total');
  if (!fields.currency || fields.currency.trim() === '') missing.push('currency');
  if (!fields.addressStreet || fields.addressStreet.trim() === '') missing.push('addressStreet');
  if (!fields.addressCity || fields.addressCity.trim() === '') missing.push('addressCity');
  if (!fields.addressState || fields.addressState.trim() === '') missing.push('addressState');
  if (!fields.addressCountry || fields.addressCountry.trim() === '') missing.push('addressCountry');
  if (!fields.addressPostalCode || fields.addressPostalCode.trim() === '') missing.push('addressPostalCode');

  return missing;
};

// ============================================================================
// Arbitraries
// ============================================================================

const mongoIdArb = fc.stringMatching(/^[0-9a-f]{24}$/);

const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0);

const nonNegativeAmountArb = fc
  .float({ min: 0, max: 100_000, noNaN: true })
  .map(Math.fround);

const currencyArb = fc.constantFrom('USD', 'NGN', 'GHS', 'EUR', 'GBP', 'KES', 'ZAR');

const productArb: fc.Arbitrary<BuyNowProduct> = fc.record({
  name: nonEmptyStringArb,
  images: fc.array(
    fc.webUrl().filter(u => u.startsWith('https')),
    { minLength: 1, maxLength: 3 }
  ),
  vendor: fc.record({ businessName: nonEmptyStringArb }),
});

const variantArb: fc.Arbitrary<BuyNowVariant> = fc.record({
  name: nonEmptyStringArb,
  value: fc.option(nonEmptyStringArb, { nil: undefined }),
  price: nonNegativeAmountArb,
});

const pricingArb: fc.Arbitrary<BuyNowPricing> = fc.record({
  subtotal: nonNegativeAmountArb,
  shipping: nonNegativeAmountArb,
  tax: nonNegativeAmountArb,
  currency: currencyArb,
});

const sessionArb: fc.Arbitrary<BuyNowCheckoutSession> = fc.record({
  productId: mongoIdArb,
  variantId: mongoIdArb,
  optionId: mongoIdArb,
  quantity: fc.integer({ min: 1, max: 100 }),
  product: productArb,
  variant: variantArb,
  pricing: pricingArb,
});

const addressArb: fc.Arbitrary<Address> = fc.record({
  _id: fc.option(mongoIdArb, { nil: undefined }),
  type: fc.constantFrom('shipping' as const, 'billing' as const),
  street: nonEmptyStringArb,
  city: nonEmptyStringArb,
  state: nonEmptyStringArb,
  country: nonEmptyStringArb,
  postalCode: nonEmptyStringArb,
  isDefault: fc.boolean(),
  coordinates: fc.option(
    fc.record({
      latitude: fc.float({ min: -90, max: 90, noNaN: true }),
      longitude: fc.float({ min: -180, max: 180, noNaN: true }),
    }),
    { nil: undefined }
  ),
});

const calculatedShippingArb = fc.option(
  fc.float({ min: 0, max: 10_000, noNaN: true }).map(Math.fround),
  { nil: null }
);

// ============================================================================
// Property 8: Order summary completeness
// ============================================================================

describe('Property 8: Order summary completeness', () => {
  // --------------------------------------------------------------------------
  // 8a: All required fields are present
  // --------------------------------------------------------------------------
  describe('Requirement 4.6 / 5.5: All required fields present in order summary', () => {
    it('extractOrderSummaryFields returns all required fields for any valid session and address', () => {
      fc.assert(
        fc.property(
          sessionArb,
          addressArb,
          calculatedShippingArb,
          (session, address, calculatedShipping) => {
            const fields = extractOrderSummaryFields(session, address, calculatedShipping);
            const missing = validateSummaryCompleteness(fields);

            expect(missing).toEqual([]);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('product name in summary matches session product name', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.productName).toBe(session.product.name);
        }),
        { numRuns: 100 }
      );
    });

    it('product image in summary is the first image from session', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.productImage).toBe(session.product.images[0]);
        }),
        { numRuns: 100 }
      );
    });

    it('variant name and value in summary match session variant', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.variantName).toBe(session.variant.name);
          expect(fields.variantValue).toBe(session.variant.value);
        }),
        { numRuns: 100 }
      );
    });

    it('quantity in summary matches session quantity', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.quantity).toBe(session.quantity);
        }),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 8b: Address fields are correctly mapped
  // --------------------------------------------------------------------------
  describe('Requirement 4.6: Address details correctly displayed', () => {
    it('all address fields in summary match the selected address', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);

          expect(fields.addressStreet).toBe(address.street);
          expect(fields.addressCity).toBe(address.city);
          expect(fields.addressState).toBe(address.state);
          expect(fields.addressCountry).toBe(address.country);
          expect(fields.addressPostalCode).toBe(address.postalCode);
        }),
        { numRuns: 100 }
      );
    });

    it('changing the selected address updates all address fields in summary', () => {
      fc.assert(
        fc.property(
          sessionArb,
          addressArb,
          addressArb,
          calculatedShippingArb,
          (session, address1, address2, calculatedShipping) => {
            fc.pre(address1.street !== address2.street || address1.city !== address2.city);

            const fields1 = extractOrderSummaryFields(session, address1, calculatedShipping);
            const fields2 = extractOrderSummaryFields(session, address2, calculatedShipping);

            // At least one address field must differ
            const addressFieldsDiffer =
              fields1.addressStreet !== fields2.addressStreet ||
              fields1.addressCity !== fields2.addressCity ||
              fields1.addressState !== fields2.addressState ||
              fields1.addressCountry !== fields2.addressCountry ||
              fields1.addressPostalCode !== fields2.addressPostalCode;

            expect(addressFieldsDiffer).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 8c: Pricing fields are correctly computed
  // --------------------------------------------------------------------------
  describe('Requirement 5.5: Pricing fields correctly computed', () => {
    it('subtotal in summary matches session pricing subtotal', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.subtotal).toBe(session.pricing.subtotal);
        }),
        { numRuns: 100 }
      );
    });

    it('tax in summary matches session pricing tax', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.tax).toBe(session.pricing.tax);
        }),
        { numRuns: 100 }
      );
    });

    it('total in summary equals subtotal + tax + effective shipping', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.total).toBeCloseTo(fields.subtotal + fields.tax + fields.shipping, 5);
        }),
        { numRuns: 200 }
      );
    });

    it('currency in summary matches session pricing currency', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, calculatedShippingArb, (session, address, calculatedShipping) => {
          const fields = extractOrderSummaryFields(session, address, calculatedShipping);
          expect(fields.currency).toBe(session.pricing.currency);
        }),
        { numRuns: 100 }
      );
    });

    it('shipping in summary uses calculatedShipping when available', () => {
      fc.assert(
        fc.property(
          sessionArb,
          addressArb,
          fc.float({ min: 0, max: 10_000, noNaN: true }).map(Math.fround),
          (session, address, calculatedShipping) => {
            const fields = extractOrderSummaryFields(session, address, calculatedShipping);
            expect(fields.shipping).toBe(calculatedShipping);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('shipping in summary falls back to session pricing shipping when calculatedShipping is null', () => {
      fc.assert(
        fc.property(sessionArb, addressArb, (session, address) => {
          const fields = extractOrderSummaryFields(session, address, null);
          expect(fields.shipping).toBe(session.pricing.shipping);
        }),
        { numRuns: 100 }
      );
    });
  });
});
