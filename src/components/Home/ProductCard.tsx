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

  const discountPercent = (() => {
    // Calculate discount from the variant's price vs salePrice (same currency, no conversion needed)
    const option = product?.variants?.find((v) => v?.name === "Default")?.options?.[0] 
      || product?.variants?.[0]?.options?.[0];
    if (option?.salePrice && option?.price && option.salePrice < option.price) {
      return Math.round(((option.price - option.salePrice) / option.price) * 100);
    }
    return 0;
  })();

  // Calculate the original price in user's display currency
  const originalPriceDisplay = (() => {
    const option = product?.variants?.find((v) => v?.name === "Default")?.options?.[0]
      || product?.variants?.[0]?.options?.[0];
    if (!option?.price || !option?.salePrice || option.salePrice >= option.price) return null;
    const exchangeRate = (product as any)?.priceInfo?.exchangeRate || 1;
    return parseFloat((option.price * exchangeRate).toFixed(2));
  })();

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
        className={`group bg-gradient-to-br h-full flex flex-col  from-gray-100 to-gray-200 rounded-md shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
          isLarge ? "p-2 md:p-5 h-full" : "p-2 sm:p-4"
        } border border-[#ADADAD4D] relative touch-manipulation`}
      >
        {/* Product Image */}
        <div className="relative mb-2 sm:mb-4">
          <div
            className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-md ${
              isLarge ? "h-48 sm:h-64" : "h-40 sm:h-48 md:h-56"
            } flex items-center justify-center overflow-hidden`}
          >
            <img
              src={product?.images?.[0] || "/images/tv.png"}
              alt={product?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold z-10">
              -{discountPercent}%
            </div>
          )}

          {/* Wishlist */}
          <div className="absolute top-1 right-1 sm:top-3 sm:right-3  rounded-full shadow-md hover:shadow-lg transition-all duration-200] flex items-center justify-center">
            <Wishlist
              productData={product}
              price={product.priceInfo?.displayPrice || 0}
            />
          </div>
        </div>

        {/* Product Info */}
        <div
          className={`space-y-2 h-full ${
            isLarge ? "flex-1 flex flex-col justify-between" : "flex flex-col justify-between"
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
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-gray-900 ${
                  isLarge ? "text-sm md:text-lg" : "text-sm sm:text-base"
                }`}
              >
                {`${product?.priceInfo?.currencySymbol || "₦"} ${
                  product.priceInfo?.displayPrice.toLocaleString() ||
                  product.priceInfo?.originalPrice.toLocaleString()
                }`}
              </span>
              {discountPercent > 0 && originalPriceDisplay && (
                <span className="text-xs text-gray-400 line-through">
                  {product?.priceInfo?.currencySymbol || "₦"}{originalPriceDisplay.toLocaleString()}
                </span>
              )}
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
        </div>
      </div>
    </Link>
  );
};
