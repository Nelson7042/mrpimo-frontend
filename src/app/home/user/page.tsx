"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Edit,
  Eye,
  EyeOff,
  FileText,
  ShoppingCart,
  Gavel,
  Tag,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Home/Header";
import { Sidebar } from "@/components/SideBar";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import {
  useUserProfile,
  useRecentViews,
  useRecomendations,
  useUserRecentActivities,
} from "@/hooks/useUser";
import Link from "next/link";
import ProductCard from "./(components)/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/**
 * Refactored DashboardPage
 * - Fixes mobile swiper layout by placing swipers in full-bleed wrappers
 * - Deduplicates swiper configuration via MobileSwiper component
 * - Keeps original hooks and logic intact
 */

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [recentViewsPage, setRecentViewsPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);

  const itemsPerPage = 4;
  const router = useRouter();

  // Use 'any' for Swiper refs to avoid strict typing issues — you can replace with proper types later
  const recentViewsSwiperRef = useRef<any>(null);
  const recommendationsSwiperRef = useRef<any>(null);

  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const { data: recentViewsData, isLoading: viewsLoading } = useRecentViews(8);
  const {
    data: recomendationsData,
    isLoading: recomendationsLoading,
  } = useRecomendations(8, true);
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
  } = useUserRecentActivities(activitiesPage, 10);

  const recentViews = recentViewsData?.recentViews || [];
  const recommendations = recomendationsData?.products || [];

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "My Account", href: "/home/user/settings" },
    { label: "Dashboard", href: "/home" },
    { label: "Overview", href: null },
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

  // Reusable small component for mobile full-bleed swipers
  const MobileSwiper = ({
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
      <div className="w-screen -ml-4 px-4 sm:hidden">
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination]}
          spaceBetween={12}
          slidesPerView={1.1}
          navigation={{
            prevEl: `.${prevClass}`,
            nextEl: `.${nextClass}`,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            380: { slidesPerView: 1.2 },
            480: { slidesPerView: 1.4 },
          }}
        >
          {items.map((it: any) => (
            <SwiperSlide key={it._id || it.id || Math.random()}>
              {renderItem(it)}
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

  // Memoized slices to avoid recalculations on every render
  const pagedRecentViews = useMemo(
    () =>
      recentViews.slice(
        (recentViewsPage - 1) * itemsPerPage,
        recentViewsPage * itemsPerPage
      ),
    [recentViews, recentViewsPage]
  );

  const pagedRecommendations = useMemo(
    () =>
      recommendations.slice(
        (recommendationsPage - 1) * itemsPerPage,
        recommendationsPage * itemsPerPage
      ),
    [recommendations, recommendationsPage]
  );

  // Activity icon helper
  const getActivityIcon = (activityText: string) => {
    const text = (activityText || "").toLowerCase();
    if (text.includes("order") || text.includes("purchased")) {
      return <ShoppingCart className="w-5 h-5 text-green-600" />;
    } else if (text.includes("bid")) {
      return <Gavel className="w-5 h-5 text-purple-600" />;
    } else if (text.includes("offer")) {
      return <Tag className="w-5 h-5 text-orange-600" />;
    } else if (text.includes("won")) {
      return <Trophy className="w-5 h-5 text-yellow-600" />;
    } else {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center">
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="text-xs sm:text-sm overflow-x-auto whitespace-nowrap"
          />
        </div>

        {/* Greeting */}
        <div className="mb-8 max-w-full">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 break-words">
            Hello, {profileData?.user?.profile?.firstName || "User"}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed break-words max-w-full">
            Welcome to your Shopping Command Centre! Easily manage your orders,
            wishlist, and explore tailored deals in one convenient hub.
          </p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8 max-w-full">
          {/* Credit Balance */}
          <Card className="p-0 py-3 sm:py-6 rounded-none relative order-1 sm:order-3">
            <CardContent className="p-0 px-3 sm:px-6 rounded-none">
              <div className="flex items-center justify-between mb-4 p-2 bg-[#E2E8F0]">
                <h3 className="font-medium text-sm md:text-base">
                  CREDIT BALANCE
                </h3>
              </div>
              <div className="space-y-2 p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <p className="font-semibold text-lg">
                      {showBalance
                        ? `${
                            profileData?.fiatWallet?.balances?.available || "0"
                          } ${profileData?.fiatWallet?.currency || ""}`
                        : `******`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance((s) => !s)}
                  >
                    {showBalance ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <Button
                  className="cursor-pointer w-[95%] bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded absolute bottom-2 left-1/2 transform -translate-x-1/2"
                  onClick={() => setShowAddFundsModal(true)}
                >
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="p-0 py-3 sm:py-6 rounded-none order-2 sm:order-1">
            <CardContent className="p-0 px-3 sm:px-6 rounded-none">
              <div className="flex items-center justify-between mb-4 p-2 bg-[#E2E8F0]">
                <h3 className="font-medium text-sm md:text-base">
                  ACCOUNT INFO
                </h3>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 p-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Name:</span>
                  <p>
                    {profileData?.user?.profile?.firstName || ""}{" "}
                    {profileData?.user?.profile?.lastName || ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Email:</span>
                  <p>{profileData?.user?.email || ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="p-0 py-3 sm:py-6 rounded-none order-3 sm:order-2">
            <CardContent className="p-0 px-3 sm:px-6 rounded-none">
              <div className="flex items-center justify-between mb-4 p-2 bg-[#E2E8F0]">
                <h3 className="font-medium text-sm md:text-base">
                  SHIPPING ADDRESS
                </h3>

                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3 p-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Name:</span>
                  <p>
                    {profileData?.user?.profile?.firstName || ""}{" "}
                    {profileData?.user?.profile?.lastName || ""}
                  </p>
                </div>
                {profileData?.shippingDefaultAddress && (
                  <div className="flex gap-1">
                    <span className="text-sm text-gray-600">Address:</span>
                    <p>
                      {`${profileData.shippingDefaultAddress.street}, ${profileData.shippingDefaultAddress.city}, ${profileData.shippingDefaultAddress.state}`}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <p>
                    {profileData?.user?.profile?.phoneNumber || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
            {!profileData?.shippingDefaultAddress && (
              <div className="p-2 border-t">
                <Button
                  className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push("/home/user/settings")}
                >
                  Add Shipping Address
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="mb-8 py-3 sm:py-6">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Recent Activities</h3>
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-800"
                onClick={() => setShowActivitiesModal(true)}
              >
                See All →
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">SN</th>
                    <th className="pb-3">ACTIVITIES</th>
                    <th className="pb-3 hidden sm:table-cell">TIME</th>
                    <th className="pb-3 hidden sm:table-cell">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {activitiesLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        </td>
                      </tr>
                    ))
                  ) : activitiesData?.activities?.length > 0 ? (
                    activitiesData.activities.map((activity: any, index: number) => {
                      const activityDate = new Date(activity.createdAt);
                      const activityTime = activityDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const activityDateStr = activityDate.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });

                      return (
                        <tr key={activity.id || activity._id || index} className="border-b">
                          <td className="py-3">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-3">
                              {getActivityIcon(activity.activity)}
                              <div className="flex flex-col">
                                <span className="text-sm">{activity.activity}</span>
                                <div className="sm:hidden text-xs text-gray-500 mt-1">
                                  {activityTime} • {activityDateStr}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-sm hidden sm:table-cell">{activityTime}</td>
                          <td className="py-3 text-sm hidden sm:table-cell">{activityDateStr}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No recent activities
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Activities Pagination */}
            {activitiesData?.pagination && activitiesData.pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activitiesPage === 1}
                  onClick={() => setActivitiesPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {activitiesPage} of {activitiesData.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activitiesPage === activitiesData.pagination.pages}
                  onClick={() => setActivitiesPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Views */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Views</h3>
            {recentViews.length > 0 && (
              <Button variant="link" className="text-blue-600 hover:text-blue-800">
                See All →
              </Button>
            )}
          </div>

          {/* Mobile Swiper (full-bleed) */}
          <MobileSwiper
            items={recentViews}
            renderItem={(product: any) => <ProductCard product={product} />}
            swiperRef={recentViewsSwiperRef}
            prevClass="recent-views-prev"
            nextClass="recent-views-next"
          />

          {/* Desktop Grid */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {pagedRecentViews.map((product: any) => (
                <div key={product._id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Desktop Pagination */}
            {recentViews.length > itemsPerPage && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
                <Button variant="ghost" size="sm" disabled={recentViewsPage === 1} onClick={() => setRecentViewsPage((prev) => prev - 1)}>
                  Prev
                </Button>

                {Array.from({ length: Math.ceil(recentViews.length / itemsPerPage) }, (_, i) => (
                  <Button
                    key={i + 1}
                    size="sm"
                    variant={recentViewsPage === i + 1 ? "default" : "ghost"}
                    className={recentViewsPage === i + 1 ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                    onClick={() => setRecentViewsPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={recentViewsPage === Math.ceil(recentViews.length / itemsPerPage)}
                  onClick={() => setRecentViewsPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* You Might Like */}
        {!recomendationsLoading && recommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">You Might Like</h3>
              <Button variant="link" className="text-blue-600 hover:text-blue-800">See All →</Button>
            </div>

            {/* Mobile Swiper for recommendations (full-bleed) */}
            <MobileSwiper
              items={recommendations}
              renderItem={(product: any) => <ProductCard product={product} />}
              swiperRef={recommendationsSwiperRef}
              prevClass="recommendations-prev"
              nextClass="recommendations-next"
            />

            {/* Desktop Grid */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {pagedRecommendations.map((product: any) => (
                  <div key={product._id} className="h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Desktop Pagination */}
              {recommendations.length > itemsPerPage && (
                <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
                  <Button variant="ghost" size="sm" disabled={recommendationsPage === 1} onClick={() => setRecommendationsPage((prev) => prev - 1)}>
                    Prev
                  </Button>

                  {Array.from({ length: Math.ceil(recommendations.length / itemsPerPage) }, (_, i) => (
                    <Button
                      key={i + 1}
                      size="sm"
                      variant={recommendationsPage === i + 1 ? "default" : "ghost"}
                      className={recommendationsPage === i + 1 ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                      onClick={() => setRecommendationsPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={recommendationsPage === Math.ceil(recommendations.length / itemsPerPage)}
                    onClick={() => setRecommendationsPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uncomment modals when components exist */}
        {/* <ActivitiesModal isOpen={showActivitiesModal} onClose={() => setShowActivitiesModal(false)} />
            <AddFundsModal isOpen={showAddFundsModal} onClose={() => setShowAddFundsModal(false)} /> */}
      </div>
    </div>
  );
}
