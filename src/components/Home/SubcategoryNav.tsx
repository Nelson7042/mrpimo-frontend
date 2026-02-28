"use client";

import React from "react";
import Link from "next/link";
import ICategory from "@/types/category.type";
import { useLocalityFilter } from "@/hooks/useLocalityFilter";

interface SubcategoryNavProps {
  categories: ICategory[];
}

const SubcategoryNav: React.FC<SubcategoryNavProps> = ({ categories }) => {
  const { locality } = useLocalityFilter();

  if (!categories || categories.length === 0) {
    return null;
  }

  const getCategoryImage = (category: ICategory): string => {
    return category.icon || category.image || "/images/tv.png";
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-3">
        Subcategories
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4">
        {categories.map((category) => (
          <Link
            key={category._id}
            href={`/home/categories/${category.slug}?categoryId=${category._id}`}
            className="h-full"
          >
            <div className="group bg-white rounded-lg border border-[#ADADAD4D] p-3 lg:p-4 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col items-center justify-center">
              <div className="mb-2 lg:mb-3">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name}
                    className="w-8 h-8 md:w-12 md:h-12 object-contain"
                  />
                </div>
              </div>
              <h4 className="font-medium text-xs md:text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {category.name}
              </h4>
              {!locality && category.productCount > 0 ? (
                <span className="text-[10px] md:text-xs text-gray-500 mt-1 block min-h-[1rem]">
                  {category.productCount.toLocaleString()}{" "}
                  {category.productCount === 1 ? "product" : "products"}
                </span>
              ) : (
                <span className="text-[10px] md:text-xs text-gray-500 mt-1 block min-h-[1rem]">&nbsp;</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SubcategoryNav;
