"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
  LogIn,
  LogOut,
  MapPin,
  Bell,
  Mail,
  Lock,
  User,
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
import { parseUserAgent } from "@/utils/parseUserAgent";
import { useUserStore } from "@/stores/useUserStore";

/**
 * Refactored DashboardPage
 * - Fixes mobile swiper layout by placing swipers in full-bleed wrappers
 * - Deduplicates swiper configuration via MobileSwiper component
 * - Keeps original hooks and logic intact
 */

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [recentViewsPage, setRecentViewsPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);

  const itemsPerPage = 4;
  const router = useRouter();

  const recentViewsSwiperRef = useRef<any>(null);
  const recommendationsSwiperRef = useRef<any>(null);

  const userFromStore = useUserStore((state) => state.user);
  
  // Client-side auth check
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    
    if (!userFromStore && !accessToken && !refreshToken) {
      router.push('/home');
    }
  }, [userFromStore, router]);
  
  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const { data: recentViewsData, isLoading: viewsLoading } = useRecentViews(8);
  const { data: recomendationsData, isLoading: recomendationsLoading } =
    useRecomendations(8, true);
  const { data: activitiesData, isLoading: activitiesLoading } =
    useUserRecentActivities(activitiesPage, 10);

  const recentViews = recentViewsData?.recentViews || [];
  const recommendations = recomendationsData?.products || [];

  // Use Zustand store as fallback when API hasn't loaded
  const user = profileData?.user || userFromStore;
  const shippingAddress = profileData?.shippingDefaultAddress || userFromStore?.addresses?.find((a: any) => a.isDefault && a.type === 'shipping');
  const fiatWallet = profileData?.fiatWallet;

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
    if (text.includes("login") || text.includes("logged in")) {
      return <LogIn className="w-5 h-5 text-green-600" />;
    } else if (text.includes("logout") || text.includes("logged out")) {
      return <LogOut className="w-5 h-5 text-gray-600" />;
    } else if (text.includes("order") || text.includes("purchased")) {
      return <ShoppingCart className="w-5 h-5 text-green-600" />;
    } else if (text.includes("bid")) {
      return <Gavel className="w-5 h-5 text-purple-600" />;
    } else if (text.includes("offer")) {
      return <Tag className="w-5 h-5 text-orange-600" />;
    } else if (text.includes("won")) {
      return <Trophy className="w-5 h-5 text-yellow-600" />;
    } else if (text.includes("address")) {
      return <MapPin className="w-5 h-5 text-blue-600" />;
    } else if (text.includes("notification")) {
      return <Bell className="w-5 h-5 text-purple-600" />;
    } else if (text.includes("email")) {
      return <Mail className="w-5 h-5 text-blue-600" />;
    } else if (text.includes("password")) {
      return <Lock className="w-5 h-5 text-red-600" />;
    } else if (text.includes("profile")) {
      return <User className="w-5 h-5 text-blue-600" />;
    } else {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  // Format activity text to be more human-readable
  const formatActivityText = (activity: string): string => {
    if (!activity) return "Unknown activity";
    
    // Map of activity codes to human-readable text
    const activityMap: { [key: string]: string } = {
      "user_login": "Logged in",
      "user_logout": "Logged out",
      "address_added": "Added new address",
      "address_modified": "Updated address",
      "address_deleted": "Deleted address",
      "order_created": "Placed an order",
      "notification_preferences_updated": "Updated notification settings",
      "email_change_initiated": "Initiated email change",
      "password_changed": "Changed password",
      "profile_updated": "Updated profile",
    };

    // Check if it's a known activity code
    const lowerActivity = activity.toLowerCase();
    for (const [code, text] of Object.entries(activityMap)) {
      if (lowerActivity.includes(code.toLowerCase())) {
        return text;
      }
    }

    // If it starts with "User logged", it's already formatted
    if (activity.startsWith("User logged")) {
      return activity.replace("User logged in", "Logged in").replace("User logged out", "Logged out");
    }

    // Return as-is if no mapping found
    return activity;
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="font-roboto text-lg sm:text-xl font-bold mb-2 break-words">
          Hello, {user?.profile?.firstName || "User"}
        </h1>
        <p className="font-roboto text-gray-600 text-xs sm:text-sm leading-relaxed break-words max-w-full">
          Welcome to your Shopping Command Centre! Easily manage your orders,
          wishlist, and explore tailored deals in one convenient hub.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Account Info */}
        <Card className="p-0 rounded-none ">
          <CardContent className="p-0 rounded-none">
            <div className="flex items-center justify-between mb-4 p-2 bg-primary">
              <h3 className="font-roboto font-medium text-white text-xs md:text-sm">ACCOUNT INFO</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/home/user/settings")}
                className="hover:bg-white/20"
              >
                <Edit className="w-4 h-4 text-white" />
              </Button>
            </div>
            <div className="space-y-2 p-2">
              <div className="flex flex-col gap-1">
                <span className="font-roboto text-xs text-gray-600">Full Name</span>
                <p className="font-roboto text-xs font-medium">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-roboto text-xs text-gray-600">Email Address</span>
                <p className="font-roboto text-xs font-medium break-all">{user?.email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-roboto text-xs text-gray-600">Phone Number</span>
                <p className="font-roboto text-xs font-medium">
                  {user?.profile?.phoneNumber || "Not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="p-0 rounded-none ">
          <CardContent className="p-0 rounded-none">
            <div className="flex items-center justify-between mb-4 p-2 bg-primary">
              <h3 className="font-roboto font-medium text-white text-xs md:text-sm">
                SHIPPING ADDRESS
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push("/home/user/settings")}
                className="hover:bg-white/20"
              >
                <Edit className="w-4 h-4 text-white" />
              </Button>
            </div>
            <div className="space-y-3 p-2">
              {shippingAddress ? (
                <>
                  <div className="flex gap-1">
                    <span className="font-roboto text-xs text-gray-600">Street:</span>
                    <p className="font-roboto text-xs">{shippingAddress.street}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-roboto text-xs text-gray-600">City:</span>
                    <p className="font-roboto text-xs">{shippingAddress.city}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-roboto text-xs text-gray-600">State:</span>
                    <p className="font-roboto text-xs">{shippingAddress.state}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-roboto text-xs text-gray-600">Country:</span>
                    <p className="font-roboto text-xs">{shippingAddress.country}</p>
                  </div>
                  {shippingAddress.postalCode && (
                    <div className="flex items-center gap-1">
                      <span className="font-roboto text-xs text-gray-600">Postal Code:</span>
                      <p className="font-roboto text-xs">{shippingAddress.postalCode}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="font-roboto text-xs text-gray-500">No shipping address added</p>
              )}
            </div>
          </CardContent>
          {!profileData?.shippingDefaultAddress && (
            <div className="p-2 border-t">
              <Button
                className="font-roboto cursor-pointer w-full bg-primary hover:bg-primary/90 text-xs"
                onClick={() => router.push("/home/user/settings")}
              >
                Add Shipping Address
              </Button>
            </div>
          )}
        </Card>

        {/* Credit Balance */}
        <Card className="p-0 rounded-none relative">
          <CardContent className="p-0 rounded-none">
            <div className="flex items-center justify-between mb-4 p-2 bg-primary">
              <h3 className="font-roboto font-medium text-white text-xs md:text-sm">
                CREDIT BALANCE
              </h3>
            </div>
            <div className="space-y-2 p-4 pb-16">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-roboto text-xs text-gray-600">Balance:</span>
                  <p className="font-roboto font-bold text-xs sm:text-sm break-all">
                    {showBalance
                      ? `${fiatWallet?.currency || ""} ${parseFloat(fiatWallet?.balances?.available.toString() || "0").toFixed(2)}`
                      : `******`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? (
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
              <Link href={"/home/user/wallet"}>
                <Button
                  className="font-roboto cursor-pointer w-[95%] bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs"
                >
                  Add Funds
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      {!activitiesLoading && activitiesData?.activities?.length > 0 && (
      <Card className="mb-8 py-3 ">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-roboto font-bold text-base">Recent Activities</h3>
            <Button
              variant="link"
              className="font-roboto primary hover:text-primary/80 text-xs"
              onClick={() => setShowActivitiesModal(true)}
            >
              See All →
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-gray-600">
                  <th className="font-roboto pb-3">SN</th>
                  <th className="font-roboto pb-3">ACTIVITIES</th>
                  <th className="font-roboto pb-3 hidden sm:table-cell">TIME</th>
                  <th className="font-roboto pb-3 hidden sm:table-cell">DATE</th>
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
                  activitiesData.activities.map(
                    (activity: any, index: number) => {
                      const activityDate = new Date(activity.timestamp);
                      const activityTime = activityDate.toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      );
                      const activityDateStr = activityDate.toLocaleDateString(
                        "en-US",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      );

                 
                      // Parse device information from metadata
                      const metadata = activity.metadata || {};
                      const userAgent = metadata.userAgent || '';
                      const location = metadata.location || 'Unknown';
                      const deviceType = metadata.device || 'desktop';
                      
                      // Use browser/os from metadata if available (backend now stores these)
                      // Otherwise parse from user agent
                      let browser = metadata.browser;
                      let os = metadata.os;
                      
                      if (!browser || !os) {
                        const parsed = parseUserAgent(userAgent);
                        browser = browser || parsed.browser;
                        os = os || parsed.os;
                      }
                      
                      // Extract base activity (remove the old "from X on Y with Z" part)
                      const baseActivity = activity.activity?.split(' from ')[0] || activity.activity;
                      const formattedActivity = formatActivityText(baseActivity);

                      return (
                        <tr
                          key={activity.id || activity._id || index}
                          className="border-b"
                        >
                          <td className="py-3">
                            <span className="font-roboto text-xs font-medium">{index + 1}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center space-x-3">
                              {getActivityIcon(baseActivity)}
                              <div className="flex flex-col">
                                <span className="font-roboto text-xs font-medium">
                                  {formattedActivity}
                                </span>
                                <span className="font-roboto text-[10px] text-gray-500">
                                  {location} • {browser} on {os} ({deviceType})
                                </span>
                                <div className="font-roboto sm:hidden text-[10px] text-gray-500 mt-1">
                                  {activityTime} • {activityDateStr}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="font-roboto py-3 text-xs hidden sm:table-cell">
                            {activityTime}
                          </td>
                          <td className="font-roboto py-3 text-xs hidden sm:table-cell">
                            {activityDateStr}
                          </td>
                        </tr>
                      );
                    }
                  )
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
          {activitiesData?.pagination &&
            activitiesData.pagination.pages > 1 && (
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
      )}

      {/* Recent Views */}
      {recentViews.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-roboto font-bold text-base">Recent Views</h3>
            <Button
              variant="link"
              className="font-roboto primary hover:text-primary/80 text-xs"
            >
              See All →
            </Button>
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
              <Button
                variant="ghost"
                size="sm"
                disabled={recentViewsPage === 1}
                onClick={() => setRecentViewsPage((prev) => prev - 1)}
              >
                Prev
              </Button>

              {Array.from(
                { length: Math.ceil(recentViews.length / itemsPerPage) },
                (_, i) => (
                  <Button
                    key={i + 1}
                    size="sm"
                    variant={recentViewsPage === i + 1 ? "default" : "ghost"}
                    className={
                      recentViewsPage === i + 1
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : ""
                    }
                    onClick={() => setRecentViewsPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                )
              )}

              <Button
                variant="ghost"
                size="sm"
                disabled={
                  recentViewsPage ===
                  Math.ceil(recentViews.length / itemsPerPage)
                }
                onClick={() => setRecentViewsPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* You Might Like */}
      {!recomendationsLoading && recommendations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-roboto font-bold text-base">You Might Like</h3>
            <Button
              variant="link"
              className="font-roboto primary hover:text-primary/80 text-xs"
            >
              See All →
            </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={recommendationsPage === 1}
                  onClick={() => setRecommendationsPage((prev) => prev - 1)}
                >
                  Prev
                </Button>

                {Array.from(
                  { length: Math.ceil(recommendations.length / itemsPerPage) },
                  (_, i) => (
                    <Button
                      key={i + 1}
                      size="sm"
                      variant={
                        recommendationsPage === i + 1 ? "default" : "ghost"
                      }
                      className={
                        recommendationsPage === i + 1
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : ""
                      }
                      onClick={() => setRecommendationsPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  )
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    recommendationsPage ===
                    Math.ceil(recommendations.length / itemsPerPage)
                  }
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
  );
}
