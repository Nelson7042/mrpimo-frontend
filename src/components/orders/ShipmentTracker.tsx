"use client";

import React, { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Valid shipment statuses in the fulfillment lifecycle */
export type ShipmentStatus =
  | "pending"
  | "preparing_shipment"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export interface ShipmentTrackerProps {
  /** Current shipment status */
  status: ShipmentStatus;
  /** Waybill/tracking number from the carrier (shown when available) */
  waybill?: string | null;
  /** Estimated delivery window in business days */
  estimatedDays?: { min: number; max: number } | null;
  /** Label for the selected delivery option, e.g. "Home Delivery (Express)" */
  deliveryOptionLabel?: string | null;
  /** Actual delivery date/time (shown when status is "delivered") */
  deliveredAt?: string | Date | null;
}

/** Status step configuration for the progress indicator */
interface StatusStep {
  key: ShipmentStatus;
  label: string;
  icon: React.ElementType;
}

const STATUS_STEPS: StatusStep[] = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "preparing_shipment", label: "Preparing Shipment", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

/** Maps status to a badge variant and color */
const STATUS_DISPLAY: Record<
  ShipmentStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  preparing_shipment: {
    label: "Preparing Shipment",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  shipped: {
    label: "Shipped",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  in_transit: {
    label: "In Transit",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  delivered: {
    label: "Delivered",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  failed: {
    label: "Delivery Failed",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

/** Returns the index of the current status in the step progression */
function getStepIndex(status: ShipmentStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

/** Formats estimated delivery days into a readable string */
function formatEstimatedDays(days: { min: number; max: number }): string {
  if (days.min === days.max) {
    return `${days.min} business day${days.min > 1 ? "s" : ""}`;
  }
  return `${days.min}–${days.max} business days`;
}

/** Formats a date into a readable delivery confirmation string */
function formatDeliveryDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * ShipmentTracker component for the buyer order detail page.
 *
 * Displays:
 * - Current shipment status with a visual step/timeline progress indicator
 * - Waybill number with copy button (when available)
 * - Estimated delivery timeline based on the delivery option's estimatedDays
 * - Delivery confirmation date and time (when status is "delivered")
 * - Appropriate icons and colors for each status
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */
export default function ShipmentTracker({
  status,
  waybill,
  estimatedDays,
  deliveryOptionLabel,
  deliveredAt,
}: ShipmentTrackerProps) {
  const [copied, setCopied] = useState(false);

  const statusDisplay = STATUS_DISPLAY[status] || STATUS_DISPLAY.pending;
  const currentStepIndex = getStepIndex(status);
  const isFailed = status === "failed";

  const handleCopyWaybill = async () => {
    if (!waybill) return;
    try {
      await navigator.clipboard.writeText(waybill);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = waybill;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">
          Shipment Tracking
        </h3>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
            statusDisplay.bgColor,
            statusDisplay.borderColor,
            statusDisplay.color
          )}
        >
          {isFailed ? (
            <AlertTriangle className="h-3 w-3" />
          ) : status === "delivered" ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {statusDisplay.label}
        </div>
      </div>

      {/* Visual Progress Indicator (step timeline) */}
      {!isFailed && (
        <div className="relative">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center relative z-10"
                >
                  {/* Step circle */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted
                        ? "bg-green-100 border-green-500"
                        : "bg-gray-100 border-gray-300",
                      isCurrent && !isCompleted && "border-blue-500 bg-blue-100"
                    )}
                  >
                    <StepIcon
                      className={cn(
                        "h-4 w-4",
                        isCompleted ? "text-green-600" : "text-gray-400",
                        isCurrent && !isCompleted && "text-blue-600"
                      )}
                    />
                  </div>
                  {/* Step label (hidden on small screens for middle steps) */}
                  <span
                    className={cn(
                      "text-[10px] mt-1.5 text-center max-w-[60px] leading-tight",
                      isCompleted
                        ? "text-green-700 font-medium"
                        : "text-gray-400",
                      isCurrent && "text-blue-700 font-medium"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Connecting line behind the steps */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-0" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-green-500 -z-0 transition-all"
            style={{
              width:
                currentStepIndex >= 0
                  ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                  : "0%",
            }}
          />
        </div>
      )}

      {/* Failed status display */}
      {isFailed && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Delivery Failed
            </p>
            <p className="text-xs text-red-600 mt-1">
              There was an issue with this delivery. Our team is reviewing the
              situation and will reach out with next steps.
            </p>
          </div>
        </div>
      )}

      {/* Waybill / Tracking Number */}
      {waybill && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">Tracking Number</p>
            <p className="text-sm font-mono font-medium text-gray-900 mt-0.5">
              {waybill}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyWaybill}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              copied
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            )}
            aria-label="Copy tracking number"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      )}

      {/* Estimated Delivery Timeline */}
      {estimatedDays && status !== "delivered" && !isFailed && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-600 font-medium">
              Estimated Delivery
            </p>
            <p className="text-sm text-blue-800 mt-0.5">
              {formatEstimatedDays(estimatedDays)}
            </p>
            {deliveryOptionLabel && (
              <p className="text-xs text-blue-500 mt-0.5">
                via {deliveryOptionLabel}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delivery Confirmation */}
      {status === "delivered" && deliveredAt && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-green-600 font-medium">
              Delivered Successfully
            </p>
            <p className="text-sm text-green-800 mt-0.5">
              {formatDeliveryDate(deliveredAt)}
            </p>
            {deliveryOptionLabel && (
              <p className="text-xs text-green-500 mt-0.5">
                via {deliveryOptionLabel}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
