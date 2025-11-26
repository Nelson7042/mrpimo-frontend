import { ProductType } from "@/types/product.type";
import { Heart, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Wishlist from "../client-component/Wishlist";
import { truncateSentence } from "@/utils/helper";

export const StarRating = ({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1">
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
    </div>
  );
};

export const ProductCard = ({
  product,
  isLarge = false,
}: {
  product: ProductType;
  isLarge?: boolean;
}) => {
  const [isLiked, setIsLiked] = useState(false);


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
    >
      <div
        className={`group bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
          isLarge ? "p-4 sm:p-5 md:p-6 h-full" : "p-3 sm:p-4"
        } border border-[#ADADAD4D] relative touch-manipulation ${
          isLarge ? "flex flex-col" : ""
        }`}
      >
        {/* Product Image */}
        <div className="relative mb-3 sm:mb-4">
          <div
            className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${
              isLarge ? "h-48 sm:h-64" : "h-24 md:h-34"
            } flex items-center justify-center overflow-hidden`}
          >
            <img
              src={product?.images?.[0] || "/images/tv.png"}
              alt={product?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Wishlist */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3  rounded-full shadow-md hover:shadow-lg transition-all duration-200] flex items-center justify-center">
            <Wishlist
              productData={product}
              price={product.priceInfo?.displayPrice || 0}
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

          <h3
            className={`font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors  ${
              isLarge
                ? "text-sm mg:text-lg mb-2 sm:mb-4"
                : "text-sm sm:text-base mb-1"
            }`}
          >
            {product?.name}
          </h3>
          {!isLarge && (
            <span className="text-xs text-gray-400 font-normal block mb-2">
              {product?.condition}
            </span>
          )}
          <p className="text-gray-600 text-[8px] mt-1 sm:text-sm leading-tight mb-3 sm:mb-4 hidden sm:block">
            {truncateSentence(product.description || "", 50)}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col">
              <span
                className={`font-bold text-gray-900 ${
                  isLarge ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
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
                className={`text-xs px-2 sm:px-3 py-1 rounded-full bg-gray-300 text-gray-600`}
              >
                {product?.inventory?.listing.type === "instant"
                  ? "Buy Now"
                  : "Auction"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
