"use client";

import React, { useState, useEffect } from 'react';
import { X, Star, Heart, MessageSquare } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productDetails: any;
  isSubmitting?: boolean;
}

export default function ProductPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  productDetails,
  isSubmitting = false
}: ProductPreviewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [variantIndex: number]: number }>({});
  
  // All hooks must be called before any conditional returns (React Rules of Hooks)
  const { user } = useUserStore();
  const { vendor } = useVendorStore();
  
  // Get vendor's currency symbol for display
  const getVendorCurrencySymbol = () => {
    const currency = vendor?.wallet?.currency || 'USD';
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'ZAR': 'R',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'KES': 'KSh',
      'GHS': '₵',
    };
    return currencySymbols[currency] || '$';
  };

  const currencySymbol = getVendorCurrencySymbol();

  // Initialize selected options when variants change
  useEffect(() => {
    if (productDetails?.variants?.length > 0) {
      const initial: { [variantIndex: number]: number } = {};
      productDetails.variants.forEach((_: any, variantIndex: number) => {
        initial[variantIndex] = 0; // Select first option by default
      });
      setSelectedOptions(initial);
    }
  }, [productDetails?.variants]);

  if (!isOpen) return null;

  const variants = productDetails?.variants || [];

  const getPrice = () => {
    if (productDetails.pricingInformation?.listingType === 'auction') {
      return productDetails.pricingInformation.auction?.startPrice || 0;
    }
    
    // If variants exist, get price from selected option
    if (variants.length > 0) {
      const firstVariant = variants[0];
      const selectedOptionIndex = selectedOptions[0] || 0;
      const selectedOption = firstVariant?.options?.[selectedOptionIndex];
      return selectedOption?.salePrice || selectedOption?.price || 0;
    }
    
    return productDetails.pricingInformation?.instantSale?.price || 0;
  };

  const getTotalQuantity = () => {
    if (variants.length > 0) {
      return variants.reduce((sum: number, variant: any) => {
        return sum + (variant.options?.reduce((optSum: number, option: any) => optSum + (option.quantity || 0), 0) || 0);
      }, 0);
    }
    return productDetails.pricingInformation?.storeQuantity || 1;
  };

  const isColorVariant = (variantName: string) => {
    return variantName?.toLowerCase().includes('color') || variantName?.toLowerCase().includes('colour');
  };

  const isSizeVariant = (variantName: string) => {
    return variantName?.toLowerCase().includes('size');
  };

  const isHexColor = (value: string) => {
    return /^#[0-9A-F]{6}$/i.test(value);
  };

  const getColorName = (value: string) => {
    const colorMap: Record<string, string> = {
      '#fee2e2': 'Light Red', '#fecaca': 'Light Red', '#ef4444': 'Red', '#dc2626': 'Dark Red',
      '#dbeafe': 'Light Blue', '#3b82f6': 'Blue', '#2563eb': 'Dark Blue',
      '#dcfce7': 'Light Green', '#22c55e': 'Green', '#16a34a': 'Dark Green',
      '#fef9c3': 'Light Yellow', '#facc15': 'Yellow',
      '#f3e8ff': 'Light Purple', '#a855f7': 'Purple',
      '#ffedd5': 'Light Orange', '#f97316': 'Orange',
      '#f3f4f6': 'Light Gray', '#6b7280': 'Gray', '#1f2937': 'Dark Gray',
      '#000000': 'Black', '#ffffff': 'White'
    };
    return colorMap[value?.toLowerCase()] || (isHexColor(value) ? 'Color' : value);
  };

  const renderVariantOptions = (variant: any, variantIndex: number) => {
    const selectedOptionIndex = selectedOptions[variantIndex] || 0;
    const variantName = variant.name || '';

    return (
      <div key={variantIndex} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-900 font-roboto">{variantName}</h3>
          {variant.options?.[selectedOptionIndex] && (
            <span className="text-xs text-green-600 font-medium font-roboto">
              {currencySymbol}{(variant.options[selectedOptionIndex].salePrice || variant.options[selectedOptionIndex].price || 0).toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {variant.options?.map((option: any, optionIndex: number) => {
            const isSelected = selectedOptionIndex === optionIndex;
            
            if (isColorVariant(variantName) || isHexColor(option.value)) {
              // Color option - render as circle
              const colorValue = isHexColor(option.value) ? option.value : null;
              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => setSelectedOptions(prev => ({ ...prev, [variantIndex]: optionIndex }))}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  title={`${getColorName(option.value)} - ${currencySymbol}${(option.salePrice || option.price || 0).toLocaleString()}`}
                >
                  {colorValue ? (
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: colorValue }} />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium">
                      {option.value?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            } else if (isSizeVariant(variantName)) {
              // Size option - render as pill
              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => setSelectedOptions(prev => ({ ...prev, [variantIndex]: optionIndex }))}
                  className={`px-3 py-1 border rounded-md text-xs font-medium transition-all font-roboto ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {option.value}
                </button>
              );
            } else {
              // Default option
              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => setSelectedOptions(prev => ({ ...prev, [variantIndex]: optionIndex }))}
                  className={`px-2 py-1 border rounded-md text-xs transition-all font-roboto ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {option.value}
                  <span className="ml-1 text-[10px] text-gray-500">
                    {currencySymbol}{(option.salePrice || option.price || 0).toLocaleString()}
                  </span>
                </button>
              );
            }
          })}
        </div>

        {/* Stock info */}
        {variant.options?.[selectedOptionIndex]?.quantity !== undefined && (
          <div className="text-[10px] text-gray-500 font-roboto">
            {variant.options[selectedOptionIndex].quantity > 0 ? (
              <span className="text-green-600">{variant.options[selectedOptionIndex].quantity} in stock</span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto font-roboto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center z-10">
          <h2 className="text-base font-semibold">Product Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* Product Images Section */}
            <div className="space-y-3 lg:col-span-2">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-56 md:h-72 lg:h-80 flex items-center justify-center overflow-hidden border border-gray-200">
                {productDetails.images?.[selectedImage] ? (
                  <img
                    src={productDetails.images[selectedImage]}
                    alt={productDetails.productName}
                    className="max-h-full max-w-full object-cover p-2"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">No image available</div>
                )}
                <div className="absolute top-3 right-3">
                  <Heart className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Thumbnail Images */}
              {productDetails.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {productDetails.images.map((image: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-16 h-14 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === i
                          ? "border-blue-500 ring-1 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img src={image} alt={productDetails.productName} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 lg:space-y-4 lg:col-span-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={16} className={i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"} />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">4.5 Seller Star Rating</span>
              </div>

              {/* Product Title */}
              <h1 className="text-base md:text-lg font-semibold text-gray-900">
                {productDetails.productName || 'Product Name'}
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-xs leading-relaxed">
                {productDetails.description || 'Product description'}
              </p>

              {/* Product Details Grid */}
              <div className="space-y-2 border-b border-gray-300 pb-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-blue-600 font-medium">{productDetails.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{getTotalQuantity()}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Condition:</span>
                    <span className="text-blue-600 font-medium">{productDetails.condition || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Brand:</span>
                    <span className="font-medium">{productDetails.brandName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Variants Display */}
              {productDetails.pricingInformation?.listingType !== 'auction' && variants.length > 0 && (
                <div className="space-y-4">
                  {variants.map((variant: any, variantIndex: number) => renderVariantOptions(variant, variantIndex))}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  {/* Price */}
                  <div>
                    <div className="text-lg md:text-xl font-semibold text-gray-900">
                      <NumericFormat
                        value={getPrice()}
                        displayType="text"
                        thousandSeparator={true}
                        prefix={currencySymbol}
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {productDetails.pricingInformation?.listingType === 'auction' ? 'Starting bid' : 'Buy now'}
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-xs">Wishlist</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-orange-300" />
                      <span className="text-gray-600 text-xs">Message</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                <button className="bg-white border-2 border-orange-300 text-orange-300 px-3 py-2 rounded-md text-sm font-medium sm:col-span-2">
                  Message
                </button>
                <button className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium sm:col-span-3">
                  {productDetails.pricingInformation?.listingType === 'auction' ? 'Place Bid' : 'Buy Now'}
                </button>
                <button className="bg-orange-400 text-white px-3 py-2 rounded-md text-sm font-medium sm:col-span-2">
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            Edit Product
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
