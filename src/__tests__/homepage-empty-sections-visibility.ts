/**
 * Pure visibility functions for homepage section visibility logic.
 * Shared between bug exploration and preservation property tests.
 */

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
