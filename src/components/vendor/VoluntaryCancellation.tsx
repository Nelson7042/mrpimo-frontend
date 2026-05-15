"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Loader2,
  XCircle,
  Clock,
} from "lucide-react";
import { useVoluntaryCancellation } from "@/hooks/useVendor";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type CancellationReason =
  | "out_of_stock"
  | "item_damaged"
  | "pricing_error"
  | "personal_emergency"
  | "other";

const CANCELLATION_REASONS: { value: CancellationReason; label: string }[] = [
  { value: "out_of_stock", label: "Out of stock" },
  { value: "item_damaged", label: "Item damaged" },
  { value: "pricing_error", label: "Pricing error" },
  { value: "personal_emergency", label: "Personal emergency" },
  { value: "other", label: "Other" },
];

interface VoluntaryCancellationProps {
  orderId: string;
  shipmentStatus: string;
  fulfillmentDeadline: string | Date;
  onCancellationComplete?: () => void;
}

function useCountdown(deadline: Date) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const end = deadline.getTime();
      return Math.max(0, end - now);
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return timeRemaining;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function VoluntaryCancellation({
  orderId,
  shipmentStatus,
  fulfillmentDeadline,
  onCancellationComplete,
}: VoluntaryCancellationProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [reason, setReason] = useState<CancellationReason | "">("");
  const [explanation, setExplanation] = useState("");

  const deadline = new Date(fulfillmentDeadline);
  const timeRemaining = useCountdown(deadline);

  const cancellationMutation = useVoluntaryCancellation();

  const isCountdownActive = timeRemaining > 0;
  const isPending = shipmentStatus?.toLowerCase() === "pending";
  const canCancel = isCountdownActive && isPending;

  const handleOpenDialog = useCallback(() => {
    setReason("");
    setExplanation("");
    setShowConfirmation(false);
    setShowDialog(true);
  }, []);

  const handleProceedToConfirmation = useCallback(() => {
    if (!reason) return;
    setShowConfirmation(true);
  }, [reason]);

  const handleSubmitCancellation = useCallback(() => {
    if (!reason) return;

    cancellationMutation.mutate(
      {
        orderId,
        body: {
          reason,
          ...(explanation.trim() && { explanation: explanation.trim() }),
        },
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setShowConfirmation(false);
          onCancellationComplete?.();
        },
      }
    );
  }, [reason, explanation, orderId, cancellationMutation, onCancellationComplete]);

  // Don't render anything if the deadline has expired or status is not pending
  if (!canCancel) {
    // Still show the countdown timer if the deadline hasn't expired yet (even if status isn't pending)
    if (isCountdownActive && !isPending) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-900">
              Fulfillment Countdown
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              Time remaining: {formatCountdown(timeRemaining)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  const reasonLabel = CANCELLATION_REASONS.find((r) => r.value === reason)?.label;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {/* Countdown Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-900">
              Fulfillment Countdown
            </h3>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              timeRemaining <= 24 * 60 * 60 * 1000
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            )}
          >
            <Clock className="h-3 w-3" />
            {formatCountdown(timeRemaining)}
          </div>
        </div>

        {/* Warning when less than 24h */}
        {timeRemaining <= 24 * 60 * 60 * 1000 && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">
              Less than 24 hours remaining. If you cannot fulfill this order,
              cancel now to avoid a strike on your account.
            </p>
          </div>
        )}

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleOpenDialog}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300"
        >
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Can&apos;t Fulfill Order
          </span>
        </button>

        <p className="text-xs text-gray-500 text-center">
          Voluntary cancellation — no strike will be issued
        </p>
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          {!showConfirmation ? (
            <>
              <DialogHeader>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogDescription>
                  Please select a reason for cancelling this order. The buyer
                  will be refunded and no strike will be issued to your account.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={reason}
                    onValueChange={(val) =>
                      setReason(val as CancellationReason)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCELLATION_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional Explanation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Explanation{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <Textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Provide additional details..."
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleProceedToConfirmation}
                  disabled={!reason}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this order? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reason:</span>
                    <span className="font-medium text-gray-900">
                      {reasonLabel}
                    </span>
                  </div>
                  {explanation.trim() && (
                    <div className="text-sm">
                      <span className="text-gray-500">Explanation:</span>
                      <p className="mt-1 text-gray-700">{explanation}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    The buyer will be refunded for this shipment. No strike will
                    be issued to your account.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={cancellationMutation.isPending}
                >
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmitCancellation}
                  disabled={cancellationMutation.isPending}
                >
                  {cancellationMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </span>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </Button>
              </DialogFooter>

              {/* Mutation Error */}
              {cancellationMutation.isError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    {(cancellationMutation.error as any)?.message ||
                      "Failed to cancel order. Please try again."}
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
