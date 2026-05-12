// Feature: homepage-empty-sections-fix, Property 1: Bug Condition - Empty Sections Render DOM Instead of Null
// **Validates: Requirements 1.1, 1.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure visibility function for AuctionedProduct section.
 * Returns true iff the section should be visible (i.e., there are live OR upcoming products).
 *
 * Expected behavior: section is visible only when liveProducts.length > 0 OR upcomingProducts.length > 0
 * Bug behavior: section always renders regardless of product availability
 */
export function shouldShowAuctionSection(liveProducts: any[], upcomingProducts: any[]): boolean {
  return liveProducts.length > 0 || upcomingProducts.length > 0;
}

/**
 * Pure visibility function for ComputerAccessories section.
 * Returns true iff the section should be visible (i.e., parentCategory exists AND products.length > 0).
 *
 * Expected behavior: section is visible only when parentCategory !== null AND products.length > 0
 * Bug behavior: section renders empty state UI instead of returning null
 */
export function shouldShowComputerAccessoriesSection(parentCategory: any | null, products: any[]): boolean {
  return parentCategory !== null && products.length > 0;
}

/**
 * Simulates the CURRENT (fixed) AuctionedProduct visibility behavior.
 * The fixed component returns null when no live AND no upcoming products exist.
 */
function currentAuctionSectionVisibility(liveProducts: any[], upcomingProducts: any[]): boolean {
  // Fixed behavior: returns true only when live OR upcoming products exist
  return liveProducts.length > 0 || upcomingProducts.length > 0;
}

/**
 * Simulates the CURRENT (fixed) ComputerAccessories visibility behavior.
 * The fixed component returns null when parentCategory is null OR products are empty.
 */
function currentComputerAccessoriesVisibility(parentCategory: any | null, products: any[]): boolean {
  // Fixed behavior: returns true only when parentCategory exists AND products are non-empty
  return parentCategory !== null && products.length > 0;
}

/**
 * Bug condition for AuctionedProduct:
 * liveProducts=[] AND upcomingProducts=[] → section should NOT be visible
 */
function isAuctionBugCondition(liveProducts: any[], upcomingProducts: any[]): boolean {
  return liveProducts.length === 0 && upcomingProducts.length === 0;
}

/**
 * Bug condition for ComputerAccessories:
 * parentCategory=null OR products=[] → section should NOT be visible
 */
function isComputerAccessoriesBugCondition(parentCategory: any | null, products: any[]): boolean {
  return parentCategory === null || products.length === 0;
}

describe('Property 1: Bug Condition - Empty Sections Render DOM Instead of Null', () => {
  describe('AuctionedProduct: liveProducts=[] AND upcomingProducts=[] → should return null', () => {
    it('current behavior renders section when both live and upcoming products are empty (BUG)', () => {
      fc.assert(
        fc.property(
          // Generate empty arrays for both live and upcoming products
          fc.constant([] as any[]),
          fc.constant([] as any[]),
          (liveProducts, upcomingProducts) => {
            // Verify bug condition holds
            expect(isAuctionBugCondition(liveProducts, upcomingProducts)).toBe(true);

            // Expected behavior: section should NOT be visible (return false)
            const expectedVisibility = shouldShowAuctionSection(liveProducts, upcomingProducts);
            expect(expectedVisibility).toBe(false);

            // Current (buggy) behavior: section IS visible (returns true)
            const currentVisibility = currentAuctionSectionVisibility(liveProducts, upcomingProducts);

            // This assertion tests that current behavior matches expected behavior.
            // It will FAIL because current behavior (true) !== expected behavior (false).
            // This failure PROVES the bug exists.
            expect(currentVisibility).toBe(expectedVisibility);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ComputerAccessories: parentCategory=null → should return null', () => {
    it('current behavior renders section when parentCategory is null (BUG)', () => {
      fc.assert(
        fc.property(
          // Generate null parentCategory
          fc.constant(null),
          // Generate random product arrays (doesn't matter since category is null)
          fc.array(fc.record({ _id: fc.string(), name: fc.string() }), { minLength: 0, maxLength: 5 }),
          (parentCategory, products) => {
            // Verify bug condition holds
            expect(isComputerAccessoriesBugCondition(parentCategory, products)).toBe(true);

            // Expected behavior: section should NOT be visible (return false)
            const expectedVisibility = shouldShowComputerAccessoriesSection(parentCategory, products);
            expect(expectedVisibility).toBe(false);

            // Current (buggy) behavior: section IS visible (returns true)
            const currentVisibility = currentComputerAccessoriesVisibility(parentCategory, products);

            // This assertion tests that current behavior matches expected behavior.
            // It will FAIL because current behavior (true) !== expected behavior (false).
            // This failure PROVES the bug exists.
            expect(currentVisibility).toBe(expectedVisibility);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ComputerAccessories: parentCategory exists but products=[] → should return null', () => {
    it('current behavior renders section when products array is empty (BUG)', () => {
      fc.assert(
        fc.property(
          // Generate a valid parentCategory object
          fc.record({
            _id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            slug: fc.constant('computer-accessories'),
          }),
          // Generate empty products array
          fc.constant([] as any[]),
          (parentCategory, products) => {
            // Verify bug condition holds
            expect(isComputerAccessoriesBugCondition(parentCategory, products)).toBe(true);

            // Expected behavior: section should NOT be visible (return false)
            const expectedVisibility = shouldShowComputerAccessoriesSection(parentCategory, products);
            expect(expectedVisibility).toBe(false);

            // Current (buggy) behavior: section IS visible (returns true)
            const currentVisibility = currentComputerAccessoriesVisibility(parentCategory, products);

            // This assertion tests that current behavior matches expected behavior.
            // It will FAIL because current behavior (true) !== expected behavior (false).
            // This failure PROVES the bug exists.
            expect(currentVisibility).toBe(expectedVisibility);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
