"use client";

import React, { useState } from "react";
import {
  Star,
  Shield,
  Truck,
  Headphones,
  CreditCard,

} from "lucide-react";
import { ProductType } from "@/types/product.type";
type ProductInfoProps = {
  productData: ProductType;
};

const ProductDetailsTabs: React.FC<ProductInfoProps> = ({ productData }) =>  {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: "Description" },
    { id: 1, label: "Specifications" },
    { id: 2, label: "Additional Information" },
  ];

  const getColorName = (value: string) => {
    const colorMap: Record<string, string> = {
      '#000000': 'Black',
      '#ffffff': 'White',
      '#ff0000': 'Red',
      '#0000ff': 'Blue',
      '#008000': 'Green',
      '#ffff00': 'Yellow',
      '#800080': 'Purple',
      '#ffc0cb': 'Pink',
      '#ffa500': 'Orange',
      '#808080': 'Gray',
      '#c0c0c0': 'Silver',
      '#ffd700': 'Gold'
    };
    
    const isHexColor = /^#[0-9A-F]{6}$/i.test(value);
    return isHexColor ? (colorMap[value.toLowerCase()] || 'Color') : value;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
            ? "text-yellow-400 fill-current opacity-50"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const DescriptionTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 ">
      {/* Description Column */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Description</h3>
        <div className="space-y-4 text-gray-600 leading-relaxed text-xs md:text-sm ">
          <p>
           {productData?.description}
          </p>
        
        </div>
      </div>

      {/* Features Column */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Features</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">Free 1 Year Warranty</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">
              Safe Shipping & Fasted Delivery
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">24/7 Customer support</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">Secure payment method</span>
          </div>
        </div>
      </div>

      {/* Product Details Column */}
      <div className="lg:col-span-1 px-3">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">
          Product Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-1">
            <span className="text-gray-600">Brand:</span>
            <span className="text-gray-900 font-medium">{productData?.brand}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-600">Condition:</span>
            <span className="text-gray-900 font-medium capitalize">{productData?.condition}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-600">SKU:</span>
            <span className="text-gray-900 font-medium">{productData?.inventory?.sku}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-gray-600">Category:</span>
            <span className="text-gray-900 font-medium">{productData?.category?.main?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SpecificationsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Product Specifications */}
      <div className="px-3">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Product Specifications</h3>
        <div className="space-y-3">
          {productData?.specifications?.map((spec) => (
            <div key={spec._id}>
              <span className="font-medium text-gray-900">{spec.key}:</span>
              <span className="text-gray-600 ml-2">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Information */}
      <div className="px-3">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Shipping Information</h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">Weight:</span>
            <span className="text-gray-600 ml-2">{productData?.shipping?.weight} {productData?.shipping?.unit}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Dimensions:</span>
            <span className="text-gray-600 ml-2">
              {productData?.shipping?.dimensions?.length} x {productData?.shipping?.dimensions?.width} x {productData?.shipping?.dimensions?.height} cm
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Restrictions:</span>
            <span className="text-gray-600 ml-2">{productData?.shipping?.restrictions?.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const AdditionalInfoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-3">
      {/* Product Analytics */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">
          Product Analytics
        </h3>
        <div className="space-y-3">
          {/* <div>
            <span className="font-medium text-gray-900">Views:</span>
            <span className="text-gray-600 ml-2">{productData?.analytics?.views?.toLocaleString()}</span>
          </div> */}
          <div>
            <span className="font-medium text-gray-900">Add to Cart:</span>
            <span className="text-gray-600 ml-2">{productData?.analytics?.addToCart}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Purchases:</span>
            <span className="text-gray-600 ml-2">{productData?.analytics?.purchases}</span>
          </div>
          {/* <div>
            <span className="font-medium text-gray-900">Conversion Rate:</span>
            <span className="text-gray-600 ml-2">{productData?.analytics?.conversionRate}%</span>
          </div> */}
        </div>
      </div>

      {/* Listing Information */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">
          Listing Information
        </h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-900">Listing Type:</span>
            <span className="text-gray-600 ml-2 capitalize">{productData?.inventory?.listing?.type}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Status:</span>
            <span className="text-gray-600 ml-2 capitalize">{productData?.status}</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Featured:</span>
            <span className="text-gray-600 ml-2">{productData?.isFeatured ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">Rating:</span>
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(productData?.rating || 0)}</div>
              <span className="text-sm text-gray-600 ml-1">
                {productData?.rating || 0} ({productData?.reviews?.length || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Information */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-4">Available Variants</h3>
        <div className="space-y-3">
          {productData?.variants?.map((variant) => (
            <div key={variant._id}>
              <h4 className="font-medium text-gray-900 mb-2">{variant.name}</h4>
              {variant.options?.map((option) => (
                <div key={option._id} className="ml-4 text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">{getColorName(option.value)}:</span>
                    <span className="text-gray-900 ml-2">
                      {(productData as any)?.priceInfo?.currencySymbol || '$'}
                      {(option.displayPrice || option.salePrice || option.price)?.toLocaleString()}
                    </span>
                    {option.salePrice && option.price !== option.salePrice && (
                      <span className="text-gray-500 line-through ml-2">
                        {(productData as any)?.priceInfo?.currencySymbol || '$'}
                        {((option.price || 0) * ((productData as any)?.priceInfo?.exchangeRate || 1))?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600">Qty: {option.quantity}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <DescriptionTab />;
      case 1:
        return <SpecificationsTab />;
      case 2:
        return <AdditionalInfoTab />;
      default:
        return <DescriptionTab />;
    }
  };

  return (
    <div className=" ">
      {/* Tab Navigation */}
      <div className="md:border">
        <div className="flex justify-center overflow-auto  gap-4 lg:gap-6 2xl:gap-8 mb-4 lg:mb-8 border-b border-gray-200 p-2 md:p-3 pl-4 md:pl-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-0.5 md:pb-1 px-1 font-medium text-base whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? "text-gray-900 border-b-2 border-orange-400"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className=" pt-2 pb-4 md:py-4">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ProductDetailsTabs;