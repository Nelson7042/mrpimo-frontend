"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AllProduct } from "@/utils/config";
import { ProductType } from "@/types/product.type";
import { ProductCard } from "@/components/Home/ProductCard";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { fetchPublic } from "@/utils/fetchPublic";

type FeaturedCategory = {
  _id: string;
  name: string;
  slug: string;
};

export default function FeaturedProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Featured Products", href: null },
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item?.href);
    }
  };

  const { data: categories } = useQuery({
    queryKey: ["featuredCategories"],
    queryFn: async () => {
      const response = await fetchPublic(`${AllProduct}/featured-categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["featuredProducts", selectedCategory, page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetchPublic(`${AllProduct}/featured?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const products = productsData?.products || [];
  const total = productsData?.pagination?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-6">
        {/* Breadcrumb */}
        <nav className="pt-3 ">
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">
          Featured Products{" "}
            <span className="text-gray-500 font-normal text-lg">
              {total} items
            </span>
          </h1>

          {/* Search */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search any features"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:w-5 md:h-5 text-gray-400" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-md text-xs md:text-sm hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`whitespace-nowrap pb-3 px-1 text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
            {categories?.data?.categories?.map((category: FeaturedCategory) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`whitespace-nowrap pb-3 px-1 text-sm font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product: ProductType) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
