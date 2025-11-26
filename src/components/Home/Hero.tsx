import React, { useEffect, useState } from 'react';
import { Package, Shield, ShoppingCart, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import {ProductProps} from "../../types/product.type"

interface MarketplaceSectionProps {
  product?: ProductProps;
}

const MarketplaceSection = ({ product }: MarketplaceSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  
  const carouselItems = [
    {
      title: "The Best Place to Buy",
      subtitle: "PS5",
      description: "Bid now on this PS5 in immaculate condition - unleash your gaming potential",
      buttonText: "Buy Now",
      image: "/images/ps5.png",
      badge: "Starting ₦200K"
    },
    {
      title: "Premium Gaming Setup",
      subtitle: "Xbox Series X",
      description: "Experience next-gen gaming with this pristine Xbox Series X console",
      buttonText: "Buy Now",
          image: "/images/ps5.png",

      badge: "Starting ₦180K"
    },
    {
      title: "Gaming Essentials",
      subtitle: "Nintendo Switch",
      description: "Portable gaming at its finest - perfect condition Nintendo Switch",
      buttonText: "Buy Now",
      image: "/images/ps5.png",
      badge: "Starting ₦120K"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    
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

  const goToSlide = (index:number) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Carousel Section */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br flex flex-col sm:flex-row from-[#E2E8F0] to-[#e5eaf0] rounded-lg p-4 sm:p-6 lg:p-8 relative overflow-hidden min-h-[280px] sm:min-h-[320px]">
            <div className="relative z-10 w-full sm:w-[55%] flex flex-col justify-center">
              <div className="text-blue-600 font-medium text-xs sm:text-sm mb-2 flex items-center">
                → {carouselItems[currentSlide].title}
              </div>
              <h2 className="text-responsive-lg font-semibold text-gray-900 element-spacing">
                {carouselItems[currentSlide].subtitle}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-6 leading-relaxed">
                {carouselItems[currentSlide].description}
              </p>
              <button className="btn-mobile bg-secondary hover:bg-blue-700 font-normal text-white rounded-md transition-colors duration-200 shadow-lg hover:shadow-xl w-fit">
                {carouselItems[currentSlide].buttonText}
              </button>
              
              {/* Pagination Dots */}
              <div className="flex space-x-2 mt-3 md:mt-6">
                {carouselItems.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 touch-manipulation ${
                      currentSlide === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center relative w-full sm:w-[45%] mt-4 sm:mt-0">
              <img 
                src={carouselItems[currentSlide].image}
                alt="Gaming Console"
                className="w-[120px] sm:w-[100px] md:w-[140px] lg:w-[160px] h-[100px] sm:h-[180px] md:h-[220px] lg:h-[300px] object-contain rounded-lg"
              />
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                {carouselItems[currentSlide].badge}
              </div>
            </div>
            
            {/* <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button> */}
          </div>
        </div>

       

        {/* Product Cards */}
        <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
          <div className="card-responsive bg-gray-900 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex-1">
                <h3 className="font-medium text-yellow-500 mb-2 sm:mb-3 text-sm sm:text-base">AUCTION FRIDAY</h3>
                <div className="text-sm sm:text-base font-medium text-white mb-3 sm:mb-4 leading-tight">
                  Fairly Used Apple iPad 28GB 5G Tablet
                </div>
                <button className="btn-mobile bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200">
                  View Details
                </button>
              </div>
              <img 
                src="/images/image.png" 
                alt="iPad"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg flex-shrink-0"
              />
            </div>
          </div>

          <div className="card-responsive bg-[#E2E8F0] border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img 
                src="/images/image.png" 
                alt="AirPods Max"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base font-medium">Apple Airpods Max - Silver</h3>
                <div className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">₦770,000</div>
                <Link href="/product-details">
                  <button className="btn-mobile bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          </div> 
        </div>
      </div>

      {/* Features Section - Mobile Responsive */}
      <div className="mt-6 sm:mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <div key={index} className="bg-[#E2E8F0] rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
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