"use client";

import { useVendorOrders } from "@/hooks/queries";
import { useProductStore } from "@/stores/useProductStore";
import { ChevronDown, Eye, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import OrderTableSkeleton from "./OrderTableSkeleton";
import { useRouter } from "next/navigation";

type Props = {};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "refunded":
      return "bg-purple-100 text-purple-800";
    case "shipped":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderTable = (props: Props) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const { vendor } = useProductStore();
  const { data, isLoading } = useVendorOrders(vendor?._id!);

  const router = useRouter();

  useEffect(() => {
    if (data) {
      setOrders(data.orders);
    }
  }, [data]);

  if (isLoading) {
    return <OrderTableSkeleton />;
  }

  const handleStatusFilter = (status: string) => {
    setOrders(
      status === "All"
        ? data.orders
        : data.orders.filter(
            (order: any) => order.status.toLowerCase() === status.toLowerCase()
          )
    );
    setShowStatusDropdown(false);
  };

  return (
    <div className="mt-8 rounded-lg shadow-sm">
      <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-4 p-5 border-b border-gray-200 bg-white text-xs">
        <div className="relative col-span-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search orders"
          />
        </div>

        <div className="relative col-span-3">
          <input
            type="date"
            className="border border-gray-200 rounded-md px-3 py-2 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="relative col-span-3">
          <div
            className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span className="text-xs mr-2">Status</span>
            {!showStatusDropdown ? (
              <ChevronDown size={16} className="ml-2 text-gray-400" />
            ) : (
              <ChevronDown
                size={16}
                className="ml-2 text-gray-400 rotate-180"
              />
            )}
          </div>

          {showStatusDropdown && (
            <div className="absolute mt-1 w-36 md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <ul className="py-1">
                {[
                  "All",
                  "Pending",
                  "Confirmed",
                  "Shipped",
                  "Delivered",
                  "Cancelled",
                  "Refunded",
                ].map((status) => (
                  <li
                    key={status}
                    onClick={() => handleStatusFilter(status)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 capitalize"
                  >
                    {status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-5 shadow-md">
        <table className="min-w-full bg-white text-xs">
          <thead>
            <tr className="bg-[#f2f7ff] text-black">
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
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders &&
              orders.length > 0 &&
              orders.map((order) => (
                <tr key={order?._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                    {`${order._id.slice(0, 15)}...`}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {order?.user?.profile?.firstName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-900">
                    {order.payment.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}{" "}
                    {order.payment.currency}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
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
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                        order?.status
                      )}`}
                    >
                      {order?.status?.charAt(0).toUpperCase() +
                        order?.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {order?.items?.length} item(s)
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    <button
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                      onClick={() => {
                        router.push(`/vendor/dashboard/orders/${order._id}`);
                      }}
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {orders && orders.length === 0 && (
          <div className="px-4 py-4 whitespace-nowrap text-lg font-medium text-gray-900 text-center w-full">
            No orders found!
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-4">
        {orders && orders.length > 0 && orders.map((order) => (
          <div
            key={order?._id}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{order?._id}</span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                  order?.status
                )}`}
              >
                {order?.status.charAt(0).toUpperCase() + order?.status.slice(1)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-medium">Customer:</span>{" "}
              {order?.user?.profile?.firstName}
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-medium">Amount:</span>
              {order.payment.amount.toLocaleString("en-US", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{" "}
              {order.payment.currency}
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-medium">Date:</span>{" "}
              {new Date(order?.createdAt).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-medium">Items:</span>{" "}
              {order?.items?.length || 0} item(s)
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-underline"
                onClick={() =>
                  router.push(`/vendor/dashboard/orders/${order._id}`)
                }
              >
                <Eye size={16} />
                <span className="text-xs">View Details</span>
              </button>
            </div>
          </div>
        ))}
        {orders && orders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-lg font-medium text-gray-900">No orders found!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTable;
