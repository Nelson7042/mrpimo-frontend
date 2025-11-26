import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "@/hooks/queries";
import ICategory from "@/types/category.type";
import { Category } from "@/types/product.type";

const ShopCategoriesComponent = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const categoryData = useCategories() || [];
  
  const categories =
    categoryData?.data?.categories?.filter((item: any) => item.level === 1) ||
    [];

  // const navCategories = [
  //   "All Products",
  //   "Electronics",
  //   "Fashion",
  //   "Furniture",
  //   "Headphones",
  //   "Smart Phones",
  // ];

  const nextSlide = () => {
    setCurrentSlide(
      (prev) => (prev + 1) % Math.max(1, categories.length - 2)
    );
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev - 1 + Math.max(1, categories.length - 2)) %
        Math.max(1, categories.length - 2)
    );
  };

  const generatePagination = () => {
    const totalPages = 10;
    const currentPage = 1;
    const pages = [];

    pages.push(
      <button
        key="prev"
        className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        Prev
      </button>
    );

    for (let i = 1; i <= 3; i++) {
      pages.push(
        <button
          key={i}
          className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
            i === currentPage
              ? "bg-orange-400 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    pages.push(
      <span key="dots" className="px-2 text-gray-400">
        ...
      </span>
    );

    pages.push(
      <button
        key="10"
        className="w-10 h-10 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
      >
        10
      </button>
    );

    pages.push(
      <button
        key="next"
        className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
      >
        Next
      </button>
    );

    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between mb-8">
        <h2 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
          Shop by Categories
        </h2>

        {/* Navigation */}
        <div className="flex  items-center gap-2 ">
          {/* Desktop navigation */}
         

          <Link
            href="/home/categories"
            className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Browse All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Category Cards Carousel */}
      <div className="relative">
        {/* Navigation Arrows - Desktop */}
        <button
          onClick={prevSlide}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={nextSlide}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out gap-4 lg:gap-6"
            style={{
              transform: `translateX(-${
                currentSlide * (100 / Math.min(categories.length, 3))
              }%)`,
            }}
          >
            {categories.map((card: Category) => (
            <Link key={card._id} href={`/home/categories/${card.slug}?categoryId=${card._id}`}>
                <div
                  key={card._id}
                  className="flex-shrink-0 w-full border border-[#ADADAD4D]   md::w-[190px] lg:w-[230px] group cursor-pointer"
                >
                  <div
                    className={` p-2 md:p-4 h-64 md:h-72 flex flex-col justify-between transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                  >
                    <div className="flex-1 flex items-center justify-center">
                      <div className=" w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <img
                          src={card.image ?? "/images/tv.png"}
                          alt=""
                          className=""
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {card.name}
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex lg:hidden justify-center mt-6 gap-2">
          {Array.from({ length: Math.max(1, categories.length - 2) }).map(
            (_, index) => (
              <div
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentSlide ? "bg-blue-600 w-6" : "bg-gray-300"
                }`}
              />
            )
          )}
        </div>
      </div>

      {/* Pagination */}
      {/* <div className="flex items-center justify-center gap-2 flex-wrap">
        {generatePagination()}
      </div> */}
    </div>
  );
};

export default ShopCategoriesComponent;
