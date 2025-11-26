"use client";

import React, { useState } from 'react';
import { X, Star, Heart, MessageSquare } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import VariantDisplay from './VariantDisplay';
import { useUserStore } from '@/stores/useUserStore';

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
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const { user } = useUserStore();
  
  // Get user's currency preference
  const getUserCurrency = () => {
    const currency = user?.preferences?.currency || 'USD';
    const currencySymbols: { [key: string]: string } = {
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
    return currencySymbols[currency] || '$';
  };

  // Mock data for preview
  const mockProduct = {
    name: productDetails.productName || 'Product Name',
    description: productDetails.description || 'Product description',
    images: productDetails.images || [],
    rating: 4.5,
    category: { main: { name: productDetails.category } },
    _id: 'preview-id',
    variants: productDetails.variants || [],
    inventory: {
      listing: {
        type: productDetails.pricingInformation?.listingType === 'auction' ? 'auction' : 'instant'
      }
    },
    priceInfo: {
      currencySymbol: getUserCurrency(),
      exchangeRate: 1
    }
  };

  const getPrice = () => {
    if (productDetails.pricingInformation?.listingType === 'auction') {
      return productDetails.pricingInformation.auction?.startPrice || 0;
    }
    return productDetails.pricingInformation?.instantSale?.price || 0;
  };

  const getTotalQuantity = () => {
    if (productDetails.variants?.length > 0) {
      return productDetails.variants.reduce((sum: number, variant: any) => {
        return sum + variant.options.reduce((optSum: number, option: any) => optSum + (option.quantity || 0), 0);
      }, 0);
    }
    return productDetails.pricingInformation?.storeQuantity || 1;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Product Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Product Images Section */}
            <div className="space-y-4 lg:col-span-2">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-64 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden border border-gray-200">
                {mockProduct.images?.[selectedImage] ? (
                  <img
                    src={mockProduct.images[selectedImage]}
                    alt={mockProduct.name}
                    className="max-h-full max-w-full object-cover p-3"
                  />
                ) : (
                  <div className="text-gray-400">No image available</div>
                )}
                <div className="absolute top-4 right-4">
                  <Heart className="w-6 h-6 text-gray-400" />
                </div>
              </div>

              {/* Thumbnail Images */}
              {mockProduct.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {mockProduct.images.map((image: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === i
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={mockProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 lg:space-y-6 lg:col-span-3">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(mockProduct.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {mockProduct.rating} Seller Star Rating
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
                {mockProduct.name}
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                {mockProduct.description}
              </p>

              {/* Product Details Grid */}
              <div className="space-y-3 border-b border-gray-400 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-blue-600 font-medium">
                      {mockProduct.category?.main?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Quantity Left:</span>
                    <span className="font-medium">{getTotalQuantity()}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Condition:</span>
                    <span className="text-blue-600 font-medium">
                      {productDetails.condition || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between sm:flex-col">
                    <span className="text-gray-600">Brand:</span>
                    <span className="font-medium">{productDetails.brandName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Variants Display */}
              {mockProduct.inventory?.listing?.type !== "auction" && mockProduct.variants?.length > 0 && (
                <div className="space-y-6">
                  <VariantDisplay
                    variants={mockProduct.variants}
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

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  {/* Price */}
                  <div>
                    <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">
                      <NumericFormat
                        value={getPrice()}
                        displayType="text"
                        thousandSeparator={true}
                        prefix={getUserCurrency()}
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      {mockProduct.inventory?.listing?.type === 'auction' ? 'Starting bid' : 'Buy now'}
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 text-sm">Add to Wishlist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-orange-300" />
                      <span className="text-gray-600 text-sm">Message Seller</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                <button className="bg-white border-2 border-orange-300 text-orange-300 px-4 py-3 rounded-lg font-medium sm:col-span-2">
                  Message
                </button>
                <button className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium sm:col-span-3">
                  {mockProduct.inventory?.listing?.type === 'auction' ? 'Place Bid' : 'Buy Now'}
                </button>
                <button className="bg-orange-400 text-white px-4 py-3 rounded-lg font-medium sm:col-span-2">
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit Product
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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