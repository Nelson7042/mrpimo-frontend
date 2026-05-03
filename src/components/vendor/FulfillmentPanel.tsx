"use client";

import React, { useState } from "react";
import {
  Truck,
  MapPin,
  AlertCircle,
  RefreshCw,
  Info,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  Copy,
  Package,
} from "lucide-react";
import { useOrderById } from "@/hooks/queries";
import {
  useFulfillmentOptions,
  useExperienceCentres,
  useFulfillShipment,
} from "@/hooks/useVendor";
import { useVendorStore } from "@/stores/useVendorStore";
import { IClientShipment } from "@/types/order.type";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface FulfillmentPanelProps {
  orderId: string;
  shipmentStatus: string;
}

interface ExperienceCentre {
  ServiceCentreId: number;
  Name: string;
  Address: string;
  City: string;
  State: string;
  PhoneNumber?: string;
}

interface FulfillmentResult {
  fulfillmentMethod: "pickup" | "dropoff";
  waybill?: string;
  tempCode?: string;
  trackingNumber?: string;
  experienceCentre?: {
    id: number;
    name: string;
    address: string;
  };
  shipmentStatus: string;
  vendorPickupCost: number;
}

type FulfillmentMethod = "pickup" | "dropoff" | null;

function formatCurrency(amount: number, currency = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : currency;
  return `${symbol}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

export default function FulfillmentPanel({
  orderId,
  shipmentStatus,
}: FulfillmentPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod>(null);
  const [selectedCentre, setSelectedCentre] = useState<ExperienceCentre | null>(null);
  const [fulfillmentResult, setFulfillmentResult] = useState<FulfillmentResult | null>(null);
  const { vendor } = useVendorStore();

  // Fetch the order to find the vendor's shipment
  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = useOrderById(orderId);

  // Find the vendor's shipment from the order
  const vendorShipment: IClientShipment | undefined = order?.shipments?.find(
    (s: IClientShipment) => s.vendorId?._id === vendor?._id
  );

  const shipmentId = vendorShipment?._id || "";

  // Fetch fulfillment options for this shipment
  const {
    data: optionsResponse,
    isLoading: optionsLoading,
    isError: optionsError,
    error: optionsErrorData,
    refetch: refetchOptions,
  } = useFulfillmentOptions(orderId, shipmentId);

  const options = optionsResponse?.data;

  // Fetch experience centres when drop-off is selected and senderStationId is available
  const senderStationId = options?.senderStationId ?? 0;
  const {
    data: centresResponse,
    isLoading: centresLoading,
    isError: centresError,
  } = useExperienceCentres(
    selectedMethod === "dropoff" ? senderStationId : 0
  );

  const experienceCentres: ExperienceCentre[] =
    (selectedMethod === "dropoff"
      ? centresResponse?.data || options?.experienceCentres
      : []) || [];

  const fulfillMutation = useFulfillShipment();

  const canConfirm =
    selectedMethod === "pickup" ||
    (selectedMethod === "dropoff" && selectedCentre !== null);

  const handleConfirm = () => {
    if (!canConfirm || !selectedMethod || !shipmentId) return;

    fulfillMutation.mutate(
      {
        orderId,
        shipmentId,
        body: {
          fulfillmentMethod: selectedMethod,
          ...(selectedMethod === "dropoff" && selectedCentre
            ? { serviceCentreId: selectedCentre.ServiceCentreId }
            : {}),
        },
      },
      {
        onSuccess: (response: any) => {
          setFulfillmentResult(response.data);
          toast.success("Shipment fulfilled successfully");
          refetchOrder();
        },
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isLoading = orderLoading || optionsLoading;

  // If the shipment is already fulfilled, don't show the panel (task 8.2 will handle status display)
  const shippingStatus = vendorShipment?.shipping?.status?.toLowerCase();
  const isFulfillable =
    shippingStatus === "pending" || shippingStatus === "processing";

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!vendorShipment) {
    return null;
  }

  if (!isFulfillable) {
    // Shipment already fulfilled — display status and tracking info
    const shipping = vendorShipment.shipping;
    const statusLabel = shipping?.status
      ? shipping.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Unknown";

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-sm text-gray-900">
            Shipment Status
          </h3>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              shipping?.status === "delivered"
                ? "bg-green-100 text-green-700"
                : shipping?.status === "failed"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
            )}
          >
            <CheckCircle className="h-3 w-3" />
            {statusLabel}
          </span>
          {shipping?.fulfillmentMethod && (
            <span className="text-xs text-gray-500">
              via {shipping.fulfillmentMethod === "pickup" ? "Pickup" : "Dropoff"}
            </span>
          )}
        </div>

        {/* Tracking / Waybill Info */}
        {shipping?.trackingNumber && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {shipping.trackingNumber}
              </p>
              <button
                onClick={() =>
                  copyToClipboard(shipping.trackingNumber!, "Tracking number")
                }
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Copy tracking number"
              >
                <Copy className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {shipping?.waybill && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-1">Waybill Number</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {shipping.waybill}
              </p>
              <button
                onClick={() =>
                  copyToClipboard(shipping.waybill!, "Waybill")
                }
                className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                aria-label="Copy waybill number"
              >
                <Copy className="h-3.5 w-3.5 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        {/* Carrier and Delivery Info */}
        <div className="space-y-2 text-xs">
          {shipping?.carrier && (
            <div className="flex justify-between">
              <span className="text-gray-500">Carrier</span>
              <span className="font-medium text-gray-900">{shipping.carrier}</span>
            </div>
          )}
          {shipping?.estimatedDelivery && (
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Delivery</span>
              <span className="font-medium text-gray-900">
                {new Date(shipping.estimatedDelivery).toLocaleDateString()}
              </span>
            </div>
          )}
          {shipping?.actualDelivery && (
            <div className="flex justify-between">
              <span className="text-gray-500">Delivered On</span>
              <span className="font-medium text-green-700">
                {new Date(shipping.actualDelivery).toLocaleDateString()}
              </span>
            </div>
          )}
          {shipping?.experienceCentre && (
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
              <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Experience Centre</p>
                <p className="text-sm font-medium text-gray-900">
                  {shipping.experienceCentre.name}
                </p>
                <p className="text-xs text-gray-500">
                  {shipping.experienceCentre.address}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (optionsError) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">
            Failed to load fulfillment options
          </p>
        </div>
        <p className="text-xs text-gray-500">
          {(optionsErrorData as any)?.message ||
            "Something went wrong. Please try again."}
        </p>
        <button
          onClick={() => refetchOptions()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!options) return null;

  // Show fulfillment result after successful submission
  if (fulfillmentResult) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <h3 className="font-semibold text-sm">
            Shipment Created Successfully
          </h3>
        </div>

        {fulfillmentResult.fulfillmentMethod === "pickup" &&
          fulfillmentResult.waybill && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-xs text-blue-700 font-medium">
                Pickup — GIGL will send a rider to your location
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Waybill Number</p>
                  <p className="text-lg font-bold text-gray-900">
                    {fulfillmentResult.waybill}
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(fulfillmentResult.waybill!, "Waybill")
                  }
                  className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                  aria-label="Copy waybill number"
                >
                  <Copy className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>
          )}

        {fulfillmentResult.fulfillmentMethod === "dropoff" && (
          <div className="space-y-3">
            {fulfillmentResult.tempCode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="text-xs text-green-700 font-medium">
                  Dropoff — Present this code at the Experience Centre
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Temp Code</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-wider">
                      {fulfillmentResult.tempCode}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(fulfillmentResult.tempCode!, "Temp code")
                    }
                    className="p-2 hover:bg-green-100 rounded-md transition-colors"
                    aria-label="Copy temp code"
                  >
                    <Copy className="h-4 w-4 text-green-600" />
                  </button>
                </div>
              </div>
            )}
            {fulfillmentResult.experienceCentre && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Drop off at</p>
                    <p className="text-sm font-medium text-gray-900">
                      {fulfillmentResult.experienceCentre.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {fulfillmentResult.experienceCentre.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const isInternational = options.isInternational;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 className="font-semibold text-sm text-gray-900">
        Choose Fulfillment Method
      </h3>

      {isInternational && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Dropoff is not available for international shipments. Only pickup is
            available.
          </p>
        </div>
      )}

      {/* Method Cards */}
      <div
        className={cn(
          "grid gap-4",
          !isInternational ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md"
        )}
      >
        {/* Pickup Card */}
        <button
          type="button"
          onClick={() => {
            setSelectedMethod("pickup");
            setSelectedCentre(null);
          }}
          className={cn(
            "text-left border-2 rounded-xl p-4 transition-all",
            selectedMethod === "pickup"
              ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                selectedMethod === "pickup" ? "bg-blue-100" : "bg-gray-100"
              )}
            >
              <Truck
                className={cn(
                  "h-4 w-4",
                  selectedMethod === "pickup"
                    ? "text-blue-600"
                    : "text-gray-500"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pickup</p>
              <p className="text-xs text-gray-500">
                GIGL sends a rider to your location
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Vendor fee</p>
            <p className="text-lg font-bold text-gray-900">
              {options.vendorPickupFee > 0
                ? formatCurrency(options.vendorPickupFee, options.currency)
                : formatCurrency(0, options.currency)}
            </p>
          </div>
        </button>

        {/* Dropoff Card — only for local orders */}
        {!isInternational && (
          <button
            type="button"
            onClick={() => setSelectedMethod("dropoff")}
            className={cn(
              "text-left border-2 rounded-xl p-4 transition-all",
              selectedMethod === "dropoff"
                ? "border-green-500 bg-green-50/50 ring-1 ring-green-200"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  selectedMethod === "dropoff"
                    ? "bg-green-100"
                    : "bg-gray-100"
                )}
              >
                <MapPin
                  className={cn(
                    "h-4 w-4",
                    selectedMethod === "dropoff"
                      ? "text-green-600"
                      : "text-gray-500"
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dropoff</p>
                <p className="text-xs text-gray-500">
                  Take your package to a GIGL Experience Centre
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Vendor fee</p>
              <p className="text-lg font-bold text-green-700">
                No extra charge
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Pickup Scheduling Details — shown when pickup is selected */}
      {selectedMethod === "pickup" && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-700">
            Pickup Scheduling Details
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Scheduled Pickup
                </p>
                <p className="text-xs text-gray-600">
                  A GIGL rider will be dispatched to your registered address
                  within 24–48 hours after confirmation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pickup Window
                </p>
                <p className="text-xs text-gray-600">
                  Pickups are typically between 9:00 AM – 5:00 PM on business
                  days.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-blue-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Pickup price</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(options.pickupPrice, options.currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Vendor pickup surcharge</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(options.vendorPickupFee, options.currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Buyer pays</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(options.buyerPays, options.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Centre Selection — shown when dropoff is selected */}
      {selectedMethod === "dropoff" && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-700">
            Nearest Experience Centres
          </p>

          {centresLoading ? (
            <div className="space-y-2 border border-gray-200 rounded-lg p-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : centresError ? (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                Failed to load experience centres. The centres shown below are
                from the initial options.
              </p>
            </div>
          ) : null}

          {experienceCentres.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
              {experienceCentres.map((centre) => (
                <button
                  key={centre.ServiceCentreId}
                  type="button"
                  onClick={() => setSelectedCentre(centre)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    selectedCentre?.ServiceCentreId === centre.ServiceCentreId
                      ? "border-green-500 bg-green-50"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {centre.Name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {centre.Address}
                        {centre.City ? `, ${centre.City}` : ""}
                      </p>
                      {centre.PhoneNumber && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {centre.PhoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            !centresLoading && (
              <p className="text-xs text-gray-500 italic">
                No experience centres found for your area.
              </p>
            )
          )}

          {/* Dropoff pricing details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Dropoff price</span>
                <span className="font-medium text-gray-900">
                  {options.dropoffPrice != null
                    ? formatCurrency(options.dropoffPrice, options.currency)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Vendor fee</span>
                <span className="font-medium text-green-700">
                  No extra charge
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Buyer pays</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(options.buyerPays, options.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Breakdown Summary */}
      {selectedMethod && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Fee Breakdown
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Buyer pays (shipping)</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(options.buyerPays, options.currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">
              Vendor pays (
              {selectedMethod === "pickup" ? "pickup surcharge" : "dropoff"})
            </span>
            <span className="font-medium text-gray-900">
              {selectedMethod === "pickup"
                ? formatCurrency(options.vendorPickupFee, options.currency)
                : formatCurrency(0, options.currency)}
            </span>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm || fulfillMutation.isPending}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
          canConfirm && !fulfillMutation.isPending
            ? "bg-[#002f7a] text-white hover:bg-[#002060]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {fulfillMutation.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          "Confirm Fulfillment"
        )}
      </button>

      {/* Mutation Error with Retry */}
      {fulfillMutation.isError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-700">
              {(fulfillMutation.error as any)?.message ||
                "Failed to create shipment. Please try again."}
            </p>
            <button
              onClick={handleConfirm}
              className="text-xs font-medium text-red-600 hover:text-red-800 mt-1 inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
