import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useCategories } from "@/hooks/queries";
import { useCountries } from "@/hooks/useCountries";
import { ProductMapper } from "@/utils/productMapper";

export const useProductMapper = () => {
  const { productDetails } = useProductListing();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];
  const { data: countries } = useCountries();

  console.log('Mapping product details:', productDetails);

  const country = countries?.find(
    (country) =>
      country.name === productDetails.shippingDetails?.productLocation
  );

  // Find category IDs by name
  const findCategoryIdByName = (name: string) => {
    const category = categories.find((cat: any) => cat.name === name);
    return category?._id || null;
  };

  const mapProductDetailsToSchema = () => {
    console.log('Raw product details for mapping:', productDetails);
    
    // Use the comprehensive ProductMapper with fallback to legacy mapping
    try {
      const mappedData = ProductMapper.mapToBackendSchema(productDetails);
      
      // Override with specific ID mappings from your existing logic
      const mainCategoryId = findCategoryIdByName(productDetails.category);
      const subCategoryIds = [
        productDetails.subCategory,
        productDetails.subCategory2,
        productDetails.subCategory3,
        productDetails.subCategory4,
        productDetails.subCategory5,
      ]
        .filter(Boolean)
        .map(findCategoryIdByName)
        .filter(Boolean);

      const subcategoryNames = [
        productDetails.subCategory5,
        productDetails.subCategory4,
        productDetails.subCategory3,
        productDetails.subCategory2,
        productDetails.subCategory,
      ].find(Boolean);

      const deepestCategory = subcategoryNames
        ? categories.find((cat: any) => cat.name === subcategoryNames)
        : categories.find((cat: any) => cat.name === productDetails.category);

      const categoryPath = deepestCategory?.path || [];
      
      // Override category and country with IDs
      mappedData.category = {
        main: mainCategoryId,
        sub: subCategoryIds,
        path: categoryPath,
      };
      mappedData.country = country?._id!;
      
      // Handle specifications mapping
      if (productDetails.productSpecifications) {
        mappedData.specifications = Array.isArray(productDetails.productSpecifications)
          ? productDetails.productSpecifications.map((spec: any) => ({
              key: spec.key || spec.name,
              value: String(spec.value),
            }))
          : Object.entries(productDetails.productSpecifications).map(
              ([key, value]) => ({
                key,
                value: String(value),
              })
            );
      }
      
      console.log('Mapped data:', mappedData);
      return mappedData;
    } catch (error) {
      console.error('Error in comprehensive mapping, falling back to legacy:', error);
      
      // Fallback to your original mapping logic
      const mainCategoryId = findCategoryIdByName(productDetails.category);
      const subCategoryIds = [
        productDetails.subCategory,
        productDetails.subCategory2,
        productDetails.subCategory3,
        productDetails.subCategory4,
        productDetails.subCategory5,
      ]
        .filter(Boolean)
        .map(findCategoryIdByName)
        .filter(Boolean);

      const subcategoryNames = [
        productDetails.subCategory5,
        productDetails.subCategory4,
        productDetails.subCategory3,
        productDetails.subCategory2,
        productDetails.subCategory,
      ].find(Boolean);

      const deepestCategory = subcategoryNames
        ? categories.find((cat: any) => cat.name === subcategoryNames)
        : categories.find((cat: any) => cat.name === productDetails.category);

      const categoryPath = deepestCategory?.path || [];
      
      return {
        name: productDetails.productName,
        brand: productDetails.brandName,
        description: productDetails.description,
        condition: productDetails.condition?.toLowerCase() as "new" | "used" | "refurbished",
        conditionDescription: productDetails.conditionDescription,
        category: {
          main: mainCategoryId,
          sub: subCategoryIds,
          path: categoryPath,
        },
        country: country?._id!,
        inventory: {
          lowStockAlert: 2,
          listing: {
            type: productDetails.pricingInformation?.listingType === "auction" ? "auction" : "instant",
            instant: productDetails.pricingInformation?.listingType === "instantSale" ? {
              acceptOffer: Boolean(productDetails.pricingInformation?.instantSale?.acceptOffer),
            } : undefined,
            auction: productDetails.pricingInformation?.listingType === "auction" ? {
              startBidPrice: Number(productDetails.pricingInformation?.auction?.startPrice),
              reservePrice: Number(productDetails.pricingInformation?.auction?.reservePrice),
              buyNowPrice: productDetails.pricingInformation?.auction?.buyNowPrice ? Number(productDetails.pricingInformation?.auction?.buyNowPrice) : undefined,
              startTime: new Date(productDetails.pricingInformation?.auction?.startTime),
              endTime: new Date(productDetails.pricingInformation?.auction?.endTime),
              quantity: Number(productDetails.pricingInformation?.storeQuantity),
              bidIncrement: 1.0,
            } : undefined,
          },
        },
        images: productDetails.images || [],
        specifications: productDetails.productSpecifications
          ? Array.isArray(productDetails.productSpecifications)
            ? productDetails.productSpecifications.map((spec: any) => ({
                key: spec.key || spec.name,
                value: String(spec.value),
              }))
            : Object.entries(productDetails.productSpecifications).map(
                ([key, value]) => ({
                  key,
                  value: String(value),
                })
              )
          : [],
        shipping: {
          weight: Number(productDetails.shippingDetails?.productWeight) || 0,
          unit: (productDetails.shippingDetails?.weightUnit as "kg" | "lbs") || "kg",
          dimensions: {
            length: Number(productDetails.shippingDetails?.productDimensions?.length) || 0,
            width: Number(productDetails.shippingDetails?.productDimensions?.width) || 0,
            height: Number(productDetails.shippingDetails?.productDimensions?.height) || 0,
          },
          restrictions: ["none"],
        },
        variants: productDetails.variants?.map((variant: any, index: number) => ({
          name: variant.name,
          isDefault: variant.isDefault || index === 0,
          options: variant.options.map((option: any, optionIndex: number) => ({
            value: option.value,
            price: Number(option.price),
            salePrice: Number(option.salePrice || option.price),
            quantity: Number(option.quantity),
            sku: option.sku || `${variant.name?.substring(0, 3).toUpperCase() || "VAR"}-${option.value?.substring(0, 3).toUpperCase() || "OPT"}-${Date.now()}`,
            isDefault: option.isDefault || optionIndex === 0,
          })),
        })),
      };
    }
  };
  return { mapProductDetailsToSchema };
};
