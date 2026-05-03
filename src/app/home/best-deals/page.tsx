"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AllProduct } from "@/utils/config";
import { ProductCard } from "@/components/Home/ProductCard";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import { useRouter } from "next/navigation";
import { fetchPublic } from "@/utils/fetchPublic";

export default function BestDealsPage() {
  const [page, setPage] = useState(1);
  const limit = 24;
  const router = useRouter();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Best Deals", href: null },
  ];

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item.href);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["bestDeals", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        minDiscount: "5",
      });
      const response = await fetchPublic(`${AllProduct}/best-deals?${params}`);
      if (!response.ok) throw new Error("Failed to fetch best deals");
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg border animate-pulse">
                <div className="h-48 sm:h-56 md:h-64 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        <nav className="pt-3 mb-4">
          <Breadcrumbs
            items={breadcrumbs}
            onItemClick={handleBreadcrumbClick}
          />
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Best Deals
        </h1>

        {products.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-600">No deals available at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
