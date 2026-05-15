// Feature: bid-winner-fulfillment, Property 13: Bid History Filter Correctness
// **Validates: Requirements 8.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserBid, PaymentStatusFilter } from '@/hooks/useBids';

/**
 * Pure filter function modeling the bid history payment status filter logic.
 * When filter is 'all', all bids are returned.
 * Otherwise, only bids whose paymentStatus matches the filter are returned.
 */
function filterBidsByPaymentStatus(bids: UserBid[], filter: PaymentStatusFilter): UserBid[] {
  if (filter === 'all') return bids;
  return bids.filter(bid => bid.paymentStatus === filter);
}

// Arbitrary for PaymentStatus values that a bid can have
const paymentStatusArb = fc.constantFrom('none' as const, 'payment_pending' as const, 'paid' as const, 'expired' as const);

// Arbitrary for PaymentStatusFilter values used in the UI filter
const paymentStatusFilterArb = fc.constantFrom('all' as const, 'payment_pending' as const, 'paid' as const, 'expired' as const);

// Generate valid ISO date strings from integer timestamps to avoid Invalid Date issues
const validISODateArb = fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString());

// Arbitrary for generating a UserBid object with random paymentStatus
const userBidArb = fc.record({
  productId: fc.uuid(),
  productName: fc.string({ minLength: 1, maxLength: 50 }),
  productImage: fc.option(fc.webUrl(), { nil: undefined }),
  currentAmount: fc.float({ min: 1, max: 100000, noNaN: true }),
  maxAmount: fc.float({ min: 1, max: 100000, noNaN: true }),
  currency: fc.constantFrom('USD', 'NGN', 'GBP', 'EUR'),
  isWinning: fc.boolean(),
  createdAt: validISODateArb,
  auctionEnded: fc.boolean(),
  paymentStatus: paymentStatusArb,
  paymentDeadline: fc.option(validISODateArb, { nil: null }),
  orderId: fc.option(fc.uuid(), { nil: null }),
  bidId: fc.option(fc.uuid(), { nil: undefined }),
}) as fc.Arbitrary<UserBid>;

describe('Property 13: Bid History Filter Correctness', () => {
  it('filter "all" returns all bids without modification', () => {
    fc.assert(
      fc.property(
        fc.array(userBidArb, { minLength: 0, maxLength: 50 }),
        (bids) => {
          const result = filterBidsByPaymentStatus(bids, 'all');
          expect(result).toHaveLength(bids.length);
          expect(result).toEqual(bids);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no false positives: every bid in filtered result matches the filter', () => {
    fc.assert(
      fc.property(
        fc.array(userBidArb, { minLength: 0, maxLength: 50 }),
        paymentStatusFilterArb,
        (bids, filter) => {
          const result = filterBidsByPaymentStatus(bids, filter);

          if (filter === 'all') {
            // All bids returned, no filtering applied
            expect(result).toEqual(bids);
          } else {
            // Every returned bid must match the filter
            for (const bid of result) {
              expect(bid.paymentStatus).toBe(filter);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no false negatives: every matching bid from the input is in the filtered result', () => {
    fc.assert(
      fc.property(
        fc.array(userBidArb, { minLength: 0, maxLength: 50 }),
        paymentStatusFilterArb,
        (bids, filter) => {
          const result = filterBidsByPaymentStatus(bids, filter);

          if (filter === 'all') {
            expect(result).toHaveLength(bids.length);
          } else {
            // Count bids that match the filter in the original array
            const expectedMatches = bids.filter(b => b.paymentStatus === filter);
            expect(result).toHaveLength(expectedMatches.length);

            // Every matching bid from input must appear in result
            for (const bid of expectedMatches) {
              expect(result).toContain(bid);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtered result is a subset of the original bids (preserves order and identity)', () => {
    fc.assert(
      fc.property(
        fc.array(userBidArb, { minLength: 0, maxLength: 50 }),
        paymentStatusFilterArb,
        (bids, filter) => {
          const result = filterBidsByPaymentStatus(bids, filter);

          // Result length must not exceed input length
          expect(result.length).toBeLessThanOrEqual(bids.length);

          // Every item in result must be referentially identical to an item in bids
          for (const bid of result) {
            expect(bids).toContain(bid);
          }

          // Order is preserved: indices in result should be monotonically increasing in bids
          let lastIndex = -1;
          for (const bid of result) {
            const idx = bids.indexOf(bid, lastIndex + 1);
            expect(idx).toBeGreaterThan(lastIndex);
            lastIndex = idx;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
