"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useBanners, useBannerTracking, Banner } from '@/hooks/useBanner';

interface PromoBannerProps {
  banner: Banner;
  position: 'left' | 'right';
  onBannerClick: (bannerId: string) => void;
}

const PromoBanner = ({ banner, position, onBannerClick }: PromoBannerProps) => {
  const product = banner.products?.[0];
  const isAuction = product?.inventory?.listing?.type === 'auction';
  
  // Get price display
  const getPriceDisplay = () => {
    if (!product) return null;
    
    if (isAuction) {
      // For auction products, always show the starting bid price
      const auction = product.inventory?.listing?.auction;
      const startBidPrice = auction?.startBidPrice || 0;
      
      // Use the exchange rate from priceInfo if available for currency conversion
      const exchangeRate = product.priceInfo?.exchangeRate || 1;
      const currencySymbol = product.priceInfo?.currencySymbol || '₦';
      const convertedPrice = startBidPrice * exchangeRate;
      
      // Format large numbers (e.g., 200000 -> 200K)
      const formatPrice = (price: number) => {
        if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`;
        if (price >= 1000) return `${Math.round(price / 1000)}K`;
        return price.toLocaleString();
      };
      return `Starting ${currencySymbol}${formatPrice(convertedPrice)}`;
    }
    
    // For instant sale products, use priceInfo
    if (product.priceInfo) {
      return `${product.priceInfo.currencySymbol}${product.priceInfo.displayPrice?.toLocaleString()}`;
    }
    
    // Fallback to variants
    const firstVariant = product.variants?.[0];
    const firstOption = firstVariant?.options?.[0];
    const price = firstOption?.salePrice || firstOption?.price || 0;
    return `₦${price.toLocaleString()}`;
  };

  // Calculate discount percentage: (price - salePrice) / price * 100
  const getDiscountPercentage = () => {
    if (!product || isAuction) return null;
    
    const firstVariant = product.variants?.[0];
    const firstOption = firstVariant?.options?.[0];
    if (firstOption?.price > 0 && firstOption?.salePrice > 0 && firstOption.salePrice < firstOption.price) {
      const discount = Math.round(((firstOption.price - firstOption.salePrice) / firstOption.price) * 100);
      return `${discount}% OFF`;
    }
    return null;
  };

  const badgeStyleColors = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    purple: 'bg-purple-500 text-white',
  };

  const typeBadge = isAuction ? 'Auction' : (banner.badge || 'Hot Sale');
  const typeBadgeStyle = isAuction ? 'blue' : (banner.badgeStyle || 'red');
  const discountPercentage = getDiscountPercentage();
  const buttonText = isAuction ? 'Bid Now' : (banner.buttonText || 'Shop Now');
  const productLink = product?._id ? `/home/product-details/${product._id}` : (banner.buttonLink || '/');

  // Left banner shows discount percentage, right banner shows price
  const getPriceBadgeContent = () => {
    if (isAuction) {
      return getPriceDisplay();
    }
    if (position === 'left') {
      // Left banner: show discount percentage if available, otherwise price
      return discountPercentage || getPriceDisplay();
    }
    // Right banner: always show price
    return getPriceDisplay();
  };

  // Text color based on banner setting (light for dark backgrounds, dark for light backgrounds)
  const isLightText = banner.textColor === 'light';
  const titleTextColor = isLightText ? 'text-white' : 'text-gray-900';
  const descTextColor = isLightText ? 'text-gray-200' : 'text-gray-600';

  return (
    <div 
      className="relative rounded-xl overflow-hidden h-full min-h-[200px] md:min-h-[220px]"
      style={{ backgroundColor: banner.backgroundColor || '#E2E8F0' }}
    >
      <div className="flex h-full p-4 md:p-6">
        {/* Content Side */}
        <div className="flex-1 flex flex-col justify-between z-10">
          {/* Type Badge */}
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit ${badgeStyleColors[typeBadgeStyle as keyof typeof badgeStyleColors]}`}>
            {typeBadge}
          </span>
          
          {/* Title & Description */}
          <div className="my-3">
            <h3 className={`text-lg md:text-xl lg:text-2xl font-bold leading-tight ${titleTextColor}`}>
              {banner.title || product?.name || 'Featured Product'}
            </h3>
            {banner.content && (
              <p className={`text-sm mt-2 line-clamp-2 ${descTextColor}`}>
                {banner.content}
              </p>
            )}
          </div>
          
          {/* CTA Button */}
          <Link 
            href={productLink}
            onClick={() => onBannerClick(banner._id)}
          >
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors w-fit">
              {buttonText}
            </button>
          </Link>
        </div>
        
        {/* Image Side */}
        <div className="relative w-[45%] flex items-center justify-center">
          {/* Price/Discount Badge */}
          <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold z-20">
            {getPriceBadgeContent()}
          </div>
          
          {/* Product Image */}
          <img 
            src={banner.imageUrl || product?.images?.[0] || '/images/ps5.png'}
            alt={banner.title || product?.name || 'Product'}
            className="w-full h-full max-h-[180px] object-contain"
          />
        </div>
      </div>
    </div>
  );
};

const PromotionalBanners = () => {
  const { data: bannersData, isLoading, error } = useBanners();
  const { trackImpression, trackClick } = useBannerTracking();

  const banners = {
    promoLeft: bannersData?.find(b => b.location === 'promo-banner-left'),
    promoRight: bannersData?.find(b => b.location === 'promo-banner-right'),
  };

  // Track impressions when banners are loaded
  useEffect(() => {
    if (banners.promoLeft?._id) {
      trackImpression(banners.promoLeft._id);
    }
    if (banners.promoRight?._id) {
      trackImpression(banners.promoRight._id);
    }
  }, [banners.promoLeft?._id, banners.promoRight?._id, trackImpression]);

  const handleBannerClick = (bannerId: string) => {
    if (bannerId) {
      trackClick(bannerId);
    }
  };

  // Don't render if no promotional banners exist
  if (isLoading || error || (!banners.promoLeft && !banners.promoRight)) {
    return null;
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Promotional Banner */}
        {banners.promoLeft && (
          <PromoBanner 
            banner={banners.promoLeft} 
            position="left" 
            onBannerClick={handleBannerClick}
          />
        )}
        
        {/* Right Promotional Banner */}
        {banners.promoRight && (
          <PromoBanner 
            banner={banners.promoRight} 
            position="right" 
            onBannerClick={handleBannerClick}
          />
        )}
      </div>
    </div>
  );
};

export default PromotionalBanners;
