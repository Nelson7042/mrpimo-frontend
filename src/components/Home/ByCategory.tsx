"use client";

import React, { useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCategories } from "@/hooks/queries";
import { Category } from "@/types/product.type";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

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

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
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
      <div className="relative w-full">
        {/* Left navigation arrow - desktop only */}
        <button
          onClick={() => categoriesSwiperRef.current?.swiper?.slidePrev()}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow rounded-full items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Previous categories"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

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
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <img
                      src={category.image || category.icon || "/images/tv.png"}
                      alt={category.name}
                      className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain"
                    />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                    {category.name}
                  </span>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Right navigation arrow - desktop only */}
        <button
          onClick={() => categoriesSwiperRef.current?.swiper?.slideNext()}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow rounded-full items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Next categories"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ShopCategoriesComponent;
