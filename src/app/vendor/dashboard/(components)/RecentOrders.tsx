"use client";
import { useVendorOrders, useVendorProducts } from "@/hooks/queries";
import { ArrowRight, Box, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useRouter } from "next/navigation";
import RecentOrdersSkeleton from "./skeletons/RecentOrdersSkeleton";
import { useVendorStore } from "@/stores/useVendorStore";

type Item = {
  product: string;
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  items: Item[];
  status: "pending" | "processing" | "delivered" | "cancelled";
  createdAt?: string;
};

const RecentOrders = ({ currency }: { currency: string}) => {
  const { vendor } = useVendorStore();
  const { data: products } = useVendorProducts(vendor?._id!);
  const { data, isLoading: isOrderdsLoading } = useVendorOrders(vendor?._id!);
  const router = useRouter();

  console.log("Data: ", data)

  const calculateOrderAmount = (items: Item[]) => {
    items.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);
  };

  if (isOrderdsLoading) {
    return <RecentOrdersSkeleton />
  }

  return (
    <div className="bg-white px-6 py-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-bold text-2xl text-gray-600">Recent Orders</h1>
        {data && data.orders && data.orders?.length > 0 && (
          <button
            className="flex cursor-pointer text-blue-600 text-sm items-center disabled:cursor-not-allowed"
            disabled={isOrderdsLoading}
          >
            <div>View All</div>
            <ArrowRight size={16} className="ml-1" />
          </button>
        )}
      </div>

      {data && data.orders && data.orders?.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data &&
                  data.orders?.map((order: any) => (
                    <tr key={order?._id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order?._id.length > 15
                          ? `${order._id.slice(0, 15)}...`
                          : order._id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order?.user?.profile?.firstName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order?.payment?.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{" "}
                        {currency}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order?.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      order?.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order?.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : order?.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                        >
                          {order?.status.charAt(0).toUpperCase() +
                            order?.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order?.items.length} item(s)
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() =>
                            router.push(`/vendor/dashboard/orders/${order._id}`)
                          }
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {data &&
              data.orders?.map((order: any) => (
                <div
                  key={order._id}
                  className="bg-white border rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{order.id}</span>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "processing"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">Customer:</span>{" "}
                    {order?.user?.profile?.firstName}
                  </div>
                  {order?.amount && (
                    <div className="text-sm text-gray-500 mb-1">
                      <span className="font-medium">Amount:</span> $
                      {order.amount.toFixed(2)}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">Address:</span>{" "}
                    {order.address}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span className="font-medium">
                      {order.items.length} items
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() =>
                        router.push(`/vendor/dashboard/orders/${order._id}`)
                      }
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"
                    >
                      <FaEye size={14} /> View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
      {data && data.orders && data.orders?.length === 0 && (!products || products.length === 0) && (
        <div className="flex flex-col justify-center items-center gap-y-5 h-40">
          <p className="font-semibold text-2xl">No data available</p>
          <p className="text-sm text-gray-500">Add a product to get started</p>
          <div className="">
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg flex gap-x-2 items-center hover:bg-blue-700 transition-colors cursor-pointer"
              onClick={() => router.push('/vendor/dashboard/products/create-product')}
            >
              Add Product
              <Plus size={24} />
            </button>
          </div>
        </div>
      )}

      {data && data.orders && data.orders?.length === 0 && products?.length > 0 && (
        <div className="text-center py-10 px-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 animate-fade-in">
          <Box size={24} className="mx-auto text-gray-500 mb-2" />
          <p className="text-lg font-semibold text-gray-700 mb-1">
            No orders yet
          </p>
          <p className="text-sm text-gray-500">
            Keep an eye out—we’ll notify you when things get moving!
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
