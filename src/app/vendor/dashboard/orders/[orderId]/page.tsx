"use client";

import React from "react";
import Image from "next/image";
import {
  CheckCircle,
  CreditCard,
  LoaderCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader,
} from "lucide-react";
import { useOrderById } from "@/hooks/queries";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import OrderDetailsSkeleton from "../(components)/OrderDetailsSkeleton";
import { getCurrencySymbol } from "@/utils/currency";

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border rounded-[20px] shadow-sm border-gray-300 ${className}`}
  >
    {children}
  </div>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`${className}`}>{children}</div>;

export default function OrderDetailsPage() {
  const [vendorShippingState, setVendorShippingState] =
    React.useState<string>("Reviewing Order");
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { data: order, isLoading } = useOrderById(orderId);
  const { listedProducts } = useProductStore();

  if (isLoading) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <p>Order not found</p>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-700";
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-700";
    return status === "completed"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";
  };

  const handleShippingStateChange = (newState: string) => {
    setVendorShippingState(newState);
    setShowDropdown(false);
  };

  console.log(listedProducts, "Listed Products");

  return (
    <div className="bg-white p-4 md:p-4 lg:p-10 h-full w-full">
      <button
        onClick={() => router.back()}
        className="flex items-center text-xs text-gray-600 hover:text-gray-800 mb-4 cursor-pointer hover:underline"
        aria-label="Back to Orders"
        title="Back to Orders"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Orders
      </button>

      <div className="flex gap-4 ">
        <h1 className="text-lg font-semibold truncate">
          {order?._id ? (
            <span className="block md:hidden">
              Order # {order._id.slice(0, 12)}...
            </span>
          ) : (
            "N/A"
          )}
          <span className="hidden md:inline">Order # {order?._id}</span>
        </h1>

        <span
          className={`inline-flex h-6 items-center gap-1 self-start rounded-full px-2 text-xs font-medium ${getStatusColor(
            order?.status
          )}`}
        >
          <CheckCircle className="h-3 w-3" /> {order?.status}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full mb-4 gap-3">
        <div className="flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:gap-4">
          <div>
            Order placed{" "}
            <span className="font-medium text-gray-800">
              {new Date(order?.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div>
            Purchased:{" "}
            <span className="font-medium text-gray-800">via website</span>
          </div>
        </div>
        <div className="self-start lg:self-auto">
          <div className="bg-primary text-white rounded-md text-xs font-medium">
            <div className="flex items-center relative">
              <div className="p-2 border-r whitespace-nowrap">
                {vendorShippingState}
              </div>
              {!showDropdown ? (
                <ChevronDown
                  className="size-5 cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              ) : (
                <ChevronUp
                  className="size-5 cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              )}
              {showDropdown && (
                <div className="border border-gray-500 rounded-lg bg-white mt-2 shadow-lg absolute z-10 top-7 lg:right-0 right-[-22] w-40 text-gray-800">
                  <h3 className="text-[#2563EB] pt-3 px-2 pb-1 border-b border-b-black">
                    Order Status
                  </h3>
                  <div
                    onClick={() => handleShippingStateChange("Reviewing Order")}
                    className="text-xs hover:bg-gray-100 cursor-pointer px-2 py-1 border-b border-gray-200"
                  >
                    Reviewing Order
                  </div>
                  <div
                    onClick={() =>
                      handleShippingStateChange("Preparing Shipment")
                    }
                    className="text-xs hover:bg-gray-100 cursor-pointer px-2 py-1 border-b border-gray-200"
                  >
                    Preparing Shipment
                  </div>
                  <div
                    onClick={() => handleShippingStateChange("Shipped")}
                    className="text-xs hover:bg-gray-100 hover:rounded-b-lg cursor-pointer px-2 py-1"
                  >
                    Shipped
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <div className="flex flex-col justify-between md:text-sm sm:flex-row bg-[#f1f4f9] rounded-t-[20px] px-4 py-2 border-b border-gray-300 text-xs">
            <p>
              Delivering to{" "}
              <span className="font-medium">
                {order?.shipping?.address?.street},{" "}
                {order?.shipping?.address?.city},{" "}
                {order?.shipping?.address?.state},{" "}
                {order?.shipping?.address?.country}
              </span>
            </p>
            <p className="text-gray-500">
              Estimated arrival on:{" "}
              <span className="font-medium text-black">
                {new Date(
                  order?.shipping?.estimatedDelivery
                ).toLocaleDateString()}
              </span>
            </p>
          </div>
          <div className="px-4 py-3">
            <div className="space-y-3">
              {/* Status Labels */}
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-600">
                  {vendorShippingState === "Reviewing Order" && (
                    <Loader className="inline-block size-4 mr-1 text-blue-500" />
                  )}
                  Reviewing Order
                </span>
                <span className="text-xs text-gray-600">
                  {vendorShippingState === "Preparing Shipment" && (
                    <LoaderCircle className="inline-block size-4 mr-1 text-yellow-500" />
                  )}
                  Preparing Shipment
                </span>
                <span className="text-xs text-gray-600">
                  {vendorShippingState === "Shipped" && (
                    <CheckCircle className="inline-block size-4 mr-1 text-green-500" />
                  )}
                  Shipped
                </span>
              </div>
              {/* Progress Bars */}
              <div className="flex gap-2 mb-2">
                <div
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: "#d3e1fe" }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        vendorShippingState === "Reviewing Order" ||
                        vendorShippingState === "Preparing Shipment" ||
                        vendorShippingState === "Shipped"
                          ? "#2563eb"
                          : "#d3e1fe",
                      width:
                        vendorShippingState === "Reviewing Order" ||
                        vendorShippingState === "Preparing Shipment" ||
                        vendorShippingState === "Shipped"
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
                <div
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: "#d3e1fe" }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        vendorShippingState === "Preparing Shipment" ||
                        vendorShippingState === "Shipped"
                          ? "#2563eb"
                          : "#d3e1fe",
                      width:
                        vendorShippingState === "Preparing Shipment" ||
                        vendorShippingState === "Shipped"
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
                <div
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: "#d3e1fe" }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        vendorShippingState === "Shipped"
                          ? "#2563eb"
                          : "#d3e1fe",
                      width: vendorShippingState === "Shipped" ? "100%" : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mb-4">
        <h2 className="text-lg font-semibold mt-4 mb-2 border-b border-gray-200 pb-2">
          Order Items
        </h2>

        {order?.items?.map((item: any, index: number) => (
          <div className="border-b border-gray-200" key={index}>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-5">
                <div className="bg-[#f1f4f9] w-40 h-30 flex items-center rounded-md justify-center p-2">
                  <img
                    src={item.productId?.images[0] || "/placeholder.png"}
                    alt={item.productId?.name}
                    className="w-full h-full object-cover rounded-md"
                    // style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-gray-800">
                    {item.productId?.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    SKU: {item.variantId || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {listedProducts
                      ?.find(
                        (product: any) => product._id === item.productId?._id
                      )
                      ?.variants?.flatMap((v) => v.options)
                      ?.find((option) => option.sku === item.variantId)
                      ?.value || "Unknown Option"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {getCurrencySymbol(order.payment.currency)}
                {item.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4 w-full">
        <h2 className="text-lg font-semibold">
          <CreditCard className="h-6 w-6 text-gray-600 mr-1 inline-block" />{" "}
          Payment Details
        </h2>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {[
            {
              label: "Payment Method",
              value: order?.payment?.method?.toUpperCase(),
            },
            {
              label: "Payment Status",
              value: (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                    order?.payment?.status
                  )}`}
                >
                  {order?.payment?.status}
                </span>
              ),
            },
            {
              label: "Subtotal",
              value: order?.payment?.amount?.toLocaleString("en-US", {
                style: "currency",
                currency: order?.payment?.currency || "USD",
              }),
            },
            {
              label: "Order Status",
              value: (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    order?.status
                  )}`}
                >
                  {order?.status}
                </span>
              ),
            },
            {
              label: "Shipping Fee",
              value: "Free",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center justify-between px-4 py-3 ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } ${index < 4 ? "border-b border-gray-200" : ""} ${index === 0 ? "rounded-t-lg" : ""} ${index === 4 ? "rounded-b-lg" : ""}`}
            >
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
