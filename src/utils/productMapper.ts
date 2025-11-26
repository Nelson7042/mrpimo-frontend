import { VariantCombinationUtil } from './variantCombinations';

export class ProductMapper {
  static mapToBackendSchema(productDetails: any) {
    console.log('=== MAPPER CALLED ===');
    console.log('ProductDetails.shippingDetails:', productDetails.shippingDetails);
    console.log('Full productDetails keys:', Object.keys(productDetails));
    
    const mapped: any = {
      name: productDetails.productName,
      brand: productDetails.brandName,
      description: productDetails.description,
      condition: productDetails.condition?.toLowerCase(),
      conditionDescription: productDetails.conditionDescription,
      category: {
        main: productDetails.category,
        sub: productDetails.subCategories || [],
      },
      country: productDetails.country,
      images: productDetails.images || [],
      specifications: this.mapSpecifications(productDetails.productSpecifications, productDetails.additionalSpecifications),
      shipping: this.mapShipping(productDetails['shippingDetails']),
      inventory: this.mapInventory(productDetails),
      variants: this.mapVariants(productDetails),
      variantDimensions: productDetails.variantDimensions,
      combinations: productDetails.combinations,
    };

    // Handle featured product
    if (productDetails.isFeatured) {
      mapped.isFeatured = true;
      mapped.featuredCategory = productDetails.featuredCategory;
    }

    return mapped;
  }

  private static mapSpecifications(productSpecifications: any = {}, additionalSpecifications: any = {}) {
    const specs = [];
    
    // Add product specifications
    Object.entries(productSpecifications).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        specs.push({
          key,
          value: value.toString()
        });
      }
    });
    
    // Add additional specifications
    Object.entries(additionalSpecifications).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        specs.push({
          key,
          value: value.toString()
        });
      }
    });
    
    return specs;
  }

  private static mapShipping(shippingDetails: any) {
    console.log('=== mapShipping called with ===:', shippingDetails);
    
    if (!shippingDetails) {
      console.log('!!! No shipping details provided, returning default !!!');
      return {
        weight: 0.01,
        unit: 'kg',
        dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
        restrictions: ['none'],
      };
    }

    const weight = parseFloat(shippingDetails.productWeight);
    console.log('Mapping shipping details:', {
      productWeight: shippingDetails.productWeight,
      parsedWeight: weight,
      finalWeight: Math.max(weight || 0.01, 0.01),
      dimensions: shippingDetails.productDimensions,
      dimensionUnit: shippingDetails.dimensionUnit
    });

    return {
      weight: Math.max(weight || 0.01, 0.01),
      unit: shippingDetails.weightUnit || 'kg',
      dimensions: {
        length: parseFloat(shippingDetails.productDimensions?.length) || 0,
        width: parseFloat(shippingDetails.productDimensions?.width) || 0,
        height: parseFloat(shippingDetails.productDimensions?.height) || 0,
        unit: shippingDetails.dimensionUnit || 'cm',
      },
      restrictions: shippingDetails.restrictions || ['none'],
    };
  }

  private static mapInventory(productDetails: any) {
    const pricingInfo = productDetails.pricingInformation;
    if (!pricingInfo) return null;

    const inventory: any = {
      listing: {
        type: pricingInfo.listingType === 'auction' ? 'auction' : 'instant',
      },
    };

    if (pricingInfo.listingType === 'auction') {
      inventory.listing.auction = {
        startBidPrice: parseFloat(pricingInfo.auction?.startPrice) || 0,
        reservePrice: parseFloat(pricingInfo.auction?.reservePrice) || 0,
        buyNowPrice: pricingInfo.auction?.buyNowPrice ? parseFloat(pricingInfo.auction.buyNowPrice) : undefined,
        startTime: new Date(pricingInfo.auction?.startTime),
        endTime: new Date(pricingInfo.auction?.endTime),
        bidIncrement: parseFloat(pricingInfo.auction?.bidIncrement) || 1,
        quantity: parseInt(pricingInfo.storeQuantity) || 1,
      };
    } else {
      inventory.listing.instant = {
        acceptOffer: pricingInfo.instantSale?.acceptOffers || false,
      };
    }

    return inventory;
  }

  private static mapVariants(productDetails: any) {
    // Handle combination-based variants
    if (productDetails.combinations && productDetails.variantDimensions) {
      const processedCombinations = VariantCombinationUtil.processCombinations(
        productDetails.combinations,
        productDetails.productName || 'Product'
      );

      return [{
        name: productDetails.variantDimensions.join(' & '),
        isDefault: true,
        options: processedCombinations,
      }];
    }

    // Handle legacy variants
    if (productDetails.variants && productDetails.variants.length > 0) {
      return productDetails.variants.map((variant: any) => ({
        name: variant.name,
        isDefault: variant.isDefault || false,
        options: variant.options?.map((option: any) => ({
          value: option.value,
          sku: option.sku,
          price: parseFloat(option.price) || 0,
          salePrice: option.salePrice ? parseFloat(option.salePrice) : undefined,
          quantity: parseInt(option.quantity) || 0,
          isDefault: option.isDefault || false,
          dimensions: option.dimensions || {},
        })) || [],
      }));
    }

    // Create default variant from pricing information
    const pricingInfo = productDetails.pricingInformation;
    if (pricingInfo && pricingInfo.listingType === 'instantSale') {
      const colors = pricingInfo.instantSale?.colors || [];
      
      if (colors.length > 0) {
        return [{
          name: 'Colour',
          isDefault: true,
          options: [{
            value: colors[0],
            sku: `COL-${colors[0].replace('#', '')}-${Date.now()}`,
            price: parseFloat(pricingInfo.instantSale?.price) || 0,
            salePrice: pricingInfo.instantSale?.salePrice ? parseFloat(pricingInfo.instantSale.salePrice) : undefined,
            quantity: parseInt(pricingInfo.storeQuantity) || 0,
            isDefault: true,
            dimensions: {},
          }],
        }];
      }
      
      return [{
        name: 'Default',
        isDefault: true,
        options: [{
          value: 'Standard',
          sku: `DEF-STD-${Date.now()}`,
          price: parseFloat(pricingInfo.instantSale?.price) || 0,
          salePrice: pricingInfo.instantSale?.salePrice ? parseFloat(pricingInfo.instantSale.salePrice) : undefined,
          quantity: parseInt(pricingInfo.storeQuantity) || 0,
          isDefault: true,
          dimensions: {},
        }],
      }];
    }

    return [];
  }

  static validateMappedData(mappedData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!mappedData.name) errors.push('Product name is required');
    if (!mappedData.brand) errors.push('Brand name is required');
    if (!mappedData.description) errors.push('Description is required');
    if (!mappedData.condition) errors.push('Condition is required');
    if (!mappedData.category?.main) errors.push('Main category is required');
    if (!mappedData.country) errors.push('Country is required');
    if (!mappedData.images || mappedData.images.length === 0) errors.push('At least one image is required');
    if (!mappedData.shipping) errors.push('Shipping information is required');
    if (!mappedData.inventory?.listing?.type) errors.push('Listing type is required');

    // Variants validation
    if (!mappedData.variants || mappedData.variants.length === 0) {
      errors.push('At least one variant is required');
    } else {
      mappedData.variants.forEach((variant: any, vIndex: number) => {
        if (!variant.options || variant.options.length === 0) {
          errors.push(`Variant ${vIndex + 1} must have at least one option`);
        } else {
          variant.options.forEach((option: any, oIndex: number) => {
            if (!option.sku) {
              errors.push(`Variant ${vIndex + 1}, Option ${oIndex + 1}: SKU is required`);
            }
            if (!option.price || option.price <= 0) {
              errors.push(`Variant ${vIndex + 1}, Option ${oIndex + 1}: Price must be greater than 0`);
            }
            if (option.quantity === undefined || option.quantity < 0) {
              errors.push(`Variant ${vIndex + 1}, Option ${oIndex + 1}: Quantity cannot be negative`);
            }
          });
        }
      });
    }

    // Auction-specific validation
    if (mappedData.inventory?.listing?.type === 'auction') {
      const auction = mappedData.inventory.listing.auction;
      if (!auction) {
        errors.push('Auction details are required for auction listings');
      } else {
        if (!auction.startBidPrice || auction.startBidPrice <= 0) {
          errors.push('Start bid price must be greater than 0');
        }
        if (!auction.reservePrice || auction.reservePrice < auction.startBidPrice) {
          errors.push('Reserve price must be greater than or equal to start bid price');
        }
        if (!auction.startTime || !auction.endTime) {
          errors.push('Auction start and end times are required');
        } else {
          const startDate = new Date(auction.startTime);
          const endDate = new Date(auction.endTime);
          if (startDate >= endDate) {
            errors.push('Auction end time must be after start time');
          }
          if (startDate <= new Date()) {
            errors.push('Auction start time must be in the future');
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static mapFromBackendSchema(backendData: any) {
    return {
      productName: backendData.name,
      brandName: backendData.brand,
      description: backendData.description,
      condition: backendData.condition,
      conditionDescription: backendData.conditionDescription,
      category: backendData.category?.main,
      subCategories: backendData.category?.sub || [],
      country: backendData.country,
      images: backendData.images || [],
      specifications: backendData.specifications?.map((spec: any) => ({
        name: spec.key,
        value: spec.value,
      })) || [],
      shippingDetails: backendData.shipping ? {
        weight: backendData.shipping.weight,
        unit: backendData.shipping.unit,
        length: backendData.shipping.dimensions?.length,
        width: backendData.shipping.dimensions?.width,
        height: backendData.shipping.dimensions?.height,
        restrictions: backendData.shipping.restrictions,
      } : null,
      variants: backendData.variants || [],
      variantDimensions: backendData.variantDimensions,
      combinations: backendData.combinations,
      pricingInformation: this.mapPricingFromBackend(backendData),
      isFeatured: backendData.isFeatured,
      featuredCategory: backendData.featuredCategory,
    };
  }

  private static mapPricingFromBackend(backendData: any) {
    const inventory = backendData.inventory;
    if (!inventory) return null;

    const pricing: any = {
      listingType: inventory.listing.type === 'auction' ? 'auction' : 'instantSale',
    };

    if (inventory.listing.type === 'auction' && inventory.listing.auction) {
      pricing.auction = {
        startPrice: inventory.listing.auction.startBidPrice,
        reservePrice: inventory.listing.auction.reservePrice,
        buyNowPrice: inventory.listing.auction.buyNowPrice,
        startTime: inventory.listing.auction.startTime,
        endTime: inventory.listing.auction.endTime,
        bidIncrement: inventory.listing.auction.bidIncrement,
      };
      pricing.storeQuantity = inventory.listing.auction.quantity;
    } else if (backendData.variants && backendData.variants.length > 0) {
      // Extract pricing from first variant option
      const firstVariant = backendData.variants[0];
      const firstOption = firstVariant.options?.[0];
      if (firstOption) {
        pricing.instantSale = {
          price: firstOption.price,
          salePrice: firstOption.salePrice,
          acceptOffers: inventory.listing.instant?.acceptOffer || false,
        };
        pricing.storeQuantity = firstOption.quantity;
      }
    }

    return pricing;
  }
}