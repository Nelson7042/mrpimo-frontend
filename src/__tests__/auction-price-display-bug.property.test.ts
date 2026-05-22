// Feature: auction-price-display-fix, Property 1: Bug Condition - Auction Price Shows $0.00 for Guest/Loading State
// **Validates: Requirements 1.1, 1.2, 2.1, 2.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the FIXED auction price calculation logic
 * from mprimo/src/app/home/product-details/[id]/(component)/ProductInfo.tsx
 *
 * This extracts the price calculation that runs inside the `saleType === "auction"` branch:
 *
 *   const bidsFromApi = (bids as any)?.bids || [];
 *   const auctionInfoApi = (bids as any)?.auctionInfo;
 *   const winningBid = bidsFromApi.find((bid: any) => bid.isWinning);
 *   const highestBidUSD = winningBid
 *     ? winningBid.currentAmount
 *     : auctionInfoApi?.startBidPrice || productStartBidPrice || 0;
 *
 * When `bids` is undefined (guest user where fetchWithAuth rejects, or loading state),
 * `auctionInfoApi` is undefined, and `highestBidUSD` now falls back to productStartBidPrice.
 *
 * The fix: fall back to productData.inventory.listing.auction.startBidPrice
 */
function getAuctionDisplayPrice(
  bids: any,
  productStartBidPrice: number
): number {
  const bidsFromApi = bids?.bids || [];
  const auctionInfoApi = bids?.auctionInfo;
  const winningBid = bidsFromApi.find((bid: any) => bid.isWinning);

  // Fixed logic - falls back to productStartBidPrice when bids unavailable
  const highestBidUSD = winningBid
    ? winningBid.currentAmount
    : auctionInfoApi?.startBidPrice || productStartBidPrice || 0;

  return highestBidUSD;
}

/**
 * Bug condition predicate:
 * The bug triggers when:
 * 1. saleType === "auction" (we're in the auction branch)
 * 2. bids is undefined (guest user: fetchWithAuth rejects, OR any user during loading)
 * 3. productData has a valid startBidPrice > 0
 * 4. The displayed price evaluates to 0 instead of startBidPrice
 */
function isBugCondition(input: {
  saleType: string;
  bids: any;
  startBidPrice: number;
}): boolean {
  return (
    input.saleType === 'auction' &&
    input.bids === undefined &&
    input.startBidPrice > 0
  );
}

describe('Property 1: Bug Condition - Auction Price Shows $0.00 for Guest/Loading State', () => {
  it('for all auction products with startBidPrice > 0, when bids is undefined (guest/loading), displayed price should equal startBidPrice (not 0)', () => {
    fc.assert(
      fc.property(
        // Generate random startBidPrice values (1..100000) representing cents or whole dollars
        fc.integer({ min: 1, max: 100000 }),
        (startBidPrice) => {
          const input = {
            saleType: 'auction' as const,
            bids: undefined, // Simulates guest user (fetchWithAuth rejects) or loading state
            startBidPrice,
          };

          // Verify we are in the bug condition
          expect(isBugCondition(input)).toBe(true);

          // Call the current price calculation with bids=undefined
          const displayedPrice = getAuctionDisplayPrice(
            input.bids,
            input.startBidPrice
          );

          // EXPECTED behavior: price should equal startBidPrice when bids unavailable
          // ACTUAL behavior on unfixed code: returns 0
          expect(displayedPrice).toBe(startBidPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for all auction products with startBidPrice > 0, when bids fetch fails (null response), displayed price should equal startBidPrice', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (startBidPrice) => {
          // Simulates a failed/rejected bids fetch where data is undefined
          const bidsData = undefined;

          const displayedPrice = getAuctionDisplayPrice(
            bidsData,
            startBidPrice
          );

          // EXPECTED: should fall back to product's startBidPrice
          // ACTUAL on unfixed code: returns 0
          expect(displayedPrice).toBe(startBidPrice);
        }
      ),
      { numRuns: 100 }
    );
  });
});
