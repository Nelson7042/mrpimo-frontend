"use client";

import React, { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

import { ProductType, Category } from "@/types/product.type";
import { ProductCard } from "./ProductCard";
import {
  useCategoryBySlug,
  useCategoryTree,
  useProductsByCategory,
} from "@/hooks/useProducts";
import { useLocalityFilter } from "@/hooks/useLocalityFilter";

export default function ComputerAccessories() {
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const { locality } = useLocalityFilter();

  // Step 1: Fetch parent category by slug
  const { data: parentData, isLoading: isParentLoading } =
    useCategoryBySlug("computer-accessories");
  const parentCategory: Category | undefined = parentData?.category;

  // Step 2: Fetch subcategories using parent ID
  const { data: treeData, isLoading: isTreeLoading } = useCategoryTree(
    parentCategory?._id
  );
  const subcategories: Category[] = (treeData?.categories || []).sort(
    (a: Category, b: Category) => a.sortOrder - b.sortOrder
  );

  // Step 3: Fetch products for active tab
  const activeCategoryId = activeTabId || parentCategory?._id;
  const { data: productsData, isLoading: isProductsLoading } =
    useProductsByCategory({
      categoryId: activeCategoryId || "",
      page: 1,
      limit: 12,
    });

  const products: ProductType[] = productsData?.products || [];
  const isLoading = isParentLoading || isTreeLoading;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
        <div className="flex flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
            >
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


  // Empty state when slug lookup returns no category
  if (!parentCategory) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
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
      </div>
    );
  }

  const activeSubcategory = activeTabId
    ? subcategories.find((s) => s._id === activeTabId)
    : null;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
      {/* Breadcrumb trail */}
      {parentCategory.breadcrumbs && parentCategory.breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center flex-wrap text-sm text-gray-500">
            {parentCategory.breadcrumbs.map((crumb, index) => (
              <li key={crumb.categoryId} className="flex items-center">
                <Link
                  href={`/home/categories/${crumb.slug}?categoryId=${crumb.categoryId}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {crumb.name}
                </Link>
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              </li>
            ))}
            {activeSubcategory ? (
              <>
                <li className="flex items-center">
                  <Link
                    href={`/home/categories/${parentCategory.slug}?categoryId=${parentCategory._id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {parentCategory.name}
                  </Link>
                  <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                </li>
                <li className="text-gray-900 font-medium">
                  {activeSubcategory.name}
                </li>
              </>
            ) : (
              <li className="text-gray-900 font-medium">
                {parentCategory.name}
              </li>
            )}
          </ol>
        </nav>
      )}

      <div className="flex flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
          {parentCategory.seoTitle || parentCategory.name}
        </h2>
        <Link
          href={`/home/categories/${parentCategory.slug}?categoryId=${parentCategory._id}`}
        >
          <button className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Browse All Products
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* SEO subtitle */}
      {parentCategory.seoDescription && (
        <p className="text-gray-600 text-sm md:text-base mb-4">
          {parentCategory.seoDescription}
        </p>
      )}

      {/* Subcategory tab bar */}
      <div className="mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 border-b border-gray-200 min-w-max">
          {/* "All Accessories" tab - always first */}
          <button
            onClick={() => setActiveTabId(null)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTabId === null
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Accessories
          </button>

          {/* Dynamic subcategory tabs */}
          {subcategories.map((sub: Category) => (
            <button
              key={sub._id}
              onClick={() => setActiveTabId(sub._id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTabId === sub._id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {sub.icon && (
                <img
                  src={sub.icon}
                  alt={sub.name}
                  className="w-4 h-4 object-contain"
                />
              )}
              {sub.name}
              {!locality && sub.productCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {sub.productCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isProductsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product: ProductType, index: number) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
