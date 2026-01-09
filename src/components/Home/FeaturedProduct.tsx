import React, { useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { AllProduct } from "@/utils/config";
import { ProductType } from "@/types/product.type.ts_";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

type FeaturedCategory = {
  _id: string;
  name: string;
  slug: string;
};



export default function FeaturedProducts() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: categories = [] } = useQuery({
    queryKey: ["featuredCategories"],
    queryFn: async () => {
      const response = await fetch(`${AllProduct}/featured-categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const {
    data: featuredProducts = [],
    isLoading,
  } = useQuery({
    queryKey: ["featuredProducts", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "12" });
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      const response = await fetch(`${AllProduct}/featured?${params}`);
      if (!response.ok) throw new Error("Failed to fetch featured products");
      const data = await response.json();
      console.log('Featured Products API Response:', data);
      console.log('Featured Products Array:', data.products);
      console.log('Featured Products Count:', data.products?.length || 0);
      return data.products || [];
    },
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });


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
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
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
  //     <div className="w-full px-4">
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
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
            <h1 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
              Featured Products
            </h1>
          {/* Navigation */}
          <div className="flex items-center gap-2">
            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2 py-2 text-xs font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "text-gray-900 border-b-2 border-yellow-500"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All
              </button>
              {categories?.data?.categories?.slice(0, 4).map((category: FeaturedCategory) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`px-2 py-2 text-xs font-medium transition-colors ${
                    selectedCategory === category.slug
                      ? "text-gray-900 border-b-2 border-yellow-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <Link href="/home/feature-products">
              <button className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Browse All
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Products Grid */}


        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredProducts.map((product: ProductType) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div> */}

           {/* featured Products Swiper */}
          <div className="lg:w-2/3">
            <MobileSwiper
              items={featuredProducts}
              renderItem={(product: ProductType) => <ProductCard  key={product._id} product={product} />}
              swiperRef={otherProductsSwiperRef}
              prevClass="other-products-prev"
              nextClass="other-products-next"
            />
          </div>
      </div>
    ) : (
      <></>
      // <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
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
