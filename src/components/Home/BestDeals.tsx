"use client";

import React, { useState, useEffect, useRef } from "react";
import { Star, ArrowRight } from "lucide-react";
import { useBestDeals } from "@/hooks/queries";
import { ProductType } from "@/types/product.type";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Button } from "@/components/ui/button";
import Wishlist from "@/components/client-component/Wishlist";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 16,
    hours: 21,
    minutes: 57,
    seconds: 23,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:block text-white px-3 py-2 rounded-lg font-normal text-sm sm:text-base">
      <span className="hidden text-black sm:inline">Deals ends in: </span>
      <span className="sm:hidden">Ends in </span>
      <span className="font-normal bg-[#7EA5F8] py-1 px-2 ">
        <span className="hidden sm:inline">
          {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m :{" "}
          {timeLeft.seconds}s
        </span>
        <span className="sm:hidden">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </span>
    </div>
  );
};

const StarRating = ({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) => {
  return (
    <div className="flex items-center gap-1 mb-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={`${
            index < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : index < rating
                ? "fill-yellow-200 text-yellow-400"
                : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">
        ({reviewCount.toLocaleString()})
      </span>
    </div>
  );
};

const ProductCard = ({
  product,
  isLarge = false,
}: {
  product: ProductType;
  isLarge?: boolean;
}) => {
  return (
    <Link
      href={{
        pathname: "/home/product-details/[id]",
        query: {
          slug: product?.slug,
          productData: JSON.stringify(product),
        },
      }}
      as={`/home/product-details/${product?._id}`}
            className="min-h-[266px]"

    >
      <div
        className={`group bg-gradient-to-br from-gray-100 to-gray-200 rounded-md shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
          isLarge ? "p-2  md:p-5 h-full" : "p-2 sm:p-4"
        } border border-[#ADADAD4D] relative touch-manipulation ${
          isLarge ? "flex flex-col" : ""
        }`}
      >
        {/* Product Image */}
        <div className="relative mb-3 sm:mb-4">
          <div
            className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${
              isLarge ? "h-28 sm:h-64" : "h-24 md:h-34"
            } flex items-center justify-center overflow-hidden`}
          >
            <img
              src={product?.images?.[0] || "/images/tv.png"}
              alt={product?.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300`}
            />
          </div>

          {/* Wishlist */}
          <div
            className="absolute top-1 right-1 sm:top-3 sm:right-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center z-10"
            onClick={(e) => e.preventDefault()}
          >
            <Wishlist
              productData={product}
              price={
                product.priceInfo?.displayPrice ||
                product.priceInfo?.originalPrice ||
                0
              }
            />
          </div>
        </div>

        {/* Product Info */}
        <div
          className={`space-y-2 ${
            isLarge ? "flex-1 flex flex-col justify-between" : ""
          }`}
        >
          {!isLarge && (
            <StarRating
              rating={product?.rating || 0}
              reviewCount={product?.reviews?.length || 0}
            />
          )}
          {!isLarge && (
            <h3
              className={`font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors ${
                isLarge
                  ? "text-sm md:text-base mb-2 sm:mb-4"
                  : "text-sm sm:text-base"
              }`}
            >
              {product?.name}
            </h3>
          )}

          {isLarge && (
            <>
              <div className="flex items-center">
                <StarRating
                  rating={product?.rating || 0}
                  reviewCount={product?.reviews?.length || 0}
                />
                <span
                  className={`text-xs pl-1 text-gray-400 font-normal hidden lg:block  `}
                >
                  {product?.condition}
                </span>
              </div>
              <h3
                className={`font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors ${
                  isLarge
                    ? "text-sm md:text-base mb-2 sm:mb-4"
                    : "text-sm sm:text-base"
                }`}
              >
                {product?.name}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 hidden sm:block">
                {product?.description}
              </p>
            </>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col">
              <span
                className={`font-bold text-gray-900 ${
                  isLarge ? "text-sm md:text-2xl" : "text-sm sm:text-lg"
                }`}
              >
                {`${product?.priceInfo?.currencySymbol || "₦"} ${
                  product.priceInfo?.displayPrice.toLocaleString() ||
                  product.priceInfo?.originalPrice.toLocaleString()
                }`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[8px] md:text-xs px-2 sm:px-3 py-1 rounded-full bg-gray-300 text-gray-600`}
              >
                {product?.inventory?.listing.type === "instant"
                  ? "Buy Now"
                  : "Auction"}
              </span>
            </div>
          </div>

          {isLarge && (
            <button className="btn-mobile w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105">
              View Details
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function BestDeals() {
  const { data: products = [], isLoading, isError, error } = useBestDeals();
  const otherProducts = products.slice(1);
  const otherProductsSwiperRef = useRef<any>(null);

  // Reusable swiper component for other products
  const MobileSwiper = ({
    items,
    renderItem,
    swiperRef,
    prevClass,
    nextClass,
  }: {
    items: any[];
    renderItem: (item: any) => React.ReactNode;
    swiperRef: React.MutableRefObject<any>;
    prevClass: string;
    nextClass: string;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="w-full">
        <Swiper
          ref={swiperRef}
          spaceBetween={16}
          slidesPerView={2.2}
          breakpoints={{
            480: { slidesPerView: 2 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 2.5 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {items.map((item: any) => (
            <SwiperSlide key={item._id || Math.random()}>
              {renderItem(item)}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-5 pb-3 md:py-10 lg:py-10">
        {/* Header Skeleton */}
        <div className="flex flex-row items-center justify-between element-spacing gap-4 mb-6">
          <div className="flex flex-row items-center gap-3 sm:gap-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Main Featured Product Skeleton */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6 h-full animate-pulse">
              <div className="h-48 sm:h-64 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            </div>
          </div>

          {/* Other Products Grid Skeleton */}
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 animate-pulse"
                >
                  <div className="h-24 md:h-34 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // if (isError) {
  //   return (
  //     <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8  md:py-8 lg:py-10">
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="text-center">
  //           <p className="text-red-600 mb-4">
  //             Failed to load best deals
  //           </p>
  //           <p className="text-gray-500 text-sm">
  //             {error instanceof Error ? error.message : "Something went wrong"}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!products.length) {
  //   return (
  //     <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8  md:py-8 lg:py-10">
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <p className="text-gray-600">No deals available at the moment.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    products.length > 0 && (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
        {/* Header */}
        <div className="flex flex-row items-center justify-between element-spacing gap-4">
          <div className="flex flex-row items-center gap-3 sm:gap-6">
            <h2 className="text-responsive-xl font-semibold text-gray-900">
              Our Best Deals
            </h2>
            {/* <CountdownTimer /> */}
          </div>
          <Link href="/home/best-deals">
            <button className="btn-mobile flex items-center gap-2 text-blue-600 hover:text-blue-700 font-normal transition-colors group self-start sm:self-auto underline">
              <span className="text-sm">See All Deals</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </Link>
        </div>

        {/* Products Layout */}
        <div className="lg:hidden gap-4 sm:gap-6">
          {/* Other Products Swiper */}
          <div className="">
            <MobileSwiper
              items={otherProducts}
              renderItem={(product: any) => <ProductCard product={product} />}
              swiperRef={otherProductsSwiperRef}
              prevClass="other-products-prev"
              nextClass="other-products-next"
            />
          </div>
        </div>
        <div className="lg:flex flex-col hidden lg:flex-row gap-4 sm:gap-6">
          {/* Main Featured Product */}
          <div className="lg:w-1/3">
            <div className="h-full">
              <ProductCard product={products[0]} isLarge={true} />
            </div>
          </div>
          <div className="lg:w-2/3 grid grid-cols-3 gap-4">
            {otherProducts.slice(0, 6)?.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </div>
    )
  );
}
