import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AllProduct } from "@/utils/config";
import { ProductType } from "@/types/product.type";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

const navCategories = [
  "All Products",
  "Auction",
  "Furniture",
  "Offer",
  "Buy Now",
];



export default function FeaturedProducts() {
  const fetchFeaturedProducts = async () => {
    const response = await fetch(`${AllProduct}/featured?page=1&limit=12`);
    if (!response.ok) {
      throw new Error("Failed to fetch featured products");
    }
    const data = await response.json();
    console.log("Featured products data:", data);
    return data.products;
  };

  const {
    data: featuredProducts = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: fetchFeaturedProducts,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-10">
        {/* Header Skeleton */}
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="h-8 bg-gray-200 rounded w-56 animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              ))}
            </div>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // if (isError) {
  //   return (
  //     <div className="max-w-7xl mx-auto px-4">
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="text-center">
  //           <p className="text-red-600 mb-4">
  //             Failed to load featured products
  //           </p>
  //           <p className="text-gray-500 text-sm">
  //             {error instanceof Error ? error.message : "Something went wrong"}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    featuredProducts.length > 0 ? (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-10">
        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
            <h1 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
              Featured Products
            </h1>
          {/* Navigation */}
          <div className="flex items-center gap-2">
            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center">
              {navCategories.map((category, index) => (
                <button
                  key={category}
                  className={`px-2 py-2 text-xs font-medium transition-colors ${
                    index === 0
                      ? "text-gray-900 border-b-2 border-yellow-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <Link href="/home/categories">
              <button className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Browse All Products
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Products Grid */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredProducts.map((product: ProductType) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    ) : (
      <></>
      // <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-10">
      //   <div className="flex items-center justify-center min-h-[400px]">
      //     <div className="text-center">
      //       <p className="text-gray-600 mb-4">No featured products found</p>
      //       <p className="text-gray-500 text-sm">
      //         There are currently no featured products available.
      //       </p>
      //     </div>
      //   </div>
      // </div>
    
    )
  );
}
