"use client";

import React from "react";
import AnalyticsCard from "../(components)/AnalyticsCard";
import OrderTable from "./(components)/OrderTable";
import { useVendorOrders } from "@/hooks/useVendor";
import { useVendorAnalytics } from "@/hooks/queries";
import AnalyticsCardSkeleton from "../(components)/skeletons/AnalyticsCardSkeleton";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {};

const page = (props: Props) => {
  const { vendor } = useVendorStore();

  if (!vendor) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-roboto">
        <div className="px-2 lg:px-5">
          <h1 className="text:base md:text-lg font-semibold">My Orders</h1>
          <p className="text-xs text-gray-800 font-roboto">
            Please login to view your orders.
          </p>
        </div>
      </div>
    );
  }

  const { data: analyticsData, isLoading: analyticsLoading } =
    useVendorAnalytics(vendor?._id || "");
  const { data: ordersData } = useVendorOrders(vendor?._id || "");
  const vendorCurrency = ordersData?.vendorCurrency || analyticsData?.currency || '';

  return (
    <div className="bg-[#f6f6f6] rounded-lg font-light shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-roboto">
      <div className="px-2 lg:px-5">
        <h1 className="text-base **:md:text-lg font-semibold">My Orders</h1>
        <p className="text-xs text-gray-800 font-roboto">
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
                  value={analyticsData?.dashboard?.totalOrders?.value || 0}
                  percentageIncrease={analyticsData?.dashboard?.totalOrders}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Total Sales"
                  amount={analyticsData?.dashboard?.salesTotal?.value || 0}
                  currency={vendorCurrency}
                  percentageIncrease={analyticsData?.dashboard?.salesTotal}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Avg Orders/Day"
                  value={analyticsData?.dashboard?.averageOrdersPerDay || 0}
                />
              </div>
              <div className="col-span-3">
                <AnalyticsCard
                  title="Total Products"
                  value={analyticsData?.dashboard?.totalProducts?.value || 0}
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
