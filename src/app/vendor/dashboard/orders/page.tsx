"use client";

import React from "react";
import AnalyticsCard from "../(components)/AnalyticsCard";
import OrderTable from "./(components)/OrderTable";
import { useVendorOrders, useVendorAnalytics } from "@/hooks/useVendor";
import AnalyticsCardSkeleton from "../(components)/skeletons/AnalyticsCardSkeleton";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {};

const page = (props: Props) => {
  const { vendor } = useVendorStore();

  if (!vendor) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
        <div className="px-2 lg:px-5">
          <h1 className="text-lg font-semibold">My Orders</h1>
          <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
            Please login to view your orders.
          </p>
        </div>
      </div>
    );
  }

  const { data: analyticsData, isLoading: analyticsLoading } = useVendorAnalytics(vendor?._id!);

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-[family-name:var(--font-alexandria)]">
      <div className="px-2 lg:px-5">
        <h1 className="text-lg font-semibold">My Orders</h1>
        <p className="text-xs text-gray-800 font-[family-name:var(--font-poppins)]">
          Latest orders in real time
        </p>
        <div className="grid md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-12 gap-4 mt-5">
          {analyticsLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="col-span-3">
                  <AnalyticsCardSkeleton />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Total Orders"
                  value={analyticsData?.analytics?.totalOrders?.value || 0}
                  percentageIncrease={analyticsData?.analytics?.totalOrders?.percentageIncrease}
                  period={analyticsData?.analytics?.totalOrders?.period}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Completed Orders"
                  value={analyticsData?.analytics?.completedOrders?.value || 0}
                  percentageIncrease={analyticsData?.analytics?.completedOrders?.percentageIncrease}
                  period={analyticsData?.analytics?.completedOrders?.period}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Pending Orders"
                  value={analyticsData?.analytics?.pendingOrders?.value || 0}
                  percentageIncrease={analyticsData?.analytics?.pendingOrders?.percentageIncrease}
                  period={analyticsData?.analytics?.pendingOrders?.period}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Cancelled Orders"
                  value={analyticsData?.analytics?.cancelledOrders?.value || 0}
                  percentageIncrease={analyticsData?.analytics?.cancelledOrders?.percentageIncrease}
                  period={analyticsData?.analytics?.cancelledOrders?.period}
                />
              </div>
            </>
          )}
        </div>

        {/* Orders Table */}
        <OrderTable />
      </div>
    </div>
  );
};

export default page;
