import React, { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { AllProduct } from "@/utils/config";
import { ProductType } from "@/types/product.type";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { fetchPublic } from "@/utils/fetchPublic";

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
  analytics?: {
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
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

export default function PromotionalCollections() {
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const swiperRef = useRef<any>(null);

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await fetchPublic(`${AllProduct}/collections`);
      if (!response.ok) throw new Error("Failed to fetch collections");
      const result = await response.json();
      return result.data?.collections || [];
    },
  });

  const collections: CollectionType[] = collectionsData || [];

  const {
    data: collectionProducts = [],
    isLoading,
  } = useQuery({
    queryKey: ["collectionProducts", selectedCollection],
    queryFn: async () => {
      if (selectedCollection === "all") {
        // When "all" is selected, fetch products from the first collection or all
        const params = new URLSearchParams({ page: "1", limit: "12" });
        const response = await fetchPublic(`${AllProduct}/collections/${collections[0]?.slug}?${params}`);
        if (!response.ok) throw new Error("Failed to fetch collection products");
        const data = await response.json();
        const products = data.data?.products || [];
        return products.map((cp: CollectionProduct) => cp.productId).filter(Boolean);
      }
      const response = await fetchPublic(`${AllProduct}/collections/${selectedCollection}`);
      if (!response.ok) throw new Error("Failed to fetch collection products");
      const data = await response.json();
      const products = data.data?.products || [];
      return products.map((cp: CollectionProduct) => cp.productId).filter(Boolean);
    },
    enabled: collections.length > 0,
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const activeCollection = collections.find(
    (c) => c.slug === selectedCollection
  );
  const styling = activeCollection?.styling;

  const sectionStyle: React.CSSProperties = {};
  if (styling?.backgroundColor) sectionStyle.backgroundColor = styling.backgroundColor;
  if (styling?.bannerImage) {
    sectionStyle.backgroundImage = `url(${styling.bannerImage})`;
    sectionStyle.backgroundSize = "cover";
    sectionStyle.backgroundPosition = "center";
  }

  const textColor = styling?.textColor || undefined;

  // Reusable swiper component
  const MobileSwiper = ({
    items,
    renderItem,
    swiperRef: ref,
  }: {
    items: any[];
    renderItem: (item: any) => React.ReactNode;
    swiperRef: React.MutableRefObject<any>;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="w-full">
        <Swiper
          ref={ref}
          spaceBetween={16}
          slidesPerView={2.2}
          breakpoints={{
            480: { slidesPerView: 2 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 2.5 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {items.map((item: any) => (
            <SwiperSlide key={item._id || Math.random()}>
              {renderItem(item)}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
        {/* Header Skeleton */}
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="h-8 bg-gray-200 rounded w-56 animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              ))}
            </div>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
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

  return (
    collectionProducts.length > 0 ? (
      <div
        className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10 rounded-lg"
        style={sectionStyle}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2
            className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900"
            style={textColor ? { color: textColor } : undefined}
          >
            {activeCollection?.displayTitle || "Collections"}
          </h2>
          {/* Navigation */}
          <div className="flex items-center gap-2">
            {/* Desktop collection tabs */}
            <div className="hidden lg:flex items-center">
              <button
                onClick={() => setSelectedCollection("all")}
                className={`px-2 py-2 text-xs font-medium transition-colors ${
                  selectedCollection === "all"
                    ? "text-gray-900 border-b-2 border-yellow-500"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                style={textColor ? { color: textColor } : undefined}
              >
                All
              </button>
              {collections.slice(0, 4).map((collection: CollectionType) => (
                <button
                  key={collection._id}
                  onClick={() => setSelectedCollection(collection.slug)}
                  className={`px-2 py-2 text-xs font-medium transition-colors ${
                    selectedCollection === collection.slug
                      ? "text-gray-900 border-b-2 border-yellow-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  style={textColor ? { color: textColor } : undefined}
                >
                  {collection.name}
                </button>
              ))}
            </div>

            <Link href="/home/collections">
              <button
                className="flex text-xs md:text-sm underline items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                style={textColor ? { color: textColor } : undefined}
              >
                Browse All
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Mobile Swiper */}
        <div className="lg:hidden">
          <MobileSwiper
            items={collectionProducts}
            renderItem={(product: ProductType) => (
              <ProductCard key={product._id} product={product} />
            )}
            swiperRef={swiperRef}
          />
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid grid-cols-4 gap-4">
          {collectionProducts.slice(0, 8).map((product: ProductType) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    ) : (
      <></>
    )
  );
}
