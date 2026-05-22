"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { disputeService } from "@/services/disputeService";
import { orderService, Order } from "@/utils/orderService";

const REASON_OPTIONS = [
  "Product Defective",
  "Wrong Item Received",
  "Missing Items",
  "Damaged Package",
  "Late Delivery",
  "Poor Quality",
  "Not as Described",
  "Other",
] as const;

const RETURN_OUTCOME_OPTIONS = [
  { value: "refund", label: "Refund" },
  { value: "product_replacement", label: "Product Replacement" },
] as const;

type DisputeReason = (typeof REASON_OPTIONS)[number];
type ReturnOutcome = "refund" | "product_replacement";

interface CreateDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDisputeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDisputeModalProps) {
  // Form state
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState<DisputeReason | "">("");
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("");
  const [returnOutcome, setReturnOutcome] = useState<ReturnOutcome | "">("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Fetch eligible orders (shipped or delivered) when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEligibleOrders();
    }
  }, [isOpen]);

  const fetchEligibleOrders = async () => {
    setIsLoadingOrders(true);
    try {
      // Fetch shipped orders
      const shippedData = await orderService.getUserOrders(1, 100, "shipped");
      const shippedOrders = shippedData?.data?.orders || shippedData?.orders || [];

      // Fetch delivered orders
      const deliveredData = await orderService.getUserOrders(1, 100, "delivered");
      const deliveredOrders = deliveredData?.data?.orders || deliveredData?.orders || [];

      const allEligible = [...shippedOrders, ...deliveredOrders];
      setOrders(Array.isArray(allEligible) ? allEligible : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleAddEvidenceUrl = () => {
    const trimmed = newEvidenceUrl.trim();
    if (trimmed && !evidenceUrls.includes(trimmed)) {
      setEvidenceUrls([...evidenceUrls, trimmed]);
      setNewEvidenceUrl("");
    }
  };

  const handleRemoveEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEvidenceUrl();
    }
  };

  const validateForm = (): string | null => {
    if (!orderId) return "Please select an order.";
    if (!reason) return "Please select a reason.";
    if (!description.trim()) return "Please provide a description.";
    if (!returnOutcome) return "Please select a return outcome.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await disputeService.createDispute({
        orderId,
        reason: reason as string,
        description: description.trim(),
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        returnOutcome: returnOutcome as string,
      });

      // Reset form on success
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOrderId("");
    setReason("");
    setDescription("");
    setEvidenceUrls([]);
    setNewEvidenceUrl("");
    setReturnOutcome("");
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Dispute</DialogTitle>
          <DialogDescription>
            Fill in the details below to raise a dispute for your order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Order Selection */}
          <div className="space-y-2">
            <Label htmlFor="order-select">Order *</Label>
            {isLoadingOrders ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading orders...
              </div>
            ) : (
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger id="order-select">
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No eligible orders found
                    </SelectItem>
                  ) : (
                    orders.map((order) => (
                      <SelectItem key={order._id} value={order._id}>
                        #{order._id.slice(-8)} — {order.status}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason-select">Reason *</Label>
            <Select value={reason} onValueChange={(val) => setReason(val as DisputeReason)}>
              <SelectTrigger id="reason-select">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Evidence URLs */}
          <div className="space-y-2">
            <Label>Evidence URLs (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://res.cloudinary.com/..."
                value={newEvidenceUrl}
                onChange={(e) => setNewEvidenceUrl(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvidenceUrl}
                disabled={!newEvidenceUrl.trim()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="space-y-1 mt-2">
                {evidenceUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate flex-1 text-gray-700">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceUrl(index)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Return Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome-select">Return Outcome *</Label>
            <Select value={returnOutcome} onValueChange={(val) => setReturnOutcome(val as ReturnOutcome)}>
              <SelectTrigger id="outcome-select">
                <SelectValue placeholder="Select desired outcome" />
              </SelectTrigger>
              <SelectContent>
                {RETURN_OUTCOME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
