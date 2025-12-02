"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCategories } from "@/hooks/queries";
import { Category } from "@/types/product.type";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Button } from "@/components/ui/button";

const ShopCategoriesComponent = () => {
  const categoryData = useCategories() || [];
  const categories = categoryData?.data?.categories?.filter((item: any) => item.level === 1) || [];
  const categoriesSwiperRef = useRef<any>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] pt-5 pb-3 md:py-10 lg:py-10">
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
          modules={[ Pagination]}
          spaceBetween={16}
          slidesPerView={2.3}
          // navigation={{
          //   prevEl: '.categories-prev',
          //   nextEl: '.categories-next',
          // }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
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
                <div className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-[#ADADAD4D] p-2 md:p-4 h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <img
                        src={category.image ?? "/images/tv.png"}
                        alt={category.name}
                        className="w-12 h-12 md:w-16 md:h-16 object-contain"
                      />
                    </div>
                    <h3 className="text-xs md:text-base whitespace-nowrap font-medium md:font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center line-clamp-2">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="flex justify-center items-center gap-4 mt-6">
          <Button variant="outline" size="sm" className="categories-prev">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="categories-next">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopCategoriesComponent;
