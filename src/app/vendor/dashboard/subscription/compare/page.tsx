"use client";

import React from "react";
import { useVendorStore } from "@/stores/useVendorStore";
import { useVendorSubscription, usePlans, useCountrySubscriptionPrice } from "@/hooks/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  X,
  Loader2,
  Crown,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Plan attribute definitions ─────────────────────────────────────────────────

interface PlanAttribute {
  label: string;
  key: string;
  render: (plan: PlanData) => React.ReactNode;
}

const PLAN_ATTRIBUTES: PlanAttribute[] = [
  {
    label: "Product Listing Limit",
    key: "productListingLimit",
    render: (plan) =>
      plan.productListingLimit === -1 || plan.productListingLimit >= 999999
        ? "Unlimited"
        : plan.productListingLimit.toLocaleString(),
  },
  {
    label: "Collection Product Slots",
    key: "collectionProductSlots",
    render: (plan) =>
      plan.collectionProductSlots === -1 || plan.collectionProductSlots >= 999999
        ? "Unlimited"
        : plan.collectionProductSlots.toLocaleString(),
  },
  {
    label: "Analytics Dashboard",
    key: "analyticsDashboard",
    render: (plan) =>
      plan.analyticsDashboard ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 mx-auto" />
      ),
  },
  {
    label: "Custom Store Branding",
    key: "customStoreBranding",
    render: (plan) => (
      <span className="capitalize">{plan.customStoreBranding || "None"}</span>
    ),
  },
  {
    label: "Messaging Tools",
    key: "messagingTools",
    render: (plan) => (
      <span className="capitalize">{plan.messagingTools || "None"}</span>
    ),
  },
  {
    label: "Bulk Upload",
    key: "bulkUpload",
    render: (plan) =>
      plan.bulkUpload ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 mx-auto" />
      ),
  },
  {
    label: "Payout Options",
    key: "payoutOptions",
    render: (plan) =>
      plan.payoutOptions?.length > 0
        ? plan.payoutOptions.join(", ")
        : "Standard",
  },
  {
    label: "Monthly Ad Credits",
    key: "adCreditMonthly",
    render: (plan) =>
      plan.adCreditMonthly === -1 || plan.adCreditMonthly >= 999999
        ? "Unlimited"
        : plan.adCreditMonthly.toLocaleString(),
  },
  {
    label: "Priority Support",
    key: "prioritySupport",
    render: (plan) => (
      <span className="capitalize">{plan.prioritySupport || "None"}</span>
    ),
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Main Component ─────────────────────────────────────────────────────────────

const ComparePlansPage = () => {
  const { vendor } = useVendorStore();
  const router = useRouter();
  const vendorId = vendor?._id || "";

  // Data fetching
  const { data: subscriptionData, isLoading: subLoading } = useVendorSubscription(vendorId);
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: priceData, isLoading: priceLoading } = useCountrySubscriptionPrice(vendorId);

  // Derive current plan
  const subscription = subscriptionData?.subscription || vendor?.subscription;
  const currentPlan = subscriptionData?.plan || (subscription as any)?.currentPlan;
  const currentPlanName: string =
    typeof currentPlan === "object" ? currentPlan?.name : currentPlan || "Starter";
  const currentTier = getPlanTier(currentPlanName);

  // Sort plans by tier
  const sortedPlans: PlanData[] = (plans || [])
    .filter((p: PlanData) => PLAN_ORDER[p.name] !== undefined)
    .sort((a: PlanData, b: PlanData) => getPlanTier(a.name) - getPlanTier(b.name));

  // Build price lookup from getSubscriptionPrice endpoint (Req 6.4)
  const priceLookup: Record<string, { price: number; symbol: string; currency: string }> = {};
  if (priceData?.plans) {
    for (const p of priceData.plans) {
      priceLookup[p.planName] = {
        price: p.priceLocal,
        symbol: p.symbol || priceData.symbol || "$",
        currency: p.currency || priceData.currency || "USD",
      };
    }
  }

  // Handle plan selection → navigate to upgrade/downgrade confirmation (Req 6.5)
  const handleSelectPlan = (plan: PlanData) => {
    const planTier = getPlanTier(plan.name);
    if (planTier === currentTier) return; // Already on this plan

    if (planTier > currentTier) {
      // Upgrade
      router.push(
        `/vendor/dashboard/subscription?action=upgrade&plan=${encodeURIComponent(plan.name)}`
      );
    } else {
      // Downgrade
      router.push(
        `/vendor/dashboard/subscription?action=downgrade&plan=${encodeURIComponent(plan.name)}`
      );
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (subLoading || plansLoading) {
    return (
      <div className="bg-[#f6f6f6] min-h-screen font-roboto">
        <div className="p-4 md:p-10">
          <h1 className="font-bold text-xl mb-6">Compare Plans</h1>
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/vendor/dashboard/subscription")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="font-bold text-xl">Compare Plans</h1>
            <p className="text-sm text-gray-500 mt-1">
              Choose the plan that best fits your business needs.
            </p>
          </div>
        </div>

        {/* Plan Comparison Table (Req 6.1) */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            {/* Plan headers */}
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-gray-500 w-1/4 min-w-[180px]">
                  Feature
                </th>
                {sortedPlans.map((plan) => {
                  const isCurrent = plan.name === currentPlanName;
                  return (
                    <th
                      key={plan._id}
                      className={`p-4 text-center min-w-[160px] ${
                        isCurrent ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {/* Plan name + current badge (Req 6.3) */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {plan.name}
                          </span>
                          {isCurrent && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-primary/10 text-primary"
                            >
                              <Crown className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>

                        {/* Price in local currency (Req 6.4) */}
                        <div className="text-center">
                          {priceLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                          ) : priceLookup[plan.name] ? (
                            <div>
                              <span className="text-lg font-bold">
                                {formatPrice(
                                  priceLookup[plan.name].price,
                                  priceLookup[plan.name].symbol
                                )}
                              </span>
                              <span className="text-xs text-gray-500 block">
                                / month ({priceLookup[plan.name].currency})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              Price unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Plan attributes (Req 6.2) */}
            <tbody>
              {PLAN_ATTRIBUTES.map((attr, idx) => (
                <tr
                  key={attr.key}
                  className={idx % 2 === 0 ? "bg-gray-50/50" : ""}
                >
                  <td className="p-4 font-medium text-gray-700">
                    {attr.label}
                  </td>
                  {sortedPlans.map((plan) => {
                    const isCurrent = plan.name === currentPlanName;
                    return (
                      <td
                        key={plan._id}
                        className={`p-4 text-center text-gray-600 ${
                          isCurrent ? "bg-primary/5" : ""
                        }`}
                      >
                        {attr.render(plan)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Action row (Req 6.5) */}
              <tr className="border-t">
                <td className="p-4" />
                {sortedPlans.map((plan) => {
                  const planTier = getPlanTier(plan.name);
                  const isCurrent = plan.name === currentPlanName;
                  const isUpgrade = planTier > currentTier;
                  const isDowngrade = planTier < currentTier;

                  return (
                    <td
                      key={plan._id}
                      className={`p-4 text-center ${
                        isCurrent ? "bg-primary/5" : ""
                      }`}
                    >
                      {isCurrent ? (
                        <span className="text-sm text-gray-500 font-medium">
                          Your current plan
                        </span>
                      ) : isUpgrade ? (
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          className="bg-green-600 hover:bg-green-700 text-white w-full"
                          size="sm"
                        >
                          <ArrowUpCircle className="w-4 h-4 mr-1" />
                          Upgrade
                        </Button>
                      ) : isDowngrade ? (
                        <Button
                          variant="outline"
                          onClick={() => handleSelectPlan(plan)}
                          className="w-full"
                          size="sm"
                        >
                          <ArrowDownCircle className="w-4 h-4 mr-1" />
                          Downgrade
                        </Button>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparePlansPage;
