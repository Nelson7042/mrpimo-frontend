export interface ProductFormData {
  name?: string;
  brand?: string;
  productName?: string;
  brandName?: string;
  description: string;
  condition: 'new' | 'used' | 'refurbished';
  conditionDescription?: string;
  category: {
    main: string;
    sub?: string[];
  } | string;
  country?: string;
  productSpecifications?: Record<string, any>;
  additionalSpecifications?: Record<string, any>;
  inventory?: {
    listing: {
      type: 'instant' | 'auction';
      instant?: {
        acceptOffer: boolean;
      };
      auction?: {
        startBidPrice: number;
        reservePrice: number;
        buyNowPrice?: number;
        startTime: Date;
        endTime: Date;
        bidIncrement: number;
      };
    };
  };
  pricingInformation?: any;
  images?: string[];
  specifications?: Array<{ key: string; value: string }>;
  shipping?: {
    weight: number;
    unit: 'kg' | 'lbs';
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
    restrictions: string[];
  };
  variants?: Array<{
    name: string;
    isDefault: boolean;
    options: Array<{
      value: string;
      sku?: string;
      price: number;
      salePrice?: number;
      quantity: number;
      isDefault: boolean;
      dimensions?: Record<string, string>;
    }>;
  }>;
  variantDimensions?: string[];
  combinations?: any[];
  isFeatured?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export class ProductFormValidator {
  static validateStep(step: number, data: Partial<ProductFormData>): ValidationResult {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    switch (step) {
      case 1:
        return this.validateBasicInfo(data, errors, warnings);
      case 2:
        return this.validateCategory(data, errors, warnings);
      case 3:
        return this.validateImages(data, errors, warnings);
      case 4:
        return this.validateVariants(data, errors, warnings);
      case 5:
        return this.validateShipping(data, errors, warnings);
      case 6:
        return this.validateListing(data, errors, warnings);
      default:
        return { isValid: true, errors: {}, warnings: {} };
    }
  }

  private static validateBasicInfo(
    data: Partial<ProductFormData>,
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): ValidationResult {
    console.log('Validating basic info with:', { 
      productName: data.productName, 
      name: data.name,
      brandName: data.brandName,
      brand: data.brand,
      description: data.description,
      condition: data.condition
    });

    // Handle both productName and name fields
    const productName = data.productName || data.name;
    if (!productName || productName.trim().length < 3) {
      errors.name = "Product name must be at least 3 characters";
    }
    if (productName && productName.length > 100) {
      errors.name = "Product name cannot exceed 100 characters";
    }

    // Handle both brandName and brand fields
    const brandName = data.brandName || data.brand;
    if (!brandName || brandName.trim().length < 1) {
      errors.brand = "Brand name is required";
    }

    if (!data.description || data.description.length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (data.description && data.description.length > 2000) {
      errors.description = "Description cannot exceed 2000 characters";
    }

    if (!data.condition) {
      errors.condition = "Product condition is required";
    }

    if (data.condition === 'used' && !data.conditionDescription) {
      warnings.conditionDescription = "Consider adding condition details for used items";
    }

    console.log('Basic info validation errors:', errors);
    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }

  private static validateCategory(
    data: Partial<ProductFormData>,
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): ValidationResult {
    // Handle both category formats
    const category = data.category || (data as any).category;
    if (!category || (typeof category === 'string' && !category.trim())) {
      errors.category = "Main category is required";
    }

    // Country is optional - remove validation
    // if (!data.country) {
    //   errors.country = "Country is required";
    // }

    // Handle specifications - check both formats and additional specifications
    const specs = data.specifications || (data as any).productSpecifications;
    const additionalSpecs = (data as any).additionalSpecifications;
    
    const hasSpecs = specs && (Array.isArray(specs) ? specs.length > 0 : Object.keys(specs).length > 0);
    const hasAdditionalSpecs = additionalSpecs && Object.keys(additionalSpecs).length > 0;
    
    if (!hasSpecs && !hasAdditionalSpecs) {
      errors.specifications = "At least one specification is required";
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }

  private static validateImages(
    data: Partial<ProductFormData>,
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): ValidationResult {
    if (!data.images || data.images.length === 0) {
      errors.images = "At least one image is required";
    }
    if (data.images && data.images.length > 10) {
      errors.images = "Maximum 10 images allowed";
    }

    if (data.images && data.images.length < 3) {
      warnings.images = "Consider adding more images for better visibility";
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }

  private static validateVariants(
    data: Partial<ProductFormData>,
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): ValidationResult {
    if (!data.variants || data.variants.length === 0) {
      errors.variants = "At least one variant is required";
    }

    if (data.variants) {
      const variantNames = new Set();
      let hasDefaultVariant = false;

      data.variants.forEach((variant, vIndex) => {
        if (variantNames.has(variant.name)) {
          errors[`variant_${vIndex}`] = `Duplicate variant name: ${variant.name}`;
        }
        variantNames.add(variant.name);

        if (variant.isDefault) hasDefaultVariant = true;

        if (!variant.options || variant.options.length === 0) {
          errors[`variant_${vIndex}_options`] = `Variant ${variant.name} must have options`;
        }

        if (variant.options) {
          const optionValues = new Set();
          let hasDefaultOption = false;

          variant.options.forEach((option, oIndex) => {
            if (optionValues.has(option.value)) {
              errors[`variant_${vIndex}_option_${oIndex}`] = `Duplicate option: ${option.value}`;
            }
            optionValues.add(option.value);

            if (option.isDefault) hasDefaultOption = true;

            if (!option.price || option.price < 0.01) {
              errors[`variant_${vIndex}_option_${oIndex}_price`] = "Price must be at least $0.01";
            }

            if (option.salePrice && option.salePrice >= option.price) {
              errors[`variant_${vIndex}_option_${oIndex}_sale`] = "Sale price must be less than regular price";
            }

            if (option.quantity === undefined || option.quantity < 0) {
              errors[`variant_${vIndex}_option_${oIndex}_quantity`] = "Quantity cannot be negative";
            }
          });

          if (variant.isDefault && !hasDefaultOption) {
            errors[`variant_${vIndex}_default`] = "Default variant must have a default option";
          }
        }
      });

      if (!hasDefaultVariant) {
        errors.variants_default = "At least one variant must be marked as default";
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }

  private static validateShipping(
    data: Partial<ProductFormData>,
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): ValidationResult {
    if (!data.shipping?.weight || data.shipping.weight < 0.01) {
      errors.weight = "Weight must be at least 0.01";
    }
    if (data.shipping?.weight && data.shipping.weight > 500) {
      errors.weight = "Weight cannot exceed 500";
    }

    const dimensions = data.shipping?.dimensions;
    if (dimensions) {
      ['length', 'width', 'height'].forEach(dim => {
        const value = dimensions[dim as keyof typeof dimensions];
        if (value !== undefined && value !== null && value !== 0) {
          if (value < 0.1 || value > 200) {
            errors[dim] = `${dim} must be between 0.1 and 200`;
          }
        }
      });
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }

  private static validateListing(
    data: Partial<ProductFormData>,
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): ValidationResult {
    if (!data.inventory?.listing?.type) {
      errors.listingType = "Listing type is required";
      return { isValid: false, errors, warnings };
    }

    if (data.inventory.listing.type === 'auction') {
      const auction = data.inventory.listing.auction;
      if (!auction) {
        errors.auction = "Auction details are required";
        return { isValid: false, errors, warnings };
      }

      if (!auction.startBidPrice || auction.startBidPrice < 0.01) {
        errors.startBidPrice = "Start bid price must be at least $0.01";
      }

      if (!auction.reservePrice || auction.reservePrice < auction.startBidPrice) {
        errors.reservePrice = "Reserve price must be greater than or equal to start bid price";
      }

      if (!auction.startTime) {
        errors.startTime = "Auction start time is required";
      } else {
        const startDate = new Date(auction.startTime);
        if (startDate <= new Date()) {
          errors.startTime = "Auction start time must be in the future";
        }
      }

      if (!auction.endTime) {
        errors.endTime = "Auction end time is required";
      } else if (auction.startTime) {
        const startDate = new Date(auction.startTime);
        const endDate = new Date(auction.endTime);
        if (endDate <= startDate) {
          errors.endTime = "Auction end time must be after start time";
        }

        const minDuration = 24 * 60 * 60 * 1000; // 24 hours
        if (endDate.getTime() - startDate.getTime() < minDuration) {
          errors.duration = "Auction duration must be at least 24 hours";
        }
      }

      if (!auction.bidIncrement || auction.bidIncrement < 1) {
        errors.bidIncrement = "Bid increment must be at least $1";
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }

  static validateComplete(data: ProductFormData): ValidationResult {
    const allErrors: Record<string, string> = {};
    const allWarnings: Record<string, string> = {};

    for (let step = 1; step <= 6; step++) {
      const result = this.validateStep(step, data);
      Object.assign(allErrors, result.errors);
      Object.assign(allWarnings, result.warnings);
    }

    return { isValid: Object.keys(allErrors).length === 0, errors: allErrors, warnings: allWarnings };
  }
}