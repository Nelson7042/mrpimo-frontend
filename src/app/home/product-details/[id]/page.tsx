"use client";

import type React from "react";

import ProductInfo from "./(component)/ProductInfo";
import ProductDetailsTabs from "./(component)/MoreDeatilsTab";
import ReviewsPage from "./(component)/Review";
import { useParams } from "next/navigation";
import { useFetchProductById } from "@/hooks/queries";

const ProductPage: React.FC = () => {
  const { id } = useParams();
  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useFetchProductById(id as string);
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-14 lg:py-18">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-200 rounded-xl h-64 md:h-80 lg:h-96"></div>
              <div className="flex gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="h-12 bg-gray-200 rounded flex-1"></div>
                <div className="h-12 bg-gray-200 rounded flex-1"></div>
                <div className="h-12 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
      <ProductInfo productData={productData?.product}/>
      <ProductDetailsTabs productData={productData?.product}/>
      <ReviewsPage product={productData?.product}/>
    </div>
  );
};

export default ProductPage;