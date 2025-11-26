import { useProductsOnAuction } from "@/hooks/queries";
import { ProductType } from "@/types/product.type";
import { Heart, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const AuctionTimer = ({ product }: { product: ProductType }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const auction = product.inventory?.listing?.auction;
    if (!auction || !auction.startTime || !auction.endTime) return;

    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    const isUpcoming = !auction.isStarted;
    const isLive = auction.isStarted && !auction.isExpired;
    const isEnded = auction.isExpired;

    const targetDate = isUpcoming ? startTime : isLive ? endTime : null;

    if (!targetDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product]);

  const auction = product.inventory?.listing?.auction;
  if (!auction) return null;

  if (auction.isExpired && auction.endTime) {
    return (
      <div className="text-xs text-gray-500 mt-2">
        Ended: {new Date(auction.endTime).toLocaleDateString()}
      </div>
    );
  }

  const isUpcoming = !auction.isStarted;

  return (
    <div className="text-xs mt-2 p-2 bg-blue-50 rounded">
      <span className="text-gray-600">
        {isUpcoming ? "Starts in: " : "Ends in: "}
      </span>
      <span className="font-medium text-blue-600">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
        {timeLeft.seconds}s
      </span>
    </div>
  );
};

const ProductCard = ({ product }: { product: ProductType }) => {
  const [isLiked, setIsLiked] = useState(false);

  const getAuctionBadge = () => {
    const auction = product.inventory?.listing?.auction;
    if (!auction) return null;

    const isUpcoming = !auction.isStarted;
    const isLive = auction.isStarted && !auction.isExpired;
    const isEnded = auction.isExpired;

    const status = isUpcoming ? "upcoming" : isLive ? "live" : "ended";
    const badgeColors = {
      upcoming: "bg-yellow-100 text-yellow-700",
      live: "bg-green-100 text-green-700",
      ended: "bg-gray-100 text-gray-700",
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="group bg-gradient-to-br from-gray-100 to-gray-200 rounded-md shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-3 border border-[#ADADAD4D] relative">
      <div className="relative mb-3">
        <div
          className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-24 md:h-32 lg:h-48 flex items-center justify-center overflow-hidden`}
        >
          <img
            src={product?.images?.[0] || "/images/tv.png"}
            alt={product?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Heart
            size={16}
            className={`${
              isLiked ? "fill-red-500 text-red-500" : "text-gray-400"
            } transition-colors duration-200`}
          />
        </button>
      </div>

      <Link
        href={{
          pathname: "/home/product-details/[id]",
          query: {
            id: product._id,
            productData: JSON.stringify(product),
          },
        }}
        as={`/home/product-details/${product._id}`}
      >
        <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm mb-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-base">
              <span className="flex items-center gap-1">
                <span>
                  {product.priceInfo?.currencySymbol || "$"}
                  {(
                    product.priceInfo?.displayPrice ||
                    product.priceInfo?.originalPrice ||
                    0
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {product.priceInfo?.displayCurrency || "USD"}
                </span>
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">{getAuctionBadge()}</div>
        </div>

        <AuctionTimer product={product} />
      </Link>
    </div>
  );
};

const AuctionedProduct = () => {
  const [status, setStatus] = React.useState<"upcoming" | "live" | "ended">(
    "live"
  );
  const {
    data: auctionProducts,
    isLoading,
    isError,
  } = useProductsOnAuction({
    page: 1,
    limit: 12,
    status,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading auction products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-8 md:py-10 lg:py-15">
      <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
            Auction Products
          </h1>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex items-center">
            {["live", "upcoming", "ended"].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() =>
                  setStatus(statusOption as "upcoming" | "live" | "ended")
                }
                className={`px-3 py-2 text-xs font-medium transition-colors capitalize ${
                  status === statusOption
                    ? "text-gray-900 border-b-2 border-yellow-500"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!auctionProducts || auctionProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No auction products found for {status} status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {auctionProducts.map((product: ProductType) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionedProduct;
