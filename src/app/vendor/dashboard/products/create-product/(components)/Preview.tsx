import React, { useState } from "react";
import { ArrowLeft, Heart, Star, MessageSquare, Package, Tag, Truck, Loader2 } from "lucide-react";
import Image from "next/image";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useUserStore } from "@/stores/useUserStore";
import CategoryInfo from "./CategoryInfo";
import { useVendorStore } from "@/stores/useVendorStore";
import { NumericFormat } from "react-number-format";
import VariantDisplay from "@/components/VariantDisplay";
import { useProductMapper } from "./SubmitProduct";
import { useCreateProduct } from "@/hooks/useCreateProduct";
import { useDeleteDraft } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type Props = {
  onHide: () => void;
  onCreateProduct?: () => void;
};

type ImageProps = {
  containerStyle: string;
  height: number;
  width: number;
  imageStyle: string;
  imageSrc: string;
};

const ImageComp = ({
  containerStyle,
  height,
  width,
  imageStyle,
  imageSrc,
}: ImageProps) => {
  return (
    <div className={containerStyle}>
      <Image
        src={imageSrc}
        alt="product image"
        width={width}
        height={height}
        style={{ width: 'auto', height: 'auto' }}
        className={imageStyle}
      />
    </div>
  );
};

const StarRating = ({ rating }: { rating: number }) => {
  const decimalPart = rating % 1;

  return (
    <div className="flex items-center gap-1 mb-2">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, index) => {
          if (index < Math.floor(rating)) {
            return (
              <Star
                key={index}
                size={20}
                className="fill-yellow-400 text-yellow-400"
              />
            );
          } else if (index === Math.floor(rating) && decimalPart > 0) {
            return (
              <div key={index} className="relative">
                <Star size={20} className="text-gray-300" />
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${decimalPart * 100}%` }}
                >
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            );
          } else {
            return <Star key={index} size={20} className="text-gray-300" />;
          }
        })}
      </div>
      <span className="text-xs ml-1 text-gray-600 font-roboto">
        {rating.toFixed(1)} Seller Star Rating
      </span>
    </div>
  );
};

export const ProductInfo = ({
  title,
  value,
  colour,
}: {
  title: string;
  value?: string | number;
  colour?: string
}) => {
  return (
    <div className="flex gap-x-2 font-roboto">
      <p className="text-gray-600">{title}:</p>
      {value && <p className="text-[#002f7a] font-medium">{value}</p>}
      {colour && (<div className="border border-gray-300 size-4 rounded-full" style={{ backgroundColor: colour }} />)}
    </div>
  );
};

// Currency symbols mapping
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'NGN': '₦',
  'ZAR': 'R',
  'CAD': 'C$',
  'AUD': 'A$',
  'JPY': '¥',
  'CNY': '¥'
};

const Preview = (props: Props) => {
  const [activeTab, setActiveTab] = useState("Specifications");
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState(false);

  const { productDetails, draftId, resetProductDetails } = useProductListing();
  const { vendor } = useVendorStore();
  const { user } = useUserStore();
  const router = useRouter();
  
  // Product creation hooks
  const { mapProductDetailsToSchema } = useProductMapper();
  const createProductMutation = useCreateProduct();
  const deleteDraftMutation = useDeleteDraft();

  // Handle product creation
  const handleCreateProduct = async () => {
    setIsCreating(true);
    try {
      console.log('Starting product creation from preview...');
      const mappedData = mapProductDetailsToSchema();
      console.log('Mapped data for API:', mappedData);
      
      const result = await createProductMutation.mutateAsync(mappedData);
      console.log('API response:', result);
      
      if (result.success) {
        // Delete draft if exists
        if (draftId) {
          try {
            await deleteDraftMutation.mutateAsync(draftId);
            console.log('Draft deleted successfully');
          } catch (draftError) {
            console.error('Failed to delete draft:', draftError);
          }
        }
        
        toast.success('Product created successfully!');
        resetProductDetails();
        router.push('/vendor/dashboard/products');
      } else {
        toast.error(result.message || 'Failed to create product');
      }
    } catch (error: any) {
      console.error('Product creation error:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setIsCreating(false);
    }
  };

  // Get user's currency preference for display
  const getUserCurrency = () => {
    const currency = user?.preferences?.currency || 'NGN';
    return CURRENCY_SYMBOLS[currency] || '₦';
  };

  // Get the base price based on listing type
  const getBasePrice = () => {
    if (productDetails?.pricingInformation?.listingType === 'auction') {
      return productDetails.pricingInformation.auction?.startPrice || 0;
    }
    
    // For instant sale, check for sale price first
    if (productDetails?.pricingInformation?.instantSale?.salePrice > 0) {
      return productDetails.pricingInformation.instantSale.salePrice;
    }
    
    return productDetails?.pricingInformation?.instantSale?.price || 0;
  };

  // Get original price for discount display
  const getOriginalPrice = () => {
    if (productDetails?.pricingInformation?.instantSale?.salePrice > 0) {
      return productDetails.pricingInformation.instantSale.price;
    }
    return null;
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    const originalPrice = getOriginalPrice();
    const salePrice = productDetails?.pricingInformation?.instantSale?.salePrice;
    if (originalPrice && salePrice && originalPrice > salePrice) {
      return Math.round((1 - salePrice / originalPrice) * 100);
    }
    return 0;
  };

  // Get total quantity from variants or store quantity
  const getTotalQuantity = () => {
    if (productDetails?.variants?.length > 0) {
      return productDetails.variants.reduce((sum: number, variant: any) => {
        return sum + (variant.options?.reduce((optSum: number, option: any) => 
          optSum + (option.inventory || option.quantity || 0), 0) || 0);
      }, 0);
    }
    return productDetails?.pricingInformation?.storeQuantity || 0;
  };

  // Get selected variant price
  const getSelectedVariantPrice = () => {
    if (productDetails?.variants?.length > 0 && Object.keys(selectedOptions).length > 0) {
      for (const variant of productDetails.variants) {
        const selectedOptionId = selectedOptions[variant._id || variant.id || variant.name];
        if (selectedOptionId) {
          const option = variant.options?.find((opt: any) => 
            (opt._id || opt.id || opt.value) === selectedOptionId
          );
          if (option?.price) {
            return option.price;
          }
        }
      }
    }
    return getBasePrice();
  };

  const currentImages = productDetails.images || [];
  const hasVariants = productDetails?.variants?.length > 0;
  const isAuction = productDetails?.pricingInformation?.listingType === 'auction';
  const discountPercentage = getDiscountPercentage();

  return (
    <div className="bg-white rounded-xl pb-4 font-roboto">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-300">
        <div className="flex gap-x-2 items-center text-gray-500">
          <ArrowLeft
            size={16}
            className="cursor-pointer hover:text-[#002f7a]"
            onClick={props.onHide}
          />
          <p className="text-sm font-roboto">Preview product</p>
        </div>
        <span className="text-xs text-gray-400 font-roboto">This is how buyers will see your product</span>
      </div>

      {/* Main Preview Content */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 border border-gray-200 rounded-lg p-4 lg:p-6">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-64 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden border border-gray-200">
              {currentImages.length > 0 ? (
                <Image
                  src={currentImages[selectedImage]}
                  alt={productDetails?.productName || "Product"}
                  width={400}
                  height={400}
                  className="max-h-full max-w-full object-contain p-4"
                  style={{ width: 'auto', height: 'auto' }}
                />
              ) : (
                <div className="text-gray-400 font-roboto">No image available</div>
              )}
              
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                  -{discountPercentage}% OFF
                </div>
              )}
              
              {/* Wishlist Icon */}
              <div className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md">
                <Heart className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Thumbnail Images */}
            {currentImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {currentImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? "border-[#002f7a] ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-4">
            {/* Rating */}
            <StarRating rating={4.5} />

            {/* Product Name */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-roboto">
              {productDetails?.productName || "Product Name"}
            </h1>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed font-roboto">
              {productDetails?.description || "No description provided"}
            </p>

            {/* Product Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm border-b border-gray-200 pb-4">
              <ProductInfo
                title="Seller"
                value={vendor?.businessInfo?.name || "Not specified"}
              />
              <ProductInfo
                title="Brand"
                value={productDetails?.brandName || "Not specified"}
              />
              <ProductInfo
                title="Condition"
                value={productDetails?.condition || "Not specified"}
              />
              <ProductInfo
                title="Quantity"
                value={getTotalQuantity()}
              />
              {productDetails?.color && (
                <ProductInfo
                  title="Color"
                  colour={productDetails.color}
                />
              )}
              <div className="col-span-2">
                <CategoryInfo 
                  subCategory={
                    productDetails?.subCategory5 || 
                    productDetails?.subCategory4 || 
                    productDetails?.subCategory3 || 
                    productDetails?.subCategory2 || 
                    productDetails?.subCategory
                  } 
                />
              </div>
            </div>

            {/* Variants Section */}
            {hasVariants && !isAuction && (
              <div className="border-b border-gray-200 pb-4">
                <VariantDisplay
                  variants={productDetails.variants}
                  selectedOptions={selectedOptions}
                  onOptionChange={(variantId, optionId) => {
                    setSelectedOptions(prev => ({
                      ...prev,
                      [variantId]: optionId
                    }));
                  }}
                  currencySymbol={getUserCurrency()}
                  priceInfo={{
                    exchangeRate: 1,
                    currencySymbol: getUserCurrency()
                  }}
                />
              </div>
            )}

            {/* Price Section */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    <NumericFormat
                      value={getSelectedVariantPrice()}
                      displayType="text"
                      thousandSeparator={true}
                      prefix={getUserCurrency()}
                      decimalScale={2}
                      fixedDecimalScale={true}
                    />
                  </span>
                  {getOriginalPrice() && (
                    <span className="text-lg text-gray-400 line-through">
                      <NumericFormat
                        value={getOriginalPrice()}
                        displayType="text"
                        thousandSeparator={true}
                        prefix={getUserCurrency()}
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-roboto">
                  {isAuction ? 'Starting bid' : 'Buy now price'}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 flex justify-center items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
                  <Heart size={24} className="text-orange-400" />
                </div>
                <div className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-[#002f7a] transition-colors">
                  <MessageSquare size={20} className="text-orange-300" />
                  <span className="text-sm font-roboto">Message</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-12 gap-2 pt-2">
              <button className="col-span-12 md:col-span-3 px-4 py-3 rounded-lg text-sm border-2 border-[#F6B76F] text-[#F6B76F] hover:bg-[#F6B76F] hover:text-white transition-colors font-roboto font-medium">
                Message
              </button>
              <button className="col-span-12 md:col-span-6 px-4 py-3 rounded-lg text-sm bg-[#002f7a] text-white hover:bg-[#001f5a] transition-colors font-roboto font-medium">
                {isAuction ? 'Place Bid' : 'Buy Now'}
              </button>
              <button className="col-span-12 md:col-span-3 px-4 py-3 rounded-lg text-sm bg-[#F6B76F] text-white hover:bg-[#e5a65e] transition-colors font-roboto font-medium">
                Add To Cart
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border border-gray-200 rounded-lg mt-4">
          {/* Tab Headers */}
          <div className="flex justify-center items-center gap-x-4 border-b border-gray-200 py-3 text-sm text-gray-400 overflow-x-auto">
            {['Description', 'Specifications', 'Variants', 'Additional Information'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 whitespace-nowrap font-roboto transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-[#F6B76F] text-gray-900 font-medium"
                    : "hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === "Description" && (
              <div className="space-y-4">
                <p className="text-sm whitespace-pre-line text-gray-700 font-roboto leading-relaxed">
                  {productDetails?.description || "No description provided"}
                </p>
                {productDetails?.conditionDescription && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 font-roboto flex items-center gap-2">
                      <Tag size={16} className="text-[#002f7a]" />
                      Condition Description
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 font-roboto">
                      {productDetails.conditionDescription}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Specifications" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Specifications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 font-roboto flex items-center gap-2">
                    <Package size={16} className="text-[#002f7a]" />
                    Product Specifications
                  </h4>
                  {productDetails?.productSpecifications &&
                  Object.keys(productDetails.productSpecifications).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(productDetails.productSpecifications).map(
                        ([key, value], index) => (
                          <div key={index} className="grid grid-cols-[120px_1fr] gap-3 text-sm py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-roboto font-medium">{key}</span>
                            <span className="text-gray-900 font-roboto">{String(value)}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-roboto">No specifications added</p>
                  )}
                </div>

                {/* Additional Specifications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 font-roboto">
                    Additional Specifications
                  </h4>
                  {productDetails?.additionalSpecifications &&
                  Object.keys(productDetails.additionalSpecifications).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(productDetails.additionalSpecifications).map(
                        ([key, value], index) => (
                          <div key={index} className="grid grid-cols-[140px_1fr] gap-3 text-sm py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-roboto font-medium">{key}</span>
                            <span className="text-gray-900 font-roboto">{String(value)}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-roboto">No additional specifications added</p>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 font-roboto">
                    Quick Info
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-600 font-roboto">Brand</span>
                      <span className="text-gray-900 font-medium font-roboto">{productDetails?.brandName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-600 font-roboto">Condition</span>
                      <span className="text-gray-900 font-medium font-roboto">{productDetails?.condition || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-600 font-roboto">Stock</span>
                      <span className="text-gray-900 font-medium font-roboto">{getTotalQuantity()} units</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Variants" && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 font-roboto">
                  Available Variants
                </h4>
                {hasVariants ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productDetails.variants.map((variant: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h5 className="text-sm font-semibold text-[#002f7a] font-roboto mb-3">
                          {variant.name}
                        </h5>
                        <div className="space-y-2">
                          {variant.options?.map((option: any, optIndex: number) => (
                            <div
                              key={optIndex}
                              className="flex justify-between items-center text-sm py-2 px-3 bg-white rounded border border-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                {option.value?.startsWith('#') ? (
                                  <div 
                                    className="w-4 h-4 rounded-full border border-gray-300" 
                                    style={{ backgroundColor: option.value }}
                                  />
                                ) : null}
                                <span className="text-gray-700 font-roboto">{option.value}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  <NumericFormat
                                    value={option.price || 0}
                                    displayType="text"
                                    thousandSeparator={true}
                                    prefix={getUserCurrency()}
                                    decimalScale={2}
                                    fixedDecimalScale={true}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 font-roboto">
                                  Stock: {option.inventory || option.quantity || 0}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 font-roboto">No variants specified for this product</p>
                )}
              </div>
            )}

            {activeTab === "Additional Information" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 font-roboto flex items-center gap-2">
                    <Truck size={16} className="text-[#002f7a]" />
                    Shipping Details
                  </h4>
                  {productDetails?.shippingDetails ? (
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {productDetails.shippingDetails.productLocation && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Location</span>
                          <span className="text-gray-900 font-roboto">{productDetails.shippingDetails.productLocation}</span>
                        </div>
                      )}
                      {productDetails.shippingDetails.productWeight && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Weight</span>
                          <span className="text-gray-900 font-roboto">
                            {productDetails.shippingDetails.productWeight} {productDetails.shippingDetails.weightUnit || 'kg'}
                          </span>
                        </div>
                      )}
                      {productDetails.shippingDetails.productDimensions && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Dimensions</span>
                          <span className="text-gray-900 font-roboto">
                            {productDetails.shippingDetails.productDimensions.length || 0} × {productDetails.shippingDetails.productDimensions.width || 0} × {productDetails.shippingDetails.productDimensions.height || 0} {productDetails.shippingDetails.dimensionUnit || 'cm'}
                          </span>
                        </div>
                      )}
                      {productDetails.shippingDetails.restrictions && productDetails.shippingDetails.restrictions.length > 0 && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Restrictions</span>
                          <span className="text-gray-900 font-roboto">
                            {productDetails.shippingDetails.restrictions.join(', ')}
                          </span>
                        </div>
                      )}
                      {productDetails.shippingDetails.warranty?.status && (
                        <>
                          <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                            <span className="text-gray-600 font-roboto font-medium">Warranty</span>
                            <span className="text-gray-900 font-roboto">{productDetails.shippingDetails.warranty.status}</span>
                          </div>
                          {productDetails.shippingDetails.warranty.period && (
                            <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                              <span className="text-gray-600 font-roboto font-medium">Period</span>
                              <span className="text-gray-900 font-roboto">{productDetails.shippingDetails.warranty.period}</span>
                            </div>
                          )}
                          {productDetails.shippingDetails.warranty.returnPolicy && (
                            <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                              <span className="text-gray-600 font-roboto font-medium">Return Policy</span>
                              <span className="text-gray-900 font-roboto">{productDetails.shippingDetails.warranty.returnPolicy}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-roboto">No shipping details added</p>
                  )}
                </div>

                {/* SEO Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 font-roboto">
                    SEO Information
                  </h4>
                  {productDetails?.seoSettings && Object.keys(productDetails.seoSettings).length > 0 ? (
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {productDetails.seoSettings.metaTitle && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Meta Title</span>
                          <span className="text-gray-900 font-roboto">{productDetails.seoSettings.metaTitle}</span>
                        </div>
                      )}
                      {productDetails.seoSettings.metaDescription && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Meta Description</span>
                          <span className="text-gray-900 font-roboto">{productDetails.seoSettings.metaDescription}</span>
                        </div>
                      )}
                      {productDetails.seoSettings.keywords && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">Keywords</span>
                          <span className="text-gray-900 font-roboto">
                            {Array.isArray(productDetails.seoSettings.keywords) 
                              ? productDetails.seoSettings.keywords.join(', ')
                              : productDetails.seoSettings.keywords}
                          </span>
                        </div>
                      )}
                      {productDetails.seoSettings.slug && (
                        <div className="grid grid-cols-[120px_1fr] gap-3 text-sm py-1 border-b border-gray-100">
                          <span className="text-gray-600 font-roboto font-medium">URL Slug</span>
                          <span className="text-gray-900 font-roboto">{productDetails.seoSettings.slug}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-roboto">No SEO information added</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 w-full px-4 mt-4">
        <button
          className="w-full sm:w-auto px-8 border-2 border-[#002f7a] p-2 text-sm text-[#002f7a] rounded-lg hover:cursor-pointer hover:text-white hover:bg-[#002f7a] transition-colors font-roboto font-medium"
          onClick={props.onHide}
          disabled={isCreating}
        >
          Back to Edit
        </button>
        <button
          className="w-full sm:w-auto px-8 bg-[#002f7a] p-2 text-sm text-white rounded-lg hover:cursor-pointer hover:bg-[#001f5a] transition-colors font-roboto font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={handleCreateProduct}
          disabled={isCreating || createProductMutation.isPending}
        >
          {isCreating || createProductMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating...
            </>
          ) : (
            'Create Product'
          )}
        </button>
      </div>
    </div>
  );
};

export default Preview;
