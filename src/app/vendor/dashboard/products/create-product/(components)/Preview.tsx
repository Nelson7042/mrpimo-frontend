import React, { useState } from "react";
import { ArrowLeft, Heart, Star, MessageSquare, Package, Tag, Truck } from "lucide-react";
import Image from "next/image";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useUserStore } from "@/stores/useUserStore";
import CategoryInfo from "./CategoryInfo";
import { useVendorStore } from "@/stores/useVendorStore";
import { NumericFormat } from "react-number-format";
import VariantDisplay from "@/components/VariantDisplay";

type Props = {
  onHide: () => void;
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

  const { productDetails } = useProductListing();
  const { vendor } = useVendorStore();
  const { user } = useUserStore();

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
                          <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                            <span className="text-gray-600 font-roboto">{key}</span>
                            <span className="text-gray-900 font-medium font-roboto">{String(value)}</span>
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
                          <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                            <span className="text-gray-600 font-roboto">{key}</span>
                            <span className="text-gray-900 font-medium font-roboto">{String(value)}</span>
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
                      {Object.entries(productDetails.shippingDetails).map(
                        ([key, value], index) => (
                          <div key={index} className="text-sm">
                            <span className="text-gray-600 font-roboto font-medium">{key}: </span>
                            {typeof value === "object" && value !== null ? (
                              <div className="ml-4 mt-1 space-y-1">
                                {Object.entries(value).map(
                                  ([subKey, subValue], subIndex) =>
                                    subValue !== null &&
                                    subValue !== undefined &&
                                    subValue !== "" && (
                                      <div key={subIndex} className="text-xs text-gray-500 font-roboto">
                                        {subKey}: {String(subValue)}
                                      </div>
                                    )
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-900 font-roboto">{String(value)}</span>
                            )}
                          </div>
                        )
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
                  {productDetails?.seoSettings ? (
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      {Object.entries(productDetails.seoSettings).map(
                        ([key, value], index) => (
                          <div key={index} className="text-sm py-1">
                            <span className="text-gray-600 font-roboto font-medium">{key}: </span>
                            <span className="text-gray-900 font-roboto">{String(value)}</span>
                          </div>
                        )
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
      <div className="text-center md:text-end w-full px-4">
        <button
          className="w-full md:w-auto px-8 border-2 border-[#002f7a] p-2 text-sm text-[#002f7a] rounded-lg hover:cursor-pointer hover:text-white hover:bg-[#002f7a] transition-colors font-roboto font-medium"
          onClick={props.onHide}
        >
          Back to Edit
        </button>
      </div>
    </div>
  );
};

export default Preview;
