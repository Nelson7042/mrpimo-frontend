"use client";

import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import Link from "next/link";
import { API_BASE_URL } from "@/utils/config";
import { fetchPublic } from "@/utils/fetchPublic";
import Image from "next/image";

interface AdvertisedProduct {
  _id: string;
  name: string;
  images: string[];
  slug: string;
  variants?: Array<{
    options: Array<{ price: number; salePrice?: number }>;
  }>;
  inventory?: {
    listing?: {
      type: string;
      instant?: { price: number };
      auction?: { startBidPrice: number };
    };
  };
}

interface Advertisement {
  _id: string;
  title: string;
  productId: AdvertisedProduct | null;
  adType: string;
  imageUrl: string;
}

function getProductPrice(product: AdvertisedProduct): string {
  if (product.inventory?.listing?.type === "auction") {
    return product.inventory.listing.auction?.startBidPrice
      ? `${product.inventory.listing.auction.startBidPrice.toLocaleString()}`
      : "";
  }
  if (product.variants && product.variants.length > 0) {
    const allOptions = product.variants.flatMap((v) => v.options) || [];
    const prices = allOptions
      .map((o) => (o.salePrice && o.salePrice > 0 ? o.salePrice : o.price))
      .filter((p) => p > 0);
    if (prices.length === 0) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min.toLocaleString()}` : `${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  return product.inventory?.listing?.instant?.price?.toLocaleString() || "";
}

export default function SponsoredProducts() {
  const impressionTracked = useRef<Set<string>>(new Set());

  const { data: ads = [], isLoading } = useQuery<Advertisement[]>({
    queryKey: ["sponsoredAds"],
    queryFn: async () => {
      const response = await fetchPublic(
        `${API_BASE_URL}/advertisements/active?type=sponsored&limit=10`
      );
      if (!response.ok) throw new Error("Failed to fetch sponsored ads");
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Track impressions for visible ads
  useEffect(() => {
    if (!ads || ads.length === 0) return;

    ads.forEach((ad) => {
      if (!impressionTracked.current.has(ad._id)) {
        impressionTracked.current.add(ad._id);
        fetchPublic(`${API_BASE_URL}/advertisements/${ad._id}/impression`, {
          method: "POST",
        }).catch(() => {});
      }
    });
  }, [ads]);

  const handleAdClick = (ad: Advertisement) => {
    // Track click
    fetchPublic(`${API_BASE_URL}/advertisements/${ad._id}/impression`, {
      method: "POST",
    }).catch(() => {});
  };

  // Don't render if no ads
  if (!isLoading && (!ads || ads.length === 0)) return null;

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8">
        <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-gray-900">
          Sponsored
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Ad
        </span>
      </div>

      {/* Mobile Swiper */}
      <div className="lg:hidden">
        <Swiper spaceBetween={12} slidesPerView={2.2} breakpoints={{ 640: { slidesPerView: 3 } }}>
          {ads.map((ad) => (
            <SwiperSlide key={ad._id}>
              <AdCard ad={ad} onClick={handleAdClick} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-5 gap-4">
        {ads.slice(0, 10).map((ad) => (
          <AdCard key={ad._id} ad={ad} onClick={handleAdClick} />
        ))}
      </div>
    </div>
  );
}

function AdCard({
  ad,
  onClick,
}: {
  ad: Advertisement;
  onClick: (ad: Advertisement) => void;
}) {
  const product = ad.productId;
  if (!product) return null;

  const imageUrl = product.images?.[0] || ad.imageUrl;
  const price = getProductPrice(product);
  const productLink = product.slug ? `/home/product/${product.slug}` : "#";

  return (
    <Link
      href={productLink}
      onClick={() => onClick(ad)}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-gray-50">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.name || ad.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        )}
        <span className="absolute top-2 left-2 text-[10px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded">
          Sponsored
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.name || ad.title}
        </p>
        {price && (
          <p className="text-sm font-semibold text-gray-800 mt-1">{price}</p>
        )}
      </div>
    </Link>
  );
}
