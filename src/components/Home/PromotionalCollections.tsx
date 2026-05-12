"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { AllProduct } from "@/utils/config";
import { ProductType } from "@/types/product.type";
import Link from "next/link";
import { fetchPublic } from "@/utils/fetchPublic";
import { ProductCard } from "./ProductCard";

type CollectionType = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  displayTitle?: string;
  priority: number;
  isActive: boolean;
  type: "seasonal" | "permanent" | "flash-sale" | "curated";
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    badgeStyle?: string;
    bannerImage?: string;
  };
};

type CollectionProduct = {
  _id: string;
  productId: ProductType;
  collectionId: string;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

const ITEMS_PER_PAGE = 8;

export default function PromotionalCollections() {
  const [activeTab, setActiveTab] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch all collections
  const { data: collectionsData, isLoading: isLoadingCollections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await fetchPublic(`${AllProduct}/collections`);
      if (!response.ok) throw new Error("Failed to fetch collections");
      const result = await response.json();
      return result.data?.collections || [];
    },
  });

  const collections: CollectionType[] = collectionsData || [];

  // Set first collection as active tab when collections load
  React.useEffect(() => {
    if (collections.length > 0 && !activeTab) {
      setActiveTab(collections[0].slug);
    }
  }, [collections, activeTab]);

  // Fetch products for the active collection
  const { data: collectionProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["collectionProducts", activeTab],
    queryFn: async () => {
      const response = await fetchPublic(
        `${AllProduct}/collections/${activeTab}`
      );
      if (!response.ok) throw new Error("Failed to fetch collection products");
      const data = await response.json();
      const products = data.data?.products || [];
      return products.map((cp: CollectionProduct) => cp.productId).filter(Boolean);
    },
    enabled: !!activeTab,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Handle tab change
  const handleTabChange = (slug: string) => {
    setActiveTab(slug);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(collectionProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = collectionProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  // Get active collection details
  const activeCollection = collections.find((c) => c.slug === activeTab);

  // Loading skeleton
  if (isLoadingCollections) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
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

  // Hide section when no collections available
  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-gray-900">
          Featured Products
        </h2>

        {/* Collection tabs and Browse link */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 text-sm">
            {collections.map((collection) => (
              <button
                key={collection._id}
                onClick={() => handleTabChange(collection.slug)}
                className={`px-3 py-2 whitespace-nowrap transition-all text-gray-600 hover:text-gray-800 border-b-2 ${
                  activeTab === collection.slug
                    ? "border-[#F6B76F] font-medium"
                    : "border-transparent"
                }`}
              >
                {collection.displayTitle || collection.name}
              </button>
            ))}
          </div>
          {activeCollection && (
            <Link href="/home/collections">
              <button className="flex text-xs md:text-sm underline items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors whitespace-nowrap">
                Browse All
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Products grid */}
      {isLoadingProducts ? (
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
      ) : paginatedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
          No products found in this collection
        </div>
      )}
    </div>
  );
}
