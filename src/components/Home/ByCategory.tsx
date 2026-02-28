"use client";

import React, { useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useCategories } from "@/hooks/queries";
import { Category } from "@/types/product.type";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Button } from "@/components/ui/button";
import { useLocalityFilter } from "@/hooks/useLocalityFilter";

const ShopCategoriesComponent = () => {
  const categoryData = useCategories() || [];
  const allCategories = categoryData?.data?.categories?.filter((item: Category) => item.level === 1) || [];

  // Sort: featured first by sortOrder, then non-featured by sortOrder
  const categories = useMemo(() => {
    const active = allCategories.filter((c: Category) => c.isActive !== false);
    const featured = active
      .filter((c: Category) => c.featured)
      .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);
    const nonFeatured = active
      .filter((c: Category) => !c.featured)
      .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);
    return [...featured, ...nonFeatured];
  }, [allCategories]);

  const categoriesSwiperRef = useRef<any>(null);
  const { locality } = useLocalityFilter();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-5 pb-3 md:py-10 lg:py-10">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between mb-8">
        <h2 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
          Shop by Categories
        </h2>

        <Link
          href="/home/categories"
          className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Browse All Categories
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Categories Swiper */}
      <div className="w-full">
        <Swiper
          ref={categoriesSwiperRef}
          spaceBetween={16}
          slidesPerView={2.3}
          breakpoints={{
            480: { slidesPerView: 2.5 },
            640: { slidesPerView: 3 },
            768: { slidesPerView: 3.5 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
        >
          {categories.map((category: Category) => (
            <SwiperSlide key={category._id}>
              <Link href={`/home/categories/${category.slug}?categoryId=${category._id}`}>
                <div className={`group relative rounded-lg border p-2 md:p-4 h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                  category.featured
                    ? "bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300 ring-1 ring-blue-200"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border-[#ADADAD4D]"
                }`}>
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    {category.featured && (
                      <div className="absolute top-1 right-1 md:top-2 md:right-2">
                        <Star className="w-3 h-3 md:w-4 md:h-4 text-blue-500 fill-blue-500" />
                      </div>
                    )}
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <img
                        src={category.icon || category.image || "/images/tv.png"}
                        alt={category.name}
                        className="w-12 h-12 md:w-16 md:h-16 object-contain"
                      />
                    </div>
                    <h3 className="text-xs md:text-base whitespace-nowrap font-medium md:font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center line-clamp-2">
                      {category.name}
                    </h3>
                    {!locality && category.productCount > 0 && (
                      <span className="text-[10px] md:text-xs text-gray-500">
                        {category.productCount.toLocaleString()}{" "}
                        {category.productCount === 1 ? "product" : "products"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ShopCategoriesComponent;
