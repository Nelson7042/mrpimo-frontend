"use client";

import React, { useEffect, useState } from "react";
import AnalyticsCard from "./(components)/AnalyticsCard";
import AnalyticsCardSkeleton from "./(components)/skeletons/AnalyticsCardSkeleton";
import SalesOverview from "./(components)/SalesOverview";
import SalesOverviewSkeleton from "./(components)/skeletons/SalesOverviewSkeleton";
import SalesActivity from "./(components)/SalesActivity";
import SalesActivitySkeleton from "./(components)/skeletons/SalesActivitySkeleton";
import RecentOrders from "./(components)/RecentOrders";
import RecentOrdersSkeleton from "./(components)/skeletons/RecentOrdersSkeleton";
import { useSocket } from "@/hooks/useSocket";
import { useUserNotifications, useVendorAnalytics } from "@/hooks/queries";
import Link from "next/link";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {};

const Page = (props: Props) => {
  const { vendor } = useVendorStore();
  const socket = useSocket();
  const { data, isLoading } = useVendorAnalytics(vendor?._id!);

  const [vendorCurrency] = useState(
    data?.dashboard?.salesTotal?.currency || ""
  );

  useUserNotifications(true);

  useEffect(() => {
    if (!vendor || !socket) return;

    const handleConnect = () => {
      socket.emit("registerVendor", vendor._id);
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, vendor]);

  

  return (
    <div className="bg-[#f6f6f6] font-[family-name:var(--font-alexandria)]">
      <div className="p-4 md:p-10">
        <h1 className="font-bold text-2xl mb-2 md:mb-0">Dashboard</h1>
        <p className="mb-5 font-[family-name:var(--font-poppins)]">
          {`Hey ${vendor?.businessInfo?.name}, welcome back! Let’s take a look at what’s going on in your store today.`}
        </p>
        {vendor?.kycStatus !== "verified" && (
          <div className="">
            <div className="bg-[#f1f1f1] border border-[#e1e1e1] rounded-lg p-4 mb-5">
              <h2 className="font-bold text-lg mb-2">KYC Verification</h2>
              <p className="mb-4">
                Your KYC verification is {vendor?.kycStatus || 'pending'}. Please complete the KYC
                verification to be able to request payouts and access all
                features.
              </p>
              <Link href="/vendor/verification" className="text-blue-600 underline">
                {vendor?.kycStatus === 'pending' ? 'Continue' : 'Start'} KYC Process
              </Link>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {isLoading ? (
            <>
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
            </>
          ) : (
            <>
              <AnalyticsCard
                title="Sales Total"
                percentageIncrease={data?.dashboard?.salesTotal}
                amount={data?.dashboard?.salesTotal?.value}
                currency={data?.dashboard?.salesTotal?.currency}
              />
              <AnalyticsCard
                title="Total Orders"
                percentageIncrease={data?.dashboard?.totalOrders}
                value={data?.dashboard?.totalOrders?.value}
              />
              <AnalyticsCard
                title="Total Products"
                value={data?.dashboard?.totalProducts?.value}
              />
            </>
          )}
        </div>

        {/* Sales Overview & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">
          <div className="col-span-1 xl:col-span-8">
            {isLoading ? (
              <SalesOverviewSkeleton />
            ) : (
              <SalesOverview vendorId={vendor?._id!} />
            )}
          </div>
          <div className="col-span-1 xl:col-span-4">
            {isLoading ? <SalesActivitySkeleton /> : <SalesActivity />}
          </div>
        </div>

        {/* Recent Orders */}
        <RecentOrders currency={vendorCurrency} />
      </div>
    </div>
  );
};

export default Page;
