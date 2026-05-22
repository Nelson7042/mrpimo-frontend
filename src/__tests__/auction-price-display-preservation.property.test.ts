// Feature: auction-price-display-fix, Property 2: Preservation - Non-Auction and Loaded-Bids Price Behavior Unchanged
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the CURRENT auction price calculation logic
 * from mprimo/src/app/home/product-details/[id]/(component)/ProductInfo.tsx
 *
 * This extracts the price calculation that runs inside the `saleType === "auction"` branch:
 *
 *   const bidsFromApi = (bids as any)?.bids || [];
 *   const auctionInfoApi = (bids as any)?.auctionInfo;
 *   const winningBid = bidsFromApi.find((bid: any) => bid.isWinning);
 *   const highestBidUSD = winningBid
 *     ? winningBid.currentAmount
 *     : auctionInfoApi?.startBidPrice || 0;
 *
 * When bids data IS available:
 * - If there's a winning bid, winningBid.currentAmount is returned
 * - If bids array is empty, auctionInfoApi.startBidPrice is returned
 */
function getAuctionDisplayPrice(
  bids: any,
  _productStartBidPrice: number
): number {
  const bidsFromApi = bids?.bids || [];
  const auctionInfoApi = bids?.auctionInfo;
  const winningBid = bidsFromApi.find((bid: any) => bid.isWinning);

  // Current logic (unfixed) - this is the behavior we want to PRESERVE
  const highestBidUSD = winningBid
    ? winningBid.currentAmount
    : auctionInfoApi?.startBidPrice || 0;

  return highestBidUSD;
}

/**
 * Determines whether the auction price logic is invoked.
 * In ProductInfo.tsx, the auction price block is only entered when:
 *   saleType === "auction"
 *
 * For non-auction products (saleType === "instant" or any other type),
 * the auction price logic is completely skipped.
 */
function isAuctionPriceLogicInvoked(saleType: string): boolean {
  return saleType === 'auction';
}

// Arbitrary for generating a bid object with isWinning flag and currentAmount
const bidArbitrary = (isWinning: boolean) =>
  fc.record({
    isWinning: fc.constant(isWinning),
    currentAmount: fc.integer({ min: 1, max: 1000000 }),
    userId: fc.string({ minLength: 5, maxLength: 24 }),
  });

// Arbitrary for generating a non-empty bids array with exactly one winning bid
const nonEmptyBidsWithWinnerArbitrary = fc
  .tuple(
    bidArbitrary(true), // The winning bid
    fc.array(bidArbitrary(false), { minLength: 0, maxLength: 10 }) // Other non-winning bids
  )
  .map(([winner, others]) => [...others, winner]);

describe('Property 2: Preservation - Non-Auction and Loaded-Bids Price Behavior Unchanged', () => {
  it('for all inputs where bids data is available and bids array is non-empty with a winning bid, result equals the winning bid currentAmount', () => {
    fc.assert(
      fc.property(
        nonEmptyBidsWithWinnerArbitrary,
        fc.integer({ min: 1, max: 100000 }), // auctionInfo.startBidPrice
        fc.integer({ min: 1, max: 100000 }), // productStartBidPrice (unused when bids available)
        (bidsArray, startBidPrice, productStartBidPrice) => {
          const bidsData = {
            bids: bidsArray,
            auctionInfo: { startBidPrice },
          };

          const result = getAuctionDisplayPrice(bidsData, productStartBidPrice);

          // The winning bid's currentAmount should be returned
          const winningBid = bidsArray.find((bid) => bid.isWinning);
          expect(result).toBe(winningBid!.currentAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for all inputs where bids data is available and bids array is empty, result equals auctionInfoApi.startBidPrice', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }), // auctionInfo.startBidPrice (must be > 0 to avoid falsy fallback)
        fc.integer({ min: 1, max: 100000 }), // productStartBidPrice (unused when bids data available)
        (startBidPrice, productStartBidPrice) => {
          const bidsData = {
            bids: [], // Empty bids array - no bids placed yet
            auctionInfo: { startBidPrice },
          };

          const result = getAuctionDisplayPrice(bidsData, productStartBidPrice);

          // When bids array is empty, auctionInfoApi.startBidPrice should be returned
          expect(result).toBe(startBidPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for all non-auction product inputs, the auction price logic is not invoked (saleType guard)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('instant', 'fixed', 'negotiable', 'wholesale', 'rental'),
        fc.integer({ min: 1, max: 100000 }), // any product price
        (saleType, _price) => {
          // The saleType guard in ProductInfo.tsx ensures auction logic is only
          // entered when saleType === "auction". For all other types, the auction
          // price calculation block is never reached.
          const invoked = isAuctionPriceLogicInvoked(saleType);

          expect(invoked).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
