// Feature: buy-now-checkout-fix, Property 1: Payment provider mapping consistency
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 5.6**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getProviderByCurrency } from '@/utils/paymentProvider';

// The canonical currency-to-provider mapping that both the cart checkout
// and the Buy Now checkout must agree on.
const EXPECTED_MAPPING: Record<string, string> = {
  // Paystack currencies (African)
  ngn: 'paystack',
  ghs: 'paystack',
  kes: 'paystack',
  zar: 'paystack',
  xof: 'paystack',
  // Airwallex (China)
  cny: 'airwallex',
  // Stripe (everything else — representative set)
  usd: 'stripe',
  eur: 'stripe',
  gbp: 'stripe',
  cad: 'stripe',
  aud: 'stripe',
  nzd: 'stripe',
  chf: 'stripe',
  sek: 'stripe',
  nok: 'stripe',
  dkk: 'stripe',
  jpy: 'stripe',
  sgd: 'stripe',
  hkd: 'stripe',
  inr: 'stripe',
  myr: 'stripe',
  php: 'stripe',
  thb: 'stripe',
  brl: 'stripe',
  mxn: 'stripe',
  pln: 'stripe',
  czk: 'stripe',
  huf: 'stripe',
  ron: 'stripe',
  ils: 'stripe',
  aed: 'stripe',
  sar: 'stripe',
};

const KNOWN_CURRENCIES = Object.keys(EXPECTED_MAPPING);

describe('Property 1: Payment provider mapping consistency', () => {
  it('should return the expected provider for any known currency code', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_CURRENCIES),
        (currency) => {
          const provider = getProviderByCurrency(currency);
          expect(provider).toBe(EXPECTED_MAPPING[currency]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be case-insensitive for known currency codes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_CURRENCIES),
        fc.constantFrom('lower', 'upper', 'mixed') as fc.Arbitrary<string>,
        (currency, caseType) => {
          let input: string;
          if (caseType === 'upper') {
            input = currency.toUpperCase();
          } else if (caseType === 'mixed') {
            input = currency
              .split('')
              .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
              .join('');
          } else {
            input = currency.toLowerCase();
          }

          const provider = getProviderByCurrency(input);
          expect(provider).toBe(EXPECTED_MAPPING[currency]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should default to stripe for any unknown currency code', () => {
    const knownSet = new Set(KNOWN_CURRENCIES.map((c) => c.toLowerCase()));

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 3 }).filter((s) => /^[a-z]{3}$/.test(s)),
        (currency) => {
          fc.pre(!knownSet.has(currency.toLowerCase()));
          const provider = getProviderByCurrency(currency);
          expect(provider).toBe('stripe');
        }
      ),
      { numRuns: 100 }
    );
  });
});
