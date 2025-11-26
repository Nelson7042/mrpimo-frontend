"use client";

import {
  useFetchProductAnalytics,
  useFetchProductBySlug,
} from "@/hooks/queries";
import React from "react";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import {
  ArrowLeftIcon,
  Edit,
  Trash,
  LucideIcon,
  Eye,
  Heart,
  ChartColumnIncreasing,
  DollarSign,
  BarChart2,
  LineChart,
  Gavel,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { getCurrencySymbol } from "@/utils/currency";

type Props = {
  slug: string;
};

type InformationProps = {
  label: string;
  value: string | number;
};

type AnalyticsProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className: string;
};

const InformationCard = (props: InformationProps) => {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-secondary">{props.label}</p>
      <p className="text-sm text-primary">{props.value}</p>
    </div>
  );
};

const AnalyticsCard = ({
  label,
  value,
  icon: Icon,
  className,
}: AnalyticsProps) => (
  <div className="flex flex-col items-center gap-2 p-2">
    <div className={`p-2 rounded-full ${className}`}>
      <Icon size={18} className="text-gray-400" />
    </div>
    <div className="text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

const ProductDetail = ({ slug }: Props) => {
  const {
    data: productData,
    isError: productError,
    error: productErrorData,
    isLoading: productLoading,
  } = useFetchProductBySlug(slug);

  const product = productData?.product;
  const auctionData = productData?.auctionData;
  const productId = product?._id;

  const {
    data: analyticsData,
    isError: analyticsError,
    error: analyticsErrorData,
    isLoading: analyticsLoading,
  } = useFetchProductAnalytics(productId);

  if (productLoading || (productId && analyticsLoading)) {
    return <ProductDetailSkeleton />;
  }

  if (productError) {
    return <div>Error loading product: {productErrorData?.message}</div>;
  }

  if (analyticsError) {
    return <div>Error loading analytics: {analyticsErrorData?.message}</div>;
  }

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4 text-primary">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        <div className="lg:col-span-7 flex flex-col gap-y-5">
          <div className="">
            {/* Render product details */}
            {product && (
              <div className="rounded-lg border border-gray-200 p-4 text-sm">
                <div className="flex gap-x-2">
                  <ArrowLeftIcon />
                  <div>
                    <h3>Product Details</h3>
                    <p>{product?.name}</p>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 h-[200px] sm:h-[280px] rounded-md p-2 flex items-center justify-center">
                  <Image
                    src={product?.images[0]}
                    alt="product image"
                    width={300}
                    height={300}
                    style={{ width: "auto", height: "auto" }}
                    className="object-contain w-full h-auto max-h-[180px] sm:max-h-[260px]"
                  />
                </div>
                <div className="flex flex-col sm:flex-row mt-2 items-start sm:items-center justify-between gap-2">
                  <div className="bg-[#d3e1fe] rounded-full px-3 py-1 text-xs sm:text-sm">
                    {product?.category?.sub.length > 0 ? (
                      <p>
                        {
                          product?.category?.sub[
                            product?.category?.sub.length - 1
                          ].name
                        }
                      </p>
                    ) : (
                      <p>{product?.category?.main?.name}</p>
                    )}
                  </div>
                  {product?.inventory?.listing?.type === "instant" && (
                    <div className="font-semibold text-sm sm:text-base flex gap-x-1 items-center">
                      {getCurrencySymbol(product?.country?.currency)}{" "}
                      {product?.inventory?.listing?.type === "instant" ? (
                        <>
                          {(() => {
                            const hasVariants =
                              product.variants && product.variants.length > 0;

                            if (hasVariants) {
                              const allOptions = product.variants.flatMap(
                                (v: any) => v.options
                              );
                              const salePrices = allOptions
                                .map((o: any) => o.salePrice)
                                .filter(
                                  (p: number | undefined) =>
                                    typeof p === "number" && p > 0
                                );

                              if (salePrices.length === 0) return "N/A";

                              const min = Math.min(...salePrices);
                              const max = Math.max(...salePrices);
                              return min === max ? min : `${min} - ${max}`;
                            }

                            // Fallback for non-variant products
                            const basePrice =
                              product.inventory.listing.instant?.price;
                            const currency =
                              typeof product.country !== "string"
                                ? product.country?.currencySymbol ?? "₦"
                                : "₦";

                            return basePrice
                              ? `${currency}${basePrice.toLocaleString(
                                  "en-NG"
                                )}`
                              : "N/A";
                          })()}
                        </>
                      ) : (
                        <>
                          {product?.inventory?.listing?.instant?.price?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {product?.inventory?.listing?.type === "auction" && (
                  <div className="mt-2 bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">Auction Details</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Price:</span>
                        <span className="font-medium">{getCurrencySymbol(product?.country?.currency)}{product?.inventory?.listing?.auction?.startBidPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reserve Price:</span>
                        <span className="font-medium">{getCurrencySymbol(product?.country?.currency)}{product?.inventory?.listing?.auction?.reservePrice}</span>
                      </div>
                      {auctionData && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Bid:</span>
                          <span className="font-semibold text-purple-700">{getCurrencySymbol(product?.country?.currency)}{auctionData.highestBid}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Bids:</span>
                        <span className="font-medium">{auctionData?.totalBids || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-sm">{product?.name}</p>
                  <p className="text-xs mt-1 text-secondary">
                    {product?.description}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Auction Activity */}
          {product?.inventory?.listing?.type === "auction" && auctionData && auctionData.bidHistory?.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <p className="py-4 px-4 border-b border-gray-200 font-medium">Bidding Activity</p>
              <div className="px-4 py-3 max-h-64 overflow-y-auto">
                {auctionData.bidHistory.map((bid: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {new Date(bid.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{getCurrencySymbol(product?.country?.currency)}{bid.amount}</span>
                      {bid.isWinning && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Winning</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Render product analytics */}
          {analyticsData && (
            <div className="border border-gray-200 rounded-lg">
              <p className="py-4 px-4 border-b border-gray-200">Performance</p>
              <div className="px-4 flex justify-between items-center w-full py-4">
                <AnalyticsCard
                  label="Views"
                  value={analyticsData.views}
                  icon={Eye}
                  className="bg-blue-100"
                />
                <AnalyticsCard
                  label="Favorites"
                  value={analyticsData.favorites}
                  icon={Heart}
                  className="bg-orange-100"
                />
                <AnalyticsCard
                  label="Sales"
                  value={analyticsData.sales}
                  icon={ChartColumnIncreasing}
                  className="bg-green-100"
                />
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-5">
          <div className="justify-end mb-4 hidden lg:flex">
            <button className="bg-red-500 cursor-pointer text-white px-3 py-2 flex gap-x-2 items-center rounded-md text-sm">
              <Trash size={16} />
              Delete
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg mb-12">
            <p className="py-4 px-8 border-b border-gray-200">
              Product Information
            </p>
            <div className="px-2 py-4 flex flex-col gap-y-2">
              <InformationCard
                label={"Category"}
                value={product.category.main.name}
              />
              <InformationCard label={"Brand"} value={product.brand} />
              <InformationCard
                label="Status"
                value={
                  product.status.charAt(0).toUpperCase() +
                  product.status.slice(1)
                }
              />
              <InformationCard
                label="Sales method"
                value={
                  product.inventory.listing.type.charAt(0).toUpperCase() +
                  product.inventory.listing.type.slice(1)
                }
              />
              {product.inventory.listing.type === "instant" ? (
                <InformationCard
                  label={"Quantity"}
                  value={(() => {
                    const hasVariants =
                      product.variants && product.variants.length > 0;

                    if (hasVariants) {
                      const allOptions = product.variants.flatMap(
                        (v: any) => v.options
                      );
                      const totalQuantity = allOptions.reduce(
                        (sum: number, o: any) => sum + (o.quantity || 0),
                        0
                      );
                      return totalQuantity;
                    }

                    // Fallback if no variants
                    return product.inventory.listing.instant?.quantity ?? "N/A";
                  })()}
                />
              ) : (
                <>
                  <InformationCard label={"Quantity"} value={product.inventory.listing.auction?.quantity || 1} />
                  <InformationCard
                    label="Auction Start"
                    value={new Date(product.inventory.listing.auction?.startTime).toLocaleString("en-US", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  />
                  <InformationCard
                    label="Auction End"
                    value={new Date(product.inventory.listing.auction?.endTime).toLocaleString("en-US", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  />
                </>
              )}
              <InformationCard
                label="Created"
                value={new Date(product.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            </div>
          </div>
          {analyticsData && (
            <div className="border border-gray-200 rounded-lg">
              <p className="py-4 px-4 border-b border-gray-200 font-medium text-sm text-gray-700">
                Sales Summary
              </p>
              <div className="px-3 py-4 space-y-3">
                {/* Revenue */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Revenue</p>
                    <span className="text-green-700 font-semibold text-lg">
                      {getCurrencySymbol(analyticsData?.currency)}
                      {analyticsData?.revenue?.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <DollarSign className="text-green-700 w-4 h-4" />
                  </div>
                </div>

                {/* Total Sales */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                    <span className="text-blue-700 font-semibold text-lg">
                      {analyticsData?.totalSales}
                    </span>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BarChart2 className="text-blue-700 w-4 h-4" />
                  </div>
                </div>

                {/* Average Order Value */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Avg. Order Value
                    </p>
                    <span className="text-yellow-700 font-semibold text-lg">
                      {getCurrencySymbol(analyticsData?.currency)}
                      {analyticsData?.averageOrderValue?.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <LineChart className="text-yellow-700 w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="justify-end mb-4 lg:hidden flex mt-4">
        <button className="bg-red-500 cursor-pointer text-white px-3 py-2 flex gap-x-2 items-center rounded-md text-sm">
          <Trash size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
