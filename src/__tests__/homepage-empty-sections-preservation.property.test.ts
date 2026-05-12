// Feature: homepage-empty-sections-fix, Property 2: Preservation - Sections With Products Render Normally
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  shouldShowAuctionSection,
  shouldShowComputerAccessoriesSection,
} from './homepage-empty-sections-visibility';

describe('Property 2: Preservation - Sections With Products Render Normally', () => {
  describe('AuctionedProduct: liveProducts.length > 0 → section should be visible', () => {
    it('returns true when live products exist (regardless of upcoming)', () => {
      fc.assert(
        fc.property(
          // Generate a non-zero count for live products
          fc.integer({ min: 1, max: 100 }),
          // Generate any count for upcoming products (0 or more)
          fc.integer({ min: 0, max: 100 }),
          (liveCount, upcomingCount) => {
            // Create arrays with the generated lengths
            const liveProducts = Array.from({ length: liveCount }, (_, i) => ({
              _id: `live-${i}`,
              name: `Live Product ${i}`,
            }));
            const upcomingProducts = Array.from({ length: upcomingCount }, (_, i) => ({
              _id: `upcoming-${i}`,
              name: `Upcoming Product ${i}`,
            }));

            // When live products exist, section should always be visible
            const visibility = shouldShowAuctionSection(liveProducts, upcomingProducts);
            expect(visibility).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('AuctionedProduct: upcomingProducts.length > 0 (even if live is empty) → section should be visible', () => {
    it('returns true when upcoming products exist but live is empty', () => {
      fc.assert(
        fc.property(
          // Generate a non-zero count for upcoming products
          fc.integer({ min: 1, max: 100 }),
          (upcomingCount) => {
            // Live products is empty
            const liveProducts: any[] = [];
            const upcomingProducts = Array.from({ length: upcomingCount }, (_, i) => ({
              _id: `upcoming-${i}`,
              name: `Upcoming Product ${i}`,
            }));

            // When upcoming products exist (even if live is empty), section should be visible
            const visibility = shouldShowAuctionSection(liveProducts, upcomingProducts);
            expect(visibility).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ComputerAccessories: parentCategory exists AND products.length > 0 → section should be visible', () => {
    it('returns true when parentCategory is valid and products exist', () => {
      fc.assert(
        fc.property(
          // Generate a valid Category object
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 24 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            slug: fc.string({ minLength: 1, maxLength: 30 }),
            sortOrder: fc.integer({ min: 0, max: 100 }),
          }),
          // Generate a non-empty products array
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 24 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 100 }
          ),
          (parentCategory, products) => {
            // When parentCategory exists AND products are non-empty, section should be visible
            const visibility = shouldShowComputerAccessoriesSection(parentCategory, products);
            expect(visibility).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
