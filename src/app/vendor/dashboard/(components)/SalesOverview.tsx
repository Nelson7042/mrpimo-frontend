"use client";

import { Plus } from "lucide-react";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useVendorAnalytics } from "@/hooks/queries";
import { getCurrencySymbol } from "@/utils/currency";

type Props = {
  vendorId: string;
};

const SalesOverview = (props: Props) => {
  const [timeRange, setTimeRange] = useState("7days");
  const { data, isLoading } = useVendorAnalytics(
    props.vendorId,
    `${timeRange}`
  );

  return (
    <div className="bg-white px-4 md:px-6 py-4 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="font-bold text-xl md:text-2xl text-gray-600">
          Sales Overview
        </h1>
        <select
          className="border rounded-full px-3 py-1 text-sm bg-gray-100 text-gray-600 outline-none w-full sm:w-auto cursor-pointer disabled:opacity-50"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          disabled={isLoading}
        >
          <option value="7days">Last 7 days</option>
          <option value="1month">Last 1 month</option>
          <option value="6months">Last 6 months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 border-b border-b-gray-100 pb-4">
        {isLoading && (
          <div className="col-span-full text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Total Sales</p>
          {data?.analytics && (
            <p className="text-xl md:text-2xl font-bold">
              {getCurrencySymbol(data?.analytics?.currency)}
              {data?.analytics?.totalSales?.toFixed(2) || "0.00"}
            </p>
          )}
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-xl md:text-2xl font-bold">
            {data?.analytics?.totalOrders || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500">Avg. Order Value</p>
          <p className="text-xl md:text-2xl font-bold">
            {data?.analytics?.averageOrdersPerDay}
          </p>
        </div>
      </div>

      {data?.salesOverview ? (
        <div className="h-64 sm:h-80 w-full overflow-x-auto">
          <div className="min-w-[500px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.salesOverview}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 px-4 animate-fade-in">
          {!isLoading && (
            <>
              <p className="text-lg font-semibold text-gray-700 mb-1">
                No sales made yet
              </p>
              <p className="text-sm text-gray-500">
                Keep an eye out—we’ll notify you when things get moving!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesOverview;
