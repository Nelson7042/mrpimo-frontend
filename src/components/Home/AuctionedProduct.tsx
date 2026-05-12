import { useProductsOnAuction } from "@/hooks/queries";
import { ProductType } from "@/types/product.type";
import { Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Button } from "@/components/ui/button";
import Wishlist from "@/components/client-component/Wishlist";

const ITEMS_PER_PAGE = 8;

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
    <div className="group bg-gradient-to-br flex flex-col  min-h-[266px] from-gray-100 to-gray-200 rounded-md shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-2 md:p-3 border border-[#ADADAD4D] relative">
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

        {/* Wishlist */}
        <div className="absolute top-2 right-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 z-10">
          <Wishlist
            productData={product}
            price={product.priceInfo?.displayPrice || product.priceInfo?.originalPrice || 0}
          />
        </div>
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
        className="flex flex-col justify-between h-full flex-1"
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
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Visibility check queries - fetch minimal data to determine if section should render
  const { data: liveProducts, isLoading: isLiveLoading } = useProductsOnAuction({ page: 1, limit: 1, status: "live" });
  const { data: upcomingProducts, isLoading: isUpcomingLoading } = useProductsOnAuction({ page: 1, limit: 1, status: "upcoming" });

  const {
    data: auctionProducts,
    isLoading,
    isError,
  } = useProductsOnAuction({
    page: 1,
    status,
  });
  const auctionSwiperRef = useRef<any>(null);

  // Reset to page 1 when status changes
  const handleStatusChange = (newStatus: "upcoming" | "live" | "ended") => {
    setStatus(newStatus);
    setCurrentPage(1);
  };

  // Pagination calculations
  const allAuctionProducts = auctionProducts || [];
  const totalPages = Math.ceil(allAuctionProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = allAuctionProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  // Return null during loading to avoid layout shift
  if (isLiveLoading || isUpcomingLoading) {
    return null;
  }

  // Hide section entirely if no live AND no upcoming products exist
  if ((!liveProducts || liveProducts.length === 0) && (!upcomingProducts || upcomingProducts.length === 0)) {
    return null;
  }

  // Reusable swiper component
  const AuctionSwiper = ({
    items,
    renderItem,
    swiperRef,
    prevClass,
    nextClass,
  }: {
    items: any[];
    renderItem: (item: any) => React.ReactNode;
    swiperRef: React.MutableRefObject<any>;
    prevClass: string;
    nextClass: string;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="w-full">
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={2.2}
          navigation={{
            prevEl: `.${prevClass}`,
            nextEl: `.${nextClass}`,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            480: { slidesPerView: 1.5 },
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

        <div className="flex justify-center items-center gap-4 mt-4">
          <Button variant="outline" size="sm" className={prevClass}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className={nextClass}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // if (isLoading) {
  //   return (
  //     <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="flex flex-col items-center gap-4">
  //           <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  //           <p className="text-gray-600">Loading auction products...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-10 lg:py-10">
      <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-base md:text-xl lg:text-4xl font-semibold text-gray-900">
            Auction Products
          </h2>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex items-center">
            {["live", "upcoming", "ended"].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() =>
                  handleStatusChange(statusOption as "upcoming" | "live" | "ended")
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
        <>
          {/* Mobile Swiper */}
          <div className="lg:hidden">
            <AuctionSwiper
              items={auctionProducts}
              renderItem={(product: ProductType) => <ProductCard product={product} />}
              swiperRef={auctionSwiperRef}
              prevClass="auction-products-prev"
              nextClass="auction-products-next"
            />
          </div>

          {/* Desktop Grid with Pagination */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-4 sm:gap-6">
              {paginatedProducts.map((product: ProductType) => (
                <ProductCard key={product._id} product={product} />
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
          </div>
        </>
      )}
    </div>
  );
};

export default AuctionedProduct;
