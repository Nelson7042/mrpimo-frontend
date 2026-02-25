"use client";

import React, { useState } from "react";
import {
  Truck,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  Info,
} from "lucide-react";
import { useFulfillmentOptions, useFulfillShipment } from "@/hooks/useVendor";
import { IClientShipment } from "@/types/order.type";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface FulfillmentActionPanelProps {
  orderId: string;
  shipment: IClientShipment;
  vendorId: string;
  onFulfillmentComplete: () => void;
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
  return `${symbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function FulfillmentActionPanel({
  orderId,
  shipment,
  vendorId,
  onFulfillmentComplete,
}: FulfillmentActionPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod>(null);
  const [selectedCentre, setSelectedCentre] = useState<ExperienceCentre | null>(null);
  const [fulfillmentResult, setFulfillmentResult] = useState<FulfillmentResult | null>(null);

  const {
    data: optionsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useFulfillmentOptions(orderId, shipment._id);

  const fulfillMutation = useFulfillShipment();

  const options = optionsResponse?.data;

  const canConfirm =
    selectedMethod === "pickup" ||
    (selectedMethod === "dropoff" && selectedCentre !== null);

  const handleConfirm = () => {
    if (!canConfirm || !selectedMethod) return;

    fulfillMutation.mutate(
      {
        orderId,
        shipmentId: shipment._id,
        body: {
          fulfillmentMethod: selectedMethod,
          ...(selectedMethod === "dropoff" && selectedCentre
            ? { serviceCentreId: selectedCentre.ServiceCentreId }
            : {}),
        },
      },
      {
        onSuccess: (response) => {
          setFulfillmentResult(response.data);
          onFulfillmentComplete();
        },
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Show fulfillment result after successful submission
  if (fulfillmentResult) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Shipment Created Successfully</h3>
        </div>

        {fulfillmentResult.fulfillmentMethod === "pickup" && fulfillmentResult.waybill && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-xs text-blue-700 font-medium">Pickup — GIGL will send a rider to your location</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Waybill Number</p>
                <p className="text-lg font-bold text-gray-900">{fulfillmentResult.waybill}</p>
              </div>
              <button
                onClick={() => copyToClipboard(fulfillmentResult.waybill!, "Waybill")}
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
                <p className="text-xs text-green-700 font-medium">Dropoff — Present this code at the Experience Centre</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Temp Code</p>
                    <p className="text-2xl font-bold text-gray-900 tracking-wider">{fulfillmentResult.tempCode}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(fulfillmentResult.tempCode!, "Temp code")}
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
                <p className="text-xs text-gray-500 mb-1">Drop off at</p>
                <p className="text-sm font-medium text-gray-900">{fulfillmentResult.experienceCentre.name}</p>
                <p className="text-xs text-gray-600">{fulfillmentResult.experienceCentre.address}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Failed to load fulfillment options</p>
        </div>
        <p className="text-xs text-gray-500">
          {(error as any)?.message || "Something went wrong. Please try again."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!options) return null;

  const isInternational = options.isInternational;
  const experienceCentres: ExperienceCentre[] = options.experienceCentres || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 className="font-semibold text-sm text-gray-900">Choose Fulfillment Method</h3>

      {isInternational && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Dropoff is not available for international shipments. Only pickup is available.
          </p>
        </div>
      )}

      {/* Method Cards */}
      <div className={cn("grid gap-4", !isInternational ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md")}>
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
            <div className={cn(
              "p-2 rounded-lg",
              selectedMethod === "pickup" ? "bg-blue-100" : "bg-gray-100"
            )}>
              <Truck className={cn("h-4 w-4", selectedMethod === "pickup" ? "text-blue-600" : "text-gray-500")} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pickup</p>
              <p className="text-xs text-gray-500">GIGL sends a rider to your location</p>
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
              <div className={cn(
                "p-2 rounded-lg",
                selectedMethod === "dropoff" ? "bg-green-100" : "bg-gray-100"
              )}>
                <MapPin className={cn("h-4 w-4", selectedMethod === "dropoff" ? "text-green-600" : "text-gray-500")} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dropoff</p>
                <p className="text-xs text-gray-500">Take your package to a GIGL Experience Centre</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Vendor fee</p>
              <p className="text-lg font-bold text-green-700">No extra charge</p>
            </div>
          </button>
        )}
      </div>

      {/* Experience Centre Selection — shown when dropoff is selected */}
      {selectedMethod === "dropoff" && experienceCentres.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Select an Experience Centre</p>
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
                    : "border-gray-100 hover:bg-gray-50"
                )}
              >
                <p className="text-sm font-medium text-gray-900">{centre.Name}</p>
                <p className="text-xs text-gray-500">{centre.Address}{centre.City ? `, ${centre.City}` : ""}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      {selectedMethod && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 mb-2">Fee Breakdown</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Buyer pays (shipping)</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(options.buyerPays, options.currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">
              Vendor pays ({selectedMethod === "pickup" ? "pickup surcharge" : "dropoff"})
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

      {/* Mutation Error */}
      {fulfillMutation.isError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-700">
              {(fulfillMutation.error as any)?.message || "Failed to create shipment. Please try again."}
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
