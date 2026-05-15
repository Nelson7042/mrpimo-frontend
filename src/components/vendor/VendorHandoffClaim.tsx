"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Package,
  Truck,
  MapPin,
  Clock,
} from "lucide-react";
import { useConfirmVendorHandoff } from "@/hooks/useVendor";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

type HandoffStatus = "pending" | "vendor_claimed" | "confirmed" | "rejected";
type FulfillmentMethod = "pickup" | "dropoff";

interface VendorHandoffClaimProps {
  orderId: string;
  shipmentId: string;
  shipmentStatus: string;
  fulfillmentMethod: FulfillmentMethod;
  handoffStatus: HandoffStatus;
  onHandoffComplete?: () => void;
}

const HANDOFF_STATUS_CONFIG: Record<
  HandoffStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: Clock,
  },
  vendor_claimed: {
    label: "Claimed — Awaiting Admin Confirmation",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: Package,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected — Please Retry",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
  },
};

export default function VendorHandoffClaim({
  orderId,
  shipmentId,
  shipmentStatus,
  fulfillmentMethod,
  handoffStatus,
  onHandoffComplete,
}: VendorHandoffClaimProps) {
  const [claimed, setClaimed] = useState(false);

  const handoffMutation = useConfirmVendorHandoff();

  const isPreparingShipment =
    shipmentStatus?.toLowerCase() === "preparing_shipment";

  const canClaim =
    isPreparingShipment &&
    (handoffStatus === "pending" || handoffStatus === "rejected");

  const buttonText =
    fulfillmentMethod === "dropoff"
      ? "Mark as Dropped Off"
      : "Mark as Picked Up";

  const handoffType: "dropped_off" | "picked_up" =
    fulfillmentMethod === "dropoff" ? "dropped_off" : "picked_up";

  const handleClaim = () => {
    if (!canClaim) return;

    handoffMutation.mutate(
      {
        orderId,
        shipmentId,
        body: { type: handoffType },
      },
      {
        onSuccess: () => {
          setClaimed(true);
          toast.success(
            fulfillmentMethod === "dropoff"
              ? "Marked as dropped off — awaiting admin confirmation"
              : "Marked as picked up — awaiting admin confirmation"
          );
          onHandoffComplete?.();
        },
      }
    );
  };

  const statusConfig = HANDOFF_STATUS_CONFIG[handoffStatus] || HANDOFF_STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  // Show success state after claiming
  if (claimed) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Handoff Claimed Successfully</h3>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700">
            {fulfillmentMethod === "dropoff"
              ? "You've marked this shipment as dropped off at the experience centre. A shipping admin will confirm receipt shortly."
              : "You've confirmed the rider has picked up this shipment. A shipping admin will verify and confirm shortly."}
          </p>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", "bg-blue-50 border border-blue-200")}>
          <Package className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">
            Status: Claimed — Awaiting Admin Confirmation
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">
          Handoff Confirmation
        </h3>
        <div className="flex items-center gap-1.5">
          {fulfillmentMethod === "dropoff" ? (
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <Truck className="h-3.5 w-3.5 text-gray-400" />
          )}
          <span className="text-xs text-gray-500 capitalize">
            {fulfillmentMethod}
          </span>
        </div>
      </div>

      {/* Current Handoff Status Badge */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border",
          statusConfig.bgColor,
          statusConfig.borderColor
        )}
      >
        <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
        <span className={cn("text-xs font-medium", statusConfig.color)}>
          Handoff Status: {statusConfig.label}
        </span>
      </div>

      {/* Info about what the button does */}
      {canClaim && (
        <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <Package className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            {fulfillmentMethod === "dropoff"
              ? "Confirm that you have dropped off the package at the experience centre. A shipping admin will verify and advance the shipment."
              : "Confirm that the GIGL rider has picked up the package from your location. A shipping admin will verify and advance the shipment."}
          </p>
        </div>
      )}

      {/* Disabled state info */}
      {!isPreparingShipment && (
        <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            Handoff can only be claimed when the shipment is in
            &quot;preparing shipment&quot; status. Current status:{" "}
            <span className="font-medium">
              {shipmentStatus?.replace(/_/g, " ")}
            </span>
          </p>
        </div>
      )}

      {/* Rejected state info */}
      {handoffStatus === "rejected" && isPreparingShipment && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            Your previous handoff claim was rejected by the shipping admin.
            Please ensure the package has been properly handed off and try again.
          </p>
        </div>
      )}

      {/* Claim Button */}
      <button
        type="button"
        onClick={handleClaim}
        disabled={!canClaim || handoffMutation.isPending}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
          canClaim && !handoffMutation.isPending
            ? "bg-[#002f7a] text-white hover:bg-[#002060]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {handoffMutation.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>

      {/* Mutation Error */}
      {handoffMutation.isError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-700">
              {(handoffMutation.error as any)?.message ||
                "Failed to confirm handoff. Please try again."}
            </p>
            <button
              onClick={handleClaim}
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
