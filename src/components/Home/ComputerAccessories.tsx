import React from "react";
import {  ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ProductType } from "@/types/product.type";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

const navCategories = [
  "All Accessories",
  "Keyboard",
  "Mouse",
  "Headphones",
  // "Webcams",
  "Monitors",
];




export default function ComputerAccessories() {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5800/api/v1/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const electronicsCategory = categoriesData?.categories?.find(
    (cat: any) =>
      cat.name.toLowerCase().includes("computer accessories") ||
      cat.name.toLowerCase().includes("electronics")
  );

  const fetchElectronicsProducts = async () => {
    if (!electronicsCategory) {
      throw new Error("Electronics category not found");
    }

    const response = await fetch(
      `http://localhost:5800/api/v1/products/categories/${electronicsCategory._id}?page=1&limit=12`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch electronics products");
    }
    const data = await response.json();
    return data.products || [];
  };

  const {
    data: electronicsData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["electronicsProducts", electronicsCategory?._id],
    queryFn: fetchElectronicsProducts,
    enabled: !!electronicsCategory,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading computer accessories...</p>
          </div>
        </div>
      </div>
    );
  }

  // if (isError) {
  //   return (
  //     <div className="max-w-7xl mx-auto ">
  //       <div className="flex items-center justify-center min-h-[100px]">
  //         <div className="text-center">
  //           <p className="text-red-600 mb-4">Failed to load computer accessories</p>
  //           <p className="text-gray-500 text-sm">
  //             {error instanceof Error ? error.message : "Something went wrong"}
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }z

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
      <div className="flex flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
            Computer Accessories
          </h1>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center">
            {navCategories.map((category, index) => (
              <button
                key={index}
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

      {electronicsData.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              No computer accessories available
            </p>
            <p className="text-gray-500 text-sm">
              Check back later for new products
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {electronicsData.map((product: ProductType, index: number) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
