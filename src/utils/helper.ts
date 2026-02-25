export const truncateSentence = (sentence: string, length: number): string => {
  return sentence.length > length
    ? sentence.slice(0, length) + "..."
    : sentence;
};

/**
 * Generates a descriptive alt text for a product image derived from the product name.
 * @param productName - The name of the product
 * @param index - Optional image index (0-based) for multiple images
 * @returns A non-empty alt text string derived from the product name
 */
export const getProductImageAlt = (productName: string, index?: number): string => {
  const trimmed = productName.trim();
  const baseName = trimmed || "Product image";
  if (index !== undefined && index > 0) {
    return `${baseName} - Image ${index + 1}`;
  }
  return baseName;
};

