import React, { useEffect, useState } from 'react';
import { Package, Shield, ShoppingCart, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useBanners } from '@/hooks/useBanner';

interface Product {
  _id: string;
  name: string;
  images: string[];
  slug: string;
  variants?: any[];
  inventory?: any;
  priceInfo?: {
    originalPrice: number;
    originalCurrency: string;
    displayPrice: number;
    displayCurrency: string;
    currencySymbol: string;
    exchangeRate: number;
  };
}

const MarketplaceSection = () => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const { data: bannersData, isLoading, error } = useBanners();
  
  const banners = {
    bigBanner: bannersData?.find(b => b.location === 'big-banner'),
    smallBanner1: bannersData?.find(b => b.location === 'small-banner-1'),
    smallBanner2: bannersData?.find(b => b.location === 'small-banner-2'),
  };

  const carouselItems = banners.bigBanner?.products?.slice(0, 3).map((product) => ({
    title: banners.bigBanner?.title || 'Featured Product',
    subtitle: product.name,
    description: banners.bigBanner?.content || 'Check out this amazing product',
    buttonText: 'Buy Now',
    image: product.images?.[0] || '/images/ps5.png',
    productId: product._id,
    badge: getProductPrice(product),
  })) || [];

  function getProductPrice(product: Product) {
    if (product.priceInfo) {
      return `${product.priceInfo.currencySymbol}${product.priceInfo.displayPrice}`;
    }
    
    const currencySymbol = '$'; // Default fallback
    
    if (product.inventory?.listing?.type === 'auction') {
      return `Starting ${currencySymbol}${product.inventory.listing.auction?.reservePrice || 0}`;
    }
    const firstVariant = product.variants?.[0];
    const firstOption = firstVariant?.options?.[0];
    return firstOption?.salePrice 
      ? `${currencySymbol}${firstOption.salePrice}` 
      : `${currencySymbol}${firstOption?.price || 0}`;
  }

  useEffect(() => {
    if (!isAutoPlaying || carouselItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, carouselItems.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const features = [
    {
      icon: <Package className="w-8 h-8 text-orange-500" />,
      title: "Global Delivery Options",
      description: "Fast & Reliable Shipping",
      image: "/images/delivery.png"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: "Secure Payment",
      description: "Easy international payment",
      image: "/images/payment.png"
    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-yellow-500" />,
      title: "Buy New or Used Items",
      description: "Eco-friendly experience",
      image: "/images/buy.png"
    },
    {
      icon: <MapPin className="w-8 h-8 text-purple-500" />,
      title: "Real Time Tracking",
      description: "Keep track of your item",
      image: "/images/track.png"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Open to Everyone",
      description: "Great experience for all",
      image: "/images/everyone.png"
    }
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] pt-8 pb-3 md:py-10 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main banner skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-gray-200 animate-pulse rounded-md p-4 sm:p-6 lg:p-8 sm:min-h-[320px]">
              <div className="flex flex-row h-full">
                <div className="w-[55%] flex flex-col justify-center space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-10 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="w-[45%] flex items-center justify-center">
                  <div className="w-32 h-48 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Side banners skeleton */}
          <div className="lg:col-span-1 space-y-4 hidden md:block">
            <div className="bg-gray-200 animate-pulse rounded-lg p-4 h-32">
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-8 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
            <div className="bg-gray-200 animate-pulse rounded-lg p-4 h-32">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-8 bg-gray-300 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || carouselItems.length === 0) {
    return null;
  }


  return (
    <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] pt-8 pb-3 md:py-10 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Carousel Section */}
        <div className="lg:col-span-2">
          <div 
            className="flex flex-row rounded-md p-4 sm:p-6 lg:p-8 relative overflow-hidden sm:min-h-[320px]"
            style={{ backgroundColor: banners.bigBanner?.backgroundColor || '#E2E8F0' }}
          >
            <div className="relative z-10 w-[55%] flex flex-col justify-center">
              <div className="text-blue-600 font-medium text-xs sm:text-sm mb-1 md:mb-2 flex items-center">
                → {carouselItems[currentSlide]?.title}
              </div>
              <p className="text-sm md:text-base font-semibold text-gray-800 mb-1 md:mb-3">
                {carouselItems[currentSlide]?.subtitle}
              </p>
              <p className="text-gray-600 text-sm sm:text-base mb-1.5 sm:mb-6 leading-relaxed">
                {carouselItems[currentSlide]?.description}
              </p>
              <Link href={`/home/product-details/${carouselItems[currentSlide]?.productId}`}>
                <button className="text-sm md:text-base p-2 md:px-6 md:py-3 bg-primary hover:bg-blue-700 font-normal text-white rounded-md transition-colors duration-200 shadow-lg hover:shadow-xl w-fit">
                  {carouselItems[currentSlide]?.buttonText}
                </button>
              </Link>
              
              {/* Pagination Dots */}
              <div className="flex space-x-2 mt-3 md:mt-6">
                {carouselItems.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 cursor-pointer ${
                      currentSlide === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center relative w-[45%]">
              <img 
                src={carouselItems[currentSlide]?.image}
                alt="Product"
                className="w-[120px] sm:w-[100px] md:w-[140px] lg:w-[160px] h-[90px] sm:h-[180px] md:h-[220px] lg:h-[300px] object-contain rounded-lg"
              />
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                {carouselItems[currentSlide]?.badge}
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards */}
        <div className="lg:col-span-1 space-y-4 flex flex-col justify-between hidden md:block">
          {banners.smallBanner1 && (
            <div 
              className="card-responsive border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: banners.smallBanner1.backgroundColor || '#1F2937' }}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-500 mb-2 sm:mb-3 text-sm sm:text-base">
                    {banners.smallBanner1.title}
                  </h3>
                  <div className="text-sm sm:text-base font-medium text-white mb-3 sm:mb-4 leading-tight">
                    {banners.smallBanner1.content || banners.smallBanner1.products[0]?.name}
                  </div>
                  <Link href={`/home/product-details/${banners.smallBanner1.products[0]?._id}`}>
                    <button className="btn-mobile bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200">
                      View Details
                    </button>
                  </Link>
                </div>
                {banners.smallBanner1.imageUrl ? (
                  <img 
                    src={banners.smallBanner1.imageUrl}
                    alt={banners.smallBanner1.title}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg flex-shrink-0"
                  />
                ) : (
                  <img 
                    src={banners.smallBanner1.products[0]?.images[0] || '/images/image.png'}
                    alt={banners.smallBanner1.products[0]?.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg flex-shrink-0"
                  />
                )}
              </div>
            </div>
          )}

          {banners.smallBanner2 && (
            <div 
              className="card-responsive border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: banners.smallBanner2.backgroundColor || '#E2E8F0' }}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                {banners.smallBanner2.imageUrl ? (
                  <img 
                    src={banners.smallBanner2.imageUrl}
                    alt={banners.smallBanner2.title}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg flex-shrink-0"
                  />
                ) : (
                  <img 
                    src={banners.smallBanner2.products[0]?.images[0] || '/images/image.png'}
                    alt={banners.smallBanner2.products[0]?.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base font-medium">
                    {banners.smallBanner2.title}
                  </h3>
                  <div className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">
                    {banners.smallBanner2.content || getProductPrice(banners.smallBanner2.products[0])}
                  </div>
                  <Link href={`/home/product-details/${banners.smallBanner2.products[0]?._id}`}>
                    <button className="btn-mobile bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-6 sm:mt-8 hidden md:block">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <div key={index} className="bg-[#E2E8F0] rounded-lg p-3 sm:p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
                <img 
                  src={feature?.image} 
                  alt={feature.title}
                  className='h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-md flex-shrink-0' 
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm leading-tight">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 text-[10px] sm:text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSection;
