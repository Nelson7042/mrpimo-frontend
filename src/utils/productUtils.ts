import { ProductType } from "@/types/product.type";

/**
 * Calculates the total available quantity for a product
 * @param product - The product to calculate quantity for
 * @returns The total quantity available across all variants and options
 */
export const calculateTotalQuantity = (product: ProductType): number => {
  if (!product || !product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
    return 0;
  }

  // Only calculate quantity for instant sales products
  if (product.inventory?.listing?.type !== "instant") {
    return 1; // Return 1 for auction products to show them
  }

  return product.variants.reduce((sum, variant) => {
    if (!variant.options || !Array.isArray(variant.options)) return sum;
    return sum + variant.options.reduce((optionSum, option) => {
      // Only count options that have valid values and quantity > 0
      return optionSum + (option.value && option.quantity > 0 ? option.quantity : 0);
    }, 0);
  }, 0);
};

/**
 * Checks if a product has available quantity
 * @param product - The product to check
 * @returns True if the product has available quantity, false otherwise
 */
export const hasAvailableQuantity = (product: ProductType): boolean => {
  // Always show auction products
  if (product.inventory?.listing?.type === "auction") {
    return true;
  }
  return calculateTotalQuantity(product) > 0;
};

/**
 * Filters products to only include those with images and available quantity
 * @param products - Array of products to filter
 * @returns Filtered array of products
 */
export const filterAvailableProducts = (products: ProductType[]): ProductType[] => {
  if (!Array.isArray(products)) return [];
  
  return products.filter((product) => {
    // Filter out products with no images
    if (!product.images || product.images.length === 0) return false;
    
    // Always show auction products
    if (product.inventory?.listing?.type === "auction") {
      return true;
    }
    
    // Filter out instant sales products with zero total quantity
    return hasAvailableQuantity(product);
  });
};