"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useVendorStore } from "@/stores/useVendorStore";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { useVendorSubscription, usePlans } from "@/hooks/queries";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  CreditCard,
  Calendar,
  RefreshCw,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BillingHistoryEntry {
  _id: string;
  action: string;
  fromPlan?: string;
  toPlan?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  reason?: string;
  status: string;
  createdAt: string;
}

interface ProrationPreview {
  proratedAmount: number;
  remainingDays: number;
  totalDays: number;
  newPlanPrice: number;
  oldPlanPrice: number;
}

interface PlanData {
  _id: string;
  name: string;
  productListingLimit: number;
  collectionProductSlots: number;
  analyticsDashboard: boolean;
  customStoreBranding: string;
  messagingTools: string;
  bulkUpload: boolean;
  payoutOptions: string[];
  adCreditMonthly: number;
  prioritySupport: string;
}

// ── Plan tier ordering ─────────────────────────────────────────────────────────

const PLAN_ORDER: Record<string, number> = { Starter: 0, Pro: 1, Elite: 2 };

function getPlanTier(name: string): number {
  return PLAN_ORDER[name] ?? -1;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number | undefined, currency?: string): string {
  if (amount === undefined || amount === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "past_due":
      return "bg-yellow-100 text-yellow-800";
    case "expired":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    cancel: "Cancellation",
    payment: "Payment",
    trial_end: "Trial Ended",
    grace_period: "Grace Period",
    retry_payment: "Payment Retry",
  };
  return labels[action] || action;
}

function getHistoryStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

const SubscriptionPage = () => {
  const { vendor } = useVendorStore();
  const router = useRouter();
  const vendorId = vendor?._id || "";

  // Data fetching
  const { data: subscriptionData, isLoading: subLoading, refetch: refetchSubscription } = useVendorSubscription(vendorId);
  const { data: plans, isLoading: plansLoading } = usePlans();

  // Local state
  const [billingHistory, setBillingHistory] = useState<BillingHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Dialog state
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreview | null>(null);
  const [prorationLoading, setProrationLoading] = useState(false);

  // Action loading states
  const [cancelLoading, setCancelLoading] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  // Derive subscription info
  const subscription = subscriptionData?.subscription || vendor?.subscription;
  const currentPlan = subscriptionData?.plan || (subscription as any)?.currentPlan;
  const currentPlanName: string = typeof currentPlan === "object" ? currentPlan?.name : currentPlan || "Starter";
  const subscriptionStatus: string = subscription?.status || "active";
  const isTrial = subscription?.isTrial || false;
  const startDate = subscription?.startDate;
  const endDate = subscription?.endDate;
  const gracePeriod = (subscription as any)?.gracePeriod;

  // ── Fetch billing history ──────────────────────────────────────────────────

  const fetchBillingHistory = useCallback(async () => {
    if (!vendorId) return;
    setHistoryLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/vendor/${vendorId}/billing-history`
      );
      const data = await response.json();
      if (data.success) {
        setBillingHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch billing history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  // ── Fetch proration preview ────────────────────────────────────────────────

  const fetchProrationPreview = async (targetPlanName: string) => {
    if (!vendorId) return;
    setProrationLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/vendor/${vendorId}/proration-preview?targetPlan=${targetPlanName}`
      );
      const data = await response.json();
      if (data.success) {
        setProrationPreview(data);
      } else {
        setProrationPreview(null);
      }
    } catch (error) {
      console.error("Failed to fetch proration preview:", error);
      setProrationPreview(null);
    } finally {
      setProrationLoading(false);
    }
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleUpgradeClick = (plan: PlanData) => {
    setSelectedPlan(plan);
    fetchProrationPreview(plan.name);
    setShowUpgradeDialog(true);
  };

  const handleDowngradeClick = (plan: PlanData) => {
    setSelectedPlan(plan);
    fetchProrationPreview(plan.name);
    setShowDowngradeDialog(true);
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/vendor/${vendorId}/cancel`,
        { method: "POST", body: JSON.stringify({ reason: "Vendor requested cancellation" }) }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Subscription cancellation scheduled.", toastConfigSuccess);
        setShowCancelDialog(false);
        refetchSubscription();
        fetchBillingHistory();
      } else {
        toast.error(data.message || "Failed to cancel subscription.", toastConfigError);
      }
    } catch (error) {
      toast.error("Failed to cancel subscription.", toastConfigError);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedPlan) return;
    setDowngradeLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/vendor/${vendorId}/downgrade`,
        { method: "POST", body: JSON.stringify({ targetPlan: selectedPlan.name }) }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Downgrade scheduled successfully.", toastConfigSuccess);
        setShowDowngradeDialog(false);
        setSelectedPlan(null);
        refetchSubscription();
        fetchBillingHistory();
      } else {
        toast.error(data.message || "Failed to downgrade subscription.", toastConfigError);
      }
    } catch (error) {
      toast.error("Failed to downgrade subscription.", toastConfigError);
    } finally {
      setDowngradeLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    setRetryLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/subscriptions/vendor/${vendorId}/retry-payment`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Payment retry successful! Your subscription is now active.", toastConfigSuccess);
        refetchSubscription();
        fetchBillingHistory();
      } else {
        toast.error(data.message || "Payment retry failed. Please try again later.", toastConfigError);
      }
    } catch (error) {
      toast.error("Payment retry failed. Please try again later.", toastConfigError);
    } finally {
      setRetryLoading(false);
    }
  };

  // ── Determine available actions ────────────────────────────────────────────

  const currentTier = getPlanTier(currentPlanName);
  const isStarter = currentPlanName === "Starter";
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "past_due";
  const canCancel = isActive && !isStarter;
  const showGraceBanner = subscriptionStatus === "past_due" || subscriptionStatus === "expired";

  const upgradePlans = (plans || []).filter(
    (p: PlanData) => getPlanTier(p.name) > currentTier
  );
  const downgradePlans = (plans || []).filter(
    (p: PlanData) => getPlanTier(p.name) < currentTier && getPlanTier(p.name) >= 0
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (subLoading || plansLoading) {
    return (
      <div className="bg-[#f6f6f6] min-h-screen font-roboto">
        <div className="p-4 md:p-10">
          <h1 className="font-bold text-xl mb-6">Subscription Management</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#f6f6f6] min-h-screen font-roboto">
      <div className="p-4 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-xl">Subscription Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your plan, view billing history, and update your subscription.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/vendor/dashboard/subscription/compare")}
          >
            Compare Plans <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* ── Grace Period Banner (Req 2.6) ─────────────────────────────────── */}
        {showGraceBanner && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {subscriptionStatus === "past_due"
                  ? "Your payment failed. Your subscription is in a grace period."
                  : "Your subscription has expired."}
              </p>
              {gracePeriod?.endDate && (
                <p className="text-xs text-yellow-700 mt-1">
                  Grace period expires on{" "}
                  <span className="font-semibold">{formatDate(gracePeriod.endDate)}</span>.
                  Please update your payment method to avoid losing access.
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleRetryPayment}
              disabled={retryLoading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
            >
              {retryLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Retry Payment
            </Button>
          </div>
        )}

        {/* ── Current Plan Card (Req 2.1) ───────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(subscriptionStatus)}`}
            >
              {subscriptionStatus === "past_due" ? "Past Due" : subscriptionStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Plan Name</p>
              <p className="text-sm font-medium">{currentPlanName}</p>
              {isTrial && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Trial
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Billing Cycle Start</p>
              <p className="text-sm font-medium">{formatDate(startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Billing Cycle End</p>
              <p className="text-sm font-medium">{formatDate(endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Next Renewal</p>
              <p className="text-sm font-medium">
                {subscriptionStatus === "cancelled" ? "N/A" : formatDate(endDate)}
              </p>
            </div>
          </div>

          {/* Scheduled change notice */}
          {(subscription as any)?.scheduledChange?.changeType && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Scheduled change:</span>{" "}
                {(subscription as any).scheduledChange.changeType === "cancel"
                  ? "Cancellation"
                  : "Downgrade"}{" "}
                effective on{" "}
                {formatDate((subscription as any).scheduledChange.effectiveDate)}
              </p>
            </div>
          )}
        </div>

        {/* ── Action Buttons (Req 2.3) ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Plan Actions</h2>
          <div className="flex flex-wrap gap-3">
            {/* Upgrade buttons */}
            {upgradePlans.map((plan: PlanData) => (
              <Button
                key={`upgrade-${plan._id}`}
                onClick={() => handleUpgradeClick(plan)}
                disabled={!isActive}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowUpCircle className="w-4 h-4 mr-1" />
                Upgrade to {plan.name}
              </Button>
            ))}

            {/* Downgrade buttons */}
            {downgradePlans.map((plan: PlanData) => (
              <Button
                key={`downgrade-${plan._id}`}
                variant="outline"
                onClick={() => handleDowngradeClick(plan)}
                disabled={!isActive}
              >
                <ArrowDownCircle className="w-4 h-4 mr-1" />
                Downgrade to {plan.name}
              </Button>
            ))}

            {/* Cancel button */}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={handleCancelClick}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel Subscription
              </Button>
            )}

            {isStarter && (
              <p className="text-sm text-gray-500 self-center">
                You are on the Starter plan. Upgrade to unlock more features.
              </p>
            )}
          </div>
        </div>

        {/* ── Billing History (Req 2.2) ─────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Billing History</h2>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No billing history yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 pr-4 font-medium">Details</th>
                    <th className="pb-2 pr-4 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((entry) => (
                    <tr key={entry._id} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="py-3 pr-4 font-medium whitespace-nowrap">
                        {getActionLabel(entry.action)}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs truncate">
                        {entry.reason || "—"}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {entry.amount
                          ? formatCurrency(entry.amount, entry.currency)
                          : "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getHistoryStatusColor(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Upgrade Confirmation Dialog (Req 2.4) ─────────────────────────── */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Review the details of your plan upgrade before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Plan</span>
              <span className="font-medium">{currentPlanName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Plan</span>
              <span className="font-medium">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Effective Date</span>
              <span className="font-medium">Immediately</span>
            </div>

            {prorationLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Calculating prorated charges...</span>
              </div>
            ) : prorationPreview ? (
              <>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining Days in Cycle</span>
                    <span>{prorationPreview.remainingDays} of {prorationPreview.totalDays}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Prorated Charge</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(prorationPreview.proratedAmount)}
                    </span>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Navigate to the existing upgrade/checkout flow with the selected plan
                router.push(`/vendor/dashboard/subscription/compare?upgrade=${selectedPlan?.name}`);
                setShowUpgradeDialog(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Downgrade Confirmation Dialog (Req 2.4) ───────────────────────── */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Review the details of your plan downgrade before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Plan</span>
              <span className="font-medium">{currentPlanName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Plan</span>
              <span className="font-medium">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Effective Date</span>
              <span className="font-medium">End of current billing period ({formatDate(endDate)})</span>
            </div>

            {prorationLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Loading plan details...</span>
              </div>
            ) : prorationPreview ? (
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Plan Price</span>
                  <span>{formatCurrency(prorationPreview.oldPlanPrice)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">New Plan Price</span>
                  <span>{formatCurrency(prorationPreview.newPlanPrice)}</span>
                </div>
              </div>
            ) : null}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
              <p className="text-xs text-blue-800">
                Your downgrade will take effect at the end of your current billing period.
                You will continue to have access to your current plan features until then.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDowngrade}
              disabled={downgradeLoading}
              variant="outline"
            >
              {downgradeLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Confirm Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirmation Dialog (Req 2.5) ─────────────────────────── */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Plan</span>
              <span className="font-medium">{currentPlanName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Access Until</span>
              <span className="font-medium">{formatDate(endDate)}</span>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
              <p className="text-xs text-yellow-800">
                Your subscription will remain active until the end of your current billing
                period ({formatDate(endDate)}). After that, you will be downgraded to the
                Starter plan. You can resubscribe at any time.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelLoading}
            >
              {cancelLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
