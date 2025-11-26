export interface VariantDimension {
  name: string;
  values: string[];
}

export interface VariantCombination {
  combination: Record<string, string>; // e.g., { "Color": "Red", "Size": "Large" }
  sku?: string;
  price: number;
  salePrice?: number;
  quantity: number;
  isDefault?: boolean;
}

export interface ProcessedVariantOption {
  value: string;
  sku?: string;
  price: number;
  salePrice?: number;
  quantity: number;
  isDefault: boolean;
  dimensions: Record<string, string>;
}

export class VariantCombinationUtil {
  /**
   * Generate all possible combinations from variant dimensions
   */
  static generateAllCombinations(dimensions: VariantDimension[]): Record<string, string>[] {
    if (dimensions.length === 0) return [];
    if (dimensions.length === 1) {
      return dimensions[0].values.map(value => ({ [dimensions[0].name]: value }));
    }

    const [first, ...rest] = dimensions;
    const restCombinations = this.generateAllCombinations(rest);
    
    const combinations: Record<string, string>[] = [];
    
    for (const value of first.values) {
      for (const restCombination of restCombinations) {
        combinations.push({
          [first.name]: value,
          ...restCombination
        });
      }
    }
    
    return combinations;
  }

  /**
   * Validate variant combinations
   */
  static validateCombinations(
    combinations: VariantCombination[],
    dimensionNames: string[]
  ): { valid: boolean; error?: string } {
    if (!combinations || combinations.length === 0) {
      return { valid: false, error: "At least one variant combination is required" };
    }

    // Check if all combinations have the required dimensions
    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      
      // Validate combination structure
      if (!combo.combination || typeof combo.combination !== 'object') {
        return { valid: false, error: `Invalid combination structure at index ${i}` };
      }

      // Check if all dimension names are present
      for (const dimName of dimensionNames) {
        if (!(dimName in combo.combination)) {
          return { valid: false, error: `Missing dimension "${dimName}" in combination ${i}` };
        }
      }

      // Validate pricing
      if (!combo.price || combo.price < 0.01) {
        return { valid: false, error: `Invalid price for combination ${i}` };
      }

      if (combo.salePrice && combo.salePrice >= combo.price) {
        return { valid: false, error: `Sale price must be less than regular price for combination ${i}` };
      }

      // Validate quantity
      if (combo.quantity === undefined || combo.quantity < 0) {
        return { valid: false, error: `Invalid quantity for combination ${i}` };
      }
    }

    // Check for duplicate combinations
    const combinationStrings = new Set();
    for (let i = 0; i < combinations.length; i++) {
      const comboString = this.combinationToString(combinations[i].combination, dimensionNames);
      if (combinationStrings.has(comboString)) {
        return { valid: false, error: `Duplicate combination found: ${comboString}` };
      }
      combinationStrings.add(comboString);
    }

    // Check for duplicate SKUs
    const skus = new Set();
    for (let i = 0; i < combinations.length; i++) {
      const sku = combinations[i].sku;
      if (sku) {
        if (skus.has(sku)) {
          return { valid: false, error: `Duplicate SKU found: ${sku}` };
        }
        skus.add(sku);
      }
    }

    // Ensure at least one default combination
    const hasDefault = combinations.some(combo => combo.isDefault);
    if (!hasDefault) {
      return { valid: false, error: "At least one combination must be marked as default" };
    }

    return { valid: true };
  }

  /**
   * Process combinations for backend compatibility
   */
  static processCombinations(
    combinations: VariantCombination[],
    productName: string
  ): ProcessedVariantOption[] {
    return combinations.map((combo, index) => {
      // Generate display value from combination
      const displayValue = Object.entries(combo.combination)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      return {
        value: displayValue,
        sku: combo.sku || this.generateSKUFromCombination(combo.combination, productName),
        price: combo.price,
        salePrice: combo.salePrice,
        quantity: combo.quantity,
        isDefault: combo.isDefault || false,
        dimensions: combo.combination
      };
    });
  }

  /**
   * Generate SKU from combination
   */
  private static generateSKUFromCombination(
    combination: Record<string, string>,
    productName: string
  ): string {
    const productPrefix = productName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase();
    
    const comboSuffix = Object.values(combination)
      .map(value => value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase())
      .join('');
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    
    return `${productPrefix}-${comboSuffix}-${randomSuffix}`;
  }

  /**
   * Convert combination to string for comparison
   */
  private static combinationToString(
    combination: Record<string, string>,
    dimensionNames: string[]
  ): string {
    return dimensionNames
      .map(name => `${name}:${combination[name]}`)
      .join('|');
  }

  /**
   * Create variant dimensions from combinations
   */
  static extractDimensionsFromCombinations(combinations: VariantCombination[]): VariantDimension[] {
    if (combinations.length === 0) return [];

    const dimensionMap = new Map<string, Set<string>>();

    // Extract all dimension names and their possible values
    combinations.forEach(combo => {
      Object.entries(combo.combination).forEach(([key, value]) => {
        if (!dimensionMap.has(key)) {
          dimensionMap.set(key, new Set());
        }
        dimensionMap.get(key)!.add(value);
      });
    });

    // Convert to VariantDimension array
    return Array.from(dimensionMap.entries()).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet).sort()
    }));
  }

  /**
   * Fill missing combinations with default values
   */
  static fillMissingCombinations(
    existingCombinations: VariantCombination[],
    dimensions: VariantDimension[],
    defaultPrice: number = 0,
    defaultQuantity: number = 0
  ): VariantCombination[] {
    const allPossibleCombinations = this.generateAllCombinations(dimensions);
    const existingCombinationStrings = new Set(
      existingCombinations.map(combo => 
        this.combinationToString(combo.combination, dimensions.map(d => d.name))
      )
    );

    const missingCombinations: VariantCombination[] = [];

    allPossibleCombinations.forEach(combination => {
      const comboString = this.combinationToString(combination, dimensions.map(d => d.name));
      if (!existingCombinationStrings.has(comboString)) {
        missingCombinations.push({
          combination,
          price: defaultPrice,
          quantity: defaultQuantity,
          isDefault: false
        });
      }
    });

    return [...existingCombinations, ...missingCombinations];
  }

  /**
   * Update combination pricing in bulk
   */
  static updateCombinationPricing(
    combinations: VariantCombination[],
    priceUpdates: { 
      basePrice?: number; 
      salePrice?: number; 
      priceAdjustments?: Record<string, number>; // dimension-based adjustments
    }
  ): VariantCombination[] {
    return combinations.map(combo => {
      let newPrice = combo.price;
      let newSalePrice = combo.salePrice;

      // Apply base price if provided
      if (priceUpdates.basePrice !== undefined) {
        newPrice = priceUpdates.basePrice;
      }

      // Apply sale price if provided
      if (priceUpdates.salePrice !== undefined) {
        newSalePrice = priceUpdates.salePrice;
      }

      // Apply dimension-based adjustments
      if (priceUpdates.priceAdjustments) {
        Object.entries(combo.combination).forEach(([dimension, value]) => {
          const adjustmentKey = `${dimension}:${value}`;
          if (priceUpdates.priceAdjustments![adjustmentKey]) {
            newPrice += priceUpdates.priceAdjustments![adjustmentKey];
            if (newSalePrice) {
              newSalePrice += priceUpdates.priceAdjustments![adjustmentKey];
            }
          }
        });
      }

      return {
        ...combo,
        price: Math.max(0.01, newPrice), // Ensure minimum price
        salePrice: newSalePrice && newSalePrice < newPrice ? newSalePrice : undefined
      };
    });
  }

  /**
   * Convert legacy variants to combinations
   */
  static convertLegacyVariantsToCombinations(variants: any[]): {
    combinations: VariantCombination[];
    dimensionNames: string[];
  } {
    const combinations: VariantCombination[] = [];
    const dimensionNames: string[] = [];

    variants.forEach(variant => {
      if (variant.options) {
        variant.options.forEach((option: any) => {
          if (option.dimensions && typeof option.dimensions === 'object') {
            // Already has dimensions
            combinations.push({
              combination: option.dimensions,
              sku: option.sku,
              price: option.price,
              salePrice: option.salePrice,
              quantity: option.quantity,
              isDefault: option.isDefault
            });

            // Collect dimension names
            Object.keys(option.dimensions).forEach(key => {
              if (!dimensionNames.includes(key)) {
                dimensionNames.push(key);
              }
            });
          } else {
            // Simple variant structure
            combinations.push({
              combination: { [variant.name]: option.value },
              sku: option.sku,
              price: option.price,
              salePrice: option.salePrice,
              quantity: option.quantity,
              isDefault: option.isDefault
            });

            if (!dimensionNames.includes(variant.name)) {
              dimensionNames.push(variant.name);
            }
          }
        });
      }
    });

    return { combinations, dimensionNames };
  }
}