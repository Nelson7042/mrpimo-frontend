import { ProductType } from '@/types/product.type';
import { Heart, Star } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react'
import { useWishlistStore } from '@/stores/useWishlistStore';


interface Product {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  discount: number;
  condition: "Brand New" | "Used" | "Refurbished";
  category: "Wholesale" | "Personal";
  description?: string;
}
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
  const [isLiked, setIsLiked] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product._id!);

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product._id!);
    } else {
      addToWishlist(product);
    }
  };

  const formatPrice = (price: number) => {
    return `₦ ${price.toLocaleString()}`;
  };

  return (
    <div
      className={`group bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        isLarge ? "p-4 sm:p-5 md:p-6" : "p-3 sm:p-4"
      } border border-[#ADADAD4D] relative touch-manipulation`}
    >
      {/* Discount Badge */}
      {/* {product.discount > 0 && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-yellow-400 text-black px-2 py-1 rounded text-xs sm:text-sm font-normal z-10">
          -{product.discount}%
        </div>
      )} */}

      <div className="relative mb-3 sm:mb-4">
        <div
          className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${
            isLarge ? "h-40 sm:h-48 md:h-56 lg:h-64" : "h-32 sm:h-36 md:h-40"
          } flex items-center justify-center overflow-hidden`}
        >
          <img
            src={product.images[0]}
            alt={product.name}
            className={`${
              isLarge
                ? "h-32 sm:h-40 md:h-48 lg:h-56"
                : "h-24 sm:h-28 md:h-32"
            } w-auto object-contain group-hover:scale-105 transition-transform duration-300`}
          />
        </div>

        {/* Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Heart
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
            } transition-colors duration-200`}
          />
        </button>
      </div>

      {/* Product Info */}

      <Link
        href={{
          pathname: "/home/product-details/[slug]",
          query: {
            slug: product.slug,
            productData: JSON.stringify(product), // Pass full product data
          },
        }}
        as={`/home/product-details/${product.slug}`} // Clean URL in browser
        className=""
      >
        {!isLarge && (
          <StarRating
            rating={product.rating}
            reviewCount={product?.reviews?.length}
          />
        )}

        <h3
          className={`font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight ${
            isLarge ? "text-base sm:text-lg md:text-xl mb-2 sm:mb-3" : "text-sm sm:text-base mb-2"
          }`}
        >
          {product.name}
          {!isLarge && (
            <span className="text-xs text-gray-400 font-normal block sm:inline sm:ml-1">
              {product.condition}
            </span>
          )}
        </h3>

        {isLarge && (
          <>
            <div className="flex items-center">
              {" "}
              <StarRating
                rating={product.rating}
                reviewCount={product.reviews?.length}
              />{" "}
              <span
                className={`text-xs pl-1 text-gray-400 font-normal hidden lg:block  `}
              >
                {product.condition}
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 hidden sm:block">
              {product.description}
            </p>
          </>
        )}

        {/* <div className="flex items-center gap-2 mb-2 sm:mb-3">
         
        </div> */}

        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-col flex-1">
            <span
              className={`font-bold text-gray-900 ${
                isLarge ? "text-lg sm:text-xl md:text-2xl" : "text-sm sm:text-base md:text-lg"
              }`}
            >
              {product.inventory?.listing?.type === "instant"
                ? formatPrice(
                    product?.variants?.find((item) => item?.name === "Default")?.options?.[0]?.price ?? 0
                  )
                : ""}
            </span>
          </div>

          <div className="flex items-center">
            <span
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                product.category?.main?.name === "Wholesale"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {product?.category?.sub &&
                product?.category?.sub[product.category.sub?.length - 1]?.name}
            </span>
          </div>
        </div>

        {isLarge && (
          <button className="btn-mobile w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105">
            View Details
          </button>
        )}
      </Link>
    </div>
  );
};


export default ProductCard