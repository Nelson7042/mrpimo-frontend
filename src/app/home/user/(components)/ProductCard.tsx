import Wishlist from "@/components/client-component/Wishlist";
import { StarRating } from "@/components/Home/ProductCard";
import { useUserStore } from "@/stores/useUserStore";
import { ProductType } from "@/types/product.type";
import Link from "next/link";
import { useState } from "react";

const ProductCard = ({
  product,
  isLarge = false,
}: {
  product: ProductType;
  isLarge?: boolean;
}) => {
  const { user } = useUserStore();

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
          isLarge ? "p-4 sm:p-5 md:p-6 h-full" : "p-3 sm:p-4 h-full"
        } border border-[#ADADAD4D] relative touch-manipulation flex flex-col w-full max-w-xs sm:max-w-none mx-auto`}
      >
        {/* Product Image */}
        <div className="mb-3 sm:mb-4">
          <div
            className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg ${
              isLarge ? "h-48 sm:h-64" : "h-40 sm:h-32 md:h-40"
            } flex items-center justify-center overflow-hidden`}
          >
            <img
              src={product?.images?.[0] || "/images/tv.png"}
              alt={product?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Product Info */}
        <div
          className={`space-y-2 ${
            isLarge
              ? "flex-1 flex flex-col justify-between"
              : "flex-1 flex flex-col justify-between"
          }`}
        >
          {!isLarge && (
            <StarRating
              rating={product?.rating || 0}
              reviewCount={product?.reviews?.length || 0}
            />
          )}

          <h3
            className={`font-semibold text-gray-800 line-clamp-2 transition-colors ${
              isLarge
                ? "text-sm mg:text-lg mb-2 sm:mb-4"
                : "text-sm sm:text-base"
            }`}
          >
            {product?.name}
            {!isLarge && product?.condition && (
              <span className={`text-xs ml-1 text-gray-400 font-normal  `}>
                {product?.condition[0].toUpperCase() +
                  product?.condition.slice(1)}
              </span>
            )}
          </h3>
          <p className="text-gray-600 lg:text-[11px] mt-1 text-sm leading-tight mb-3 sm:mb-4 hidden sm:block">
            {product.description}
          </p>

          <p className="text-xs text-blue-500">
            {product?.category?.sub?.length
              ? product.category.sub[product.category.sub.length - 1].name
              : "Uncategorized"}
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
              <Wishlist
                productData={product}
                price={
                  product?.variants?.[0]?.options?.find((opt) => opt.isDefault)
                    ?.price ||
                  product?.variants?.[0]?.options?.[0]?.price ||
                  0
                }
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
