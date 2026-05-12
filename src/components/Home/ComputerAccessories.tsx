"use client";

import React, { useState, useMemo } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

import { ProductType, Category } from "@/types/product.type";
import { ProductCard } from "./ProductCard";
import {
  useCategoryBySlug,
  useProductsByCategory,
} from "@/hooks/useProducts";

// Hardcoded filter tabs
const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "mouse", label: "Mouse" },
  { id: "keyboard", label: "Keyboard" },
  { id: "headphone", label: "Headphones" },
  { id: "webcam", label: "Webcam" },
  { id: "speaker", label: "Speakers" },
];

const ITEMS_PER_PAGE = 6;

export default function ComputerAccessories() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Step 1: Fetch parent category by slug
  const { data: parentData, isLoading: isParentLoading } =
    useCategoryBySlug("computer-accessories");
  const parentCategory: Category | undefined = parentData?.category;

  // Step 2: Fetch all products for the parent category
  const { data: productsData, isLoading: isProductsLoading } =
    useProductsByCategory({
      categoryId: parentCategory?._id || "",
      page: 1,
    });

  const allProducts: ProductType[] = productsData?.products || [];
  const isLoading = isParentLoading;

  // Filter products based on active tab (client-side filtering)
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") {
      return allProducts;
    }
    
    const searchTerm = activeTab.toLowerCase();
    return allProducts.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";
      return name.includes(searchTerm) || description.includes(searchTerm);
    });
  }, [allProducts, activeTab]);

  // Reset to page 1 when filter changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

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

  // No category found — render nothing
  if (!parentCategory) {
    return null;
  }

  // No products available after loading — render nothing
  if (!isProductsLoading && allProducts.length === 0) {
    return null;
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-gray-900">
            Computer Accessories
          </h2>
          {/* All Kinds dropdown */}
          <div className="relative">
            <select
              className="appearance-none bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 pr-8 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleTabChange(e.target.value)}
              value={activeTab}
            >
              {FILTER_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.id === "all" ? "All Kinds" : tab.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        {/* Category tabs and Browse link */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 text-sm">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-2 whitespace-nowrap transition-all text-gray-600 hover:text-gray-800 border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#F6B76F] font-medium"
                    : "border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link
            href={`/home/categories/${parentCategory.slug}?categoryId=${parentCategory._id}`}
          >
            <button className="flex text-xs md:text-sm underline items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors whitespace-nowrap">
              Browse All Products
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Shop with Confidence banner — 28% on desktop */}
        <div className="lg:w-[28%]">
          <div className="bg-gradient-to-b from-[#AFC4F0] to-[#2563EB] p-6 flex flex-col items-center justify-center text-center">
            <h2 className="font-semibold text-white text-[40px]">MPRIMO</h2>
            <p className="my-5">Quality Meets Convenience</p>
            <h3 className="text-[50px] font-bold">
              Shop with Confidence
            </h3>
            <img
              src="/images/shop-with-confidence.png"
              alt="Shop with Confidence"
              className="w-full max-w-[200px] h-[auto] object-contain"
            />
            <button className="bg-white px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
              Shop now
            </button>
          </div>
        </div>

        {/* Products section — 72% on desktop */}
        <div className="lg:w-[72%]">
          {isProductsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
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
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((product: ProductType, index: number) => (
                  <ProductCard key={product._id || index} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  {/* Prev Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Prev
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === "number" && setCurrentPage(page)}
                      disabled={page === "..."}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-[#F6B76F] text-white"
                          : page === "..."
                          ? "bg-transparent text-gray-500 cursor-default"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No products found for "{FILTER_TABS.find(t => t.id === activeTab)?.label}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
