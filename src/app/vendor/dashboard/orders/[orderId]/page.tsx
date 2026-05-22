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
  Package,
  Copy,
  MapPin,
} from "lucide-react";
import { useOrderById } from "@/hooks/queries";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/stores/useProductStore";
import OrderDetailsSkeleton from "../(components)/OrderDetailsSkeleton";
import { getCurrencySymbol } from "@/utils/currency";
import { useUpdateOrderStatus } from "@/hooks/useVendor";
import { useEffect } from "react";
import { useVendorStore } from "@/stores/useVendorStore";
import FulfillmentActionPanel from "@/components/vendor/FulfillmentActionPanel";
import VoluntaryCancellation from "@/components/vendor/VoluntaryCancellation";
import VendorHandoffClaim from "@/components/vendor/VendorHandoffClaim";
import { IClientShipment } from "@/types/order.type";
import { toast } from "react-hot-toast";

// Helper function to calculate vendor-specific totals
const calculateVendorTotals = (orderItems: any[], vendorId: string) => {
  const vendorItems = orderItems.filter(item => 
    item.metadata?.vendorId === vendorId
  );

  if (vendorItems.length === 0) {
    return { totalAmount: 0, totalItems: 0, currency: 'USD' };
  }

  const totalAmount = vendorItems.reduce((sum, item) => {
    // Use amountInVendorCurrency if available (it's already the total for this item)
    // Otherwise fallback to vendorPrice * quantity
    const itemTotal = item.metadata?.amountInVendorCurrency || (item.vendorPrice || item.price) * item.quantity;
    return sum + itemTotal;
  }, 0);

  const totalItems = vendorItems.reduce((sum, item) => sum + item.quantity, 0);
  const currency = vendorItems[0]?.metadata?.vendorCurrency || vendorItems[0]?.metadata?.userCurrency || 'USD';

  return { totalAmount, totalItems, currency };
};

// Helper function to get currency symbol (matching OrderTable)
const getVendorCurrencySymbol = (currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'NGN': '₦',
    'GHS': '₵',
    'ZAR': 'R',
    'KES': 'KSh',
    'UGX': 'USh',
    'TZS': 'TSh',
    'RWF': 'RF',
    'XOF': 'CFA',
    'CNY': '¥',
    'HKD': 'HK$',
    'TWD': 'NT$',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
  };

  return currencySymbols[currency.toUpperCase()] || currency;
};

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
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { data: order, isLoading, refetch } = useOrderById(orderId);
  const { listedProducts } = useProductStore();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const { vendor } = useVendorStore();
  
  // Calculate vendor-specific totals
  const vendorTotals = order?.items ? calculateVendorTotals(order.items, vendor?._id || "") : { totalAmount: 0, totalItems: 0, currency: 'USD' };
  
  // Map order status to display status
  const getDisplayStatus = (status?: string): string => {
    if (!status) return "Preparing Shipment";
    const statusLower = status.toLowerCase();
    if (statusLower === "senttowarehouse" || statusLower === "shipped" || statusLower === "delivered") {
      return "Shipped";
    }
    return "Preparing Shipment";
  };

  // Map display status to API status
  const getApiStatus = (displayStatus: string): string => {
    if (displayStatus === "Shipped") {
      return "sentToWarehouse";
    }
    return "preparingOrder";
  };

  const [vendorShippingState, setVendorShippingState] =
    React.useState<string>(getDisplayStatus(order?.status));
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);

  // Update state when order data loads
  useEffect(() => {
    if (order?.status) {
      setVendorShippingState(getDisplayStatus(order.status));
    }
  }, [order?.status]);

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
    
    // Call API to update order status
    const apiStatus = getApiStatus(newState);
    updateOrderStatusMutation.mutate({
      orderId: orderId,
      status: apiStatus,
    });
  };

  return (
    <div className="bg-white p-4 md:p-4 lg:p-10 h-full w-full font-roboto">
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

        {order?.metadata?.isBidCheckout && (
          <span className="inline-flex h-6 items-center gap-1 self-start rounded-full px-2 text-xs font-medium bg-purple-100 text-purple-800">
            Auction
          </span>
        )}
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
            <span className="font-medium text-gray-800">
              {order?.metadata?.isBidCheckout ? "via auction" : "via website"}
            </span>
          </div>
        </div>
        <div className="self-start lg:self-auto">
          {order?.status?.toLowerCase() !== 'cancelled' && (
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
                <div className="border border-gray-500 rounded-lg bg-white mt-2 shadow-lg absolute z-10 top-7 lg:right-0 right-[-22] w-48 text-gray-800">
                  <h3 className="text-[#2563EB] pt-3 px-2 pb-1 border-b border-b-black">
                    Order Status
                  </h3>
                  <div
                    onClick={() =>
                      handleShippingStateChange("Preparing Shipment")
                    }
                    className="text-xs hover:bg-gray-100 cursor-pointer px-2 py-1 border-b border-gray-200"
                  >
                    Preparing Order
                  </div>
                  <div
                    onClick={() => handleShippingStateChange("Shipped")}
                    className="text-xs hover:bg-gray-100 hover:rounded-b-lg cursor-pointer px-2 py-1"
                  >
                    Sent to Warehouse
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Cancellation Reason */}
      {order?.status?.toLowerCase() === 'cancelled' && order?.cancellationReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-red-900 mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            Order Cancelled
          </h3>
          <p className="text-xs text-red-700">
            <span className="font-medium">Reason:</span> {order.cancellationReason}
          </p>
          {order?.cancelledAt && (
            <p className="text-xs text-red-600 mt-1">
              Cancelled on {new Date(order.cancelledAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* Auction Metadata Section */}
      {order?.metadata?.isBidCheckout && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-purple-900 mb-2">Auction Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-purple-700">Winning Bid Amount:</span>{" "}
              <span className="font-medium text-purple-900">
                {getVendorCurrencySymbol(vendorTotals.currency)}
                {vendorTotals.totalAmount.toFixed(2)}
              </span>
            </div>
            {order.metadata.auctionEndTime && (
              <div>
                <span className="text-purple-700">Auction End Date:</span>{" "}
                <span className="font-medium text-purple-900">
                  {new Date(order.metadata.auctionEndTime).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            <div>
              <span className="text-purple-700">Source:</span>{" "}
              <span className="font-medium text-purple-900">Auction</span>
            </div>
          </div>
        </div>
      )}

      {/* Fulfillment Countdown & Voluntary Cancellation — hidden for cancelled orders */}
      {order?.status?.toLowerCase() !== 'cancelled' && order?.shipments?.some((s: any) => {
        const vendorId = s.vendorId?._id || s.vendorId?.toString() || s.vendorId;
        return vendorId === vendor?._id && s.fulfillmentDeadline;
      }) && (
        <div className="mb-4">
          {order.shipments
            .filter((s: any) => {
              const vendorId = s.vendorId?._id || s.vendorId?.toString() || s.vendorId;
              return vendorId === vendor?._id && s.fulfillmentDeadline;
            })
            .map((shipment: any) => (
              <VoluntaryCancellation
                key={shipment._id}
                orderId={orderId}
                shipmentStatus={shipment.shipping?.status || "pending"}
                fulfillmentDeadline={shipment.fulfillmentDeadline}
                onCancellationComplete={() => refetch()}
              />
            ))}
        </div>
      )}

      {order?.status?.toLowerCase() !== 'cancelled' && (
      <Card>
        <CardContent className="space-y-2">
          <div className="flex flex-col justify-between md:text-sm sm:flex-row bg-[#f1f4f9] rounded-t-[20px] px-4 py-2 border-b border-gray-300 text-xs">
            <p>
              Delivering to{" "}
              <span className="font-medium">
                {order?.items?.[0]?.deliveryAddress?.street},{" "}
                {order?.items?.[0]?.deliveryAddress?.city},{" "}
                {order?.items?.[0]?.deliveryAddress?.state},{" "}
                {order?.items?.[0]?.deliveryAddress?.country}
              </span>
            </p>
            <p className="text-gray-500">
              Estimated arrival on:{" "}
              <span className="font-medium text-black">
                {order?.shipments?.[0]?.shipping?.estimatedDelivery
                  ? new Date(order.shipments[0].shipping.estimatedDelivery).toLocaleDateString()
                  : "N/A"}
              </span>
            </p>
          </div>
          <div className="px-4 py-3">
            <div className="space-y-3">
              {/* Status Labels */}
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-600">
                  {vendorShippingState === "Preparing Shipment" && (
                    <LoaderCircle className="inline-block size-4 mr-1 text-yellow-500" />
                  )}
                  {vendorShippingState === "Shipped" && (
                    <CheckCircle className="inline-block size-4 mr-1 text-green-500" />
                  )}
                  Preparing Order
                </span>
                <span className="text-xs text-gray-600">
                  {vendorShippingState === "Shipped" && (
                    <CheckCircle className="inline-block size-4 mr-1 text-green-500" />
                  )}
                  Sent to Warehouse
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
      )}

      <section className="mb-4">
        <h2 className="text-lg font-semibold mt-4 mb-2 border-b border-gray-200 pb-2">
          Order Items
        </h2>

        {order?.items?.map((item: any, index: number) => {
          // Calculate vendor-specific price for this item
          const isVendorItem = item.metadata?.vendorId === vendor?._id;
          // For individual item display, use vendorPrice (unit price) not amountInVendorCurrency (total)
          const itemPrice = isVendorItem ? (item.vendorPrice || item.price) : item.price;
          const itemCurrency = isVendorItem ? (item.metadata?.vendorCurrency || item.metadata?.userCurrency || 'USD') : 'USD';

          // Only show items that belong to this vendor
          if (!isVendorItem) return null;

          return (
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
                  {getVendorCurrencySymbol(itemCurrency)}
                  {itemPrice.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Shipment Fulfillment Section — hidden for cancelled orders */}
      {order?.status?.toLowerCase() !== 'cancelled' && order?.shipments && order.shipments.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-semibold mt-4 mb-2 border-b border-gray-200 pb-2">
            <Package className="h-5 w-5 text-gray-600 mr-1 inline-block" />{" "}
            Shipment Details
          </h2>

          {order.shipments.map((shipment: IClientShipment, index: number) => {
            // Only show shipments belonging to this vendor
            const shipmentVendorId = shipment.vendorId?._id || shipment.vendorId?.toString() || shipment.vendorId;
            if (shipmentVendorId !== vendor?._id) return null;

            const shippingStatus = shipment.shipping?.status?.toLowerCase();
            const fulfillmentMethod = shipment.shipping?.fulfillmentMethod;
            const showFulfillmentPanel = shippingStatus === "pending" || shippingStatus === "processing";
            const isDropoffPreparing = shippingStatus === "preparing_shipment" && fulfillmentMethod === "dropoff";
            const isPickupCompleted = shippingStatus === "preparing_shipment" && fulfillmentMethod === "pickup";

            return (
              <div key={shipment._id} className="mb-4">
                {order.shipments.length > 1 && (
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Shipment {index + 1}
                  </p>
                )}

                {/* Show FulfillmentActionPanel for pending/processing shipments */}
                {showFulfillmentPanel && (
                  <FulfillmentActionPanel
                    orderId={orderId}
                    shipment={shipment}
                    vendorId={vendor?._id || ""}
                    onFulfillmentComplete={() => refetch()}
                  />
                )}

                {/* Show handoff claim button for preparing_shipment status */}
                {shippingStatus === "preparing_shipment" && (
                  <VendorHandoffClaim
                    orderId={orderId}
                    shipmentId={shipment._id || ""}
                    shipmentStatus={shipment.shipping?.status || ""}
                    fulfillmentMethod={fulfillmentMethod || "pickup"}
                    handoffStatus={shipment.items?.[0]?.handoffStatus || "pending"}
                    onHandoffComplete={() => refetch()}
                  />
                )}

                {/* Show waybill for pickup shipments in preparing_shipment status */}
                {isPickupCompleted && shipment.shipping?.waybill && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-blue-700 font-medium">
                      Pickup — GIGL will send a rider to your location
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Waybill Number</p>
                        <p className="text-lg font-bold text-gray-900">
                          {shipment.shipping.waybill}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shipment.shipping.waybill!);
                          toast.success("Waybill copied to clipboard");
                        }}
                        className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                        aria-label="Copy waybill number"
                      >
                        <Copy className="h-4 w-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Show tempCode and Experience Centre for dropoff shipments in preparing_shipment status */}
                {isDropoffPreparing && (
                  <div className="space-y-3">
                    {shipment.shipping?.tempCode && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-green-700 font-medium">
                          Dropoff — Present this code at the Experience Centre
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Temp Code</p>
                            <p className="text-2xl font-bold text-gray-900 tracking-wider">
                              {shipment.shipping.tempCode}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(shipment.shipping.tempCode!);
                              toast.success("Temp code copied to clipboard");
                            }}
                            className="p-2 hover:bg-green-100 rounded-md transition-colors"
                            aria-label="Copy temp code"
                          >
                            <Copy className="h-4 w-4 text-green-600" />
                          </button>
                        </div>
                      </div>
                    )}
                    {shipment.shipping?.experienceCentre && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Drop off at</p>
                            <p className="text-sm font-medium text-gray-900">
                              {shipment.shipping.experienceCentre.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {shipment.shipping.experienceCentre.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Payment Details section */}
      <section className="space-y-3 w-full">
        <h2 className="font-roboto text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-gray-600 mr-1 inline-block" />{" "}
          Payment Details
        </h2>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {[
            {
              label: "Payment Method",
              value: order?.paymentId?.method?.toUpperCase() || "N/A",
            },
            {
              label: "Payment Status",
              value: (
                <span
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getPaymentStatusColor(
                    order?.paymentId?.status
                  )}`}
                >
                  {order?.paymentId?.status || "N/A"}
                </span>
              ),
            },
            {
              label: "Vendor Subtotal",
              value: vendorTotals.totalAmount > 0
                ? vendorTotals.totalAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: vendorTotals.currency,
                  })
                : "N/A",
            },
            {
              label: "Vendor Items",
              value: `${vendorTotals.totalItems} item(s)`,
            },
            {
              label: "Order Status",
              value: (
                <span
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusColor(
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
              className={`flex items-center justify-between px-4 py-2.5 ${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } ${index < 5 ? "border-b border-gray-200" : ""} ${index === 0 ? "rounded-t-lg" : ""} ${index === 5 ? "rounded-b-lg" : ""}`}
            >
              <p className="font-roboto text-xs text-gray-600">{item.label}</p>
              <p className="font-roboto text-xs font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
