"use client";

import { useState, useEffect } from "react";
import { disputeService } from "@/services/disputeService";
import {
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DisputeMetrics {
  totalDisputes: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  averageResponseTimeHours: number;
  resolutionOutcomes: {
    fullRefund: number;
    partialRefund: number;
    productReplacement: number;
    disputeRejected: number;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays aggregate dispute metrics at the top of the vendor disputes list page.
 * Gracefully degrades if the metrics fetch fails — shows a non-blocking error
 * indicator instead of blocking the disputes list.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
export default function DisputeMetricsPanel() {
  const [metrics, setMetrics] = useState<DisputeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data: any = await disputeService.getVendorMetrics();
        const metricsData = data?.data || data;
        setMetrics({
          totalDisputes: metricsData.totalDisputes ?? 0,
          byStatus: {
            open: metricsData.byStatus?.open ?? 0,
            inProgress: metricsData.byStatus?.inProgress ?? 0,
            resolved: metricsData.byStatus?.resolved ?? 0,
            closed: metricsData.byStatus?.closed ?? 0,
          },
          averageResponseTimeHours: metricsData.averageResponseTimeHours ?? 0,
          resolutionOutcomes: {
            fullRefund: metricsData.resolutionOutcomes?.fullRefund ?? 0,
            partialRefund: metricsData.resolutionOutcomes?.partialRefund ?? 0,
            productReplacement:
              metricsData.resolutionOutcomes?.productReplacement ?? 0,
            disputeRejected:
              metricsData.resolutionOutcomes?.disputeRejected ?? 0,
          },
        });
      } catch (err: any) {
        setError(err.message || "Unable to load metrics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 p-6 mb-4"
        data-testid="metrics-loading"
      >
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading metrics...</span>
        </div>
      </div>
    );
  }

  // Error state — non-blocking indicator
  if (error) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 p-4 mb-4"
        data-testid="metrics-error"
      >
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm">Unable to load metrics</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const totalOutcomes =
    metrics.resolutionOutcomes.fullRefund +
    metrics.resolutionOutcomes.partialRefund +
    metrics.resolutionOutcomes.productReplacement +
    metrics.resolutionOutcomes.disputeRejected;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-4"
      data-testid="dispute-metrics-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-600" />
        <h2 className="text-sm font-semibold text-gray-800">
          Dispute Metrics
        </h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total Disputes */}
        <div className="bg-gray-50 rounded-lg p-3" data-testid="metric-total">
          <p className="text-xs text-gray-500 mb-1">Total Disputes</p>
          <p className="text-xl font-bold text-gray-900">
            {metrics.totalDisputes}
          </p>
        </div>

        {/* Average Response Time */}
        <div
          className="bg-gray-50 rounded-lg p-3"
          data-testid="metric-response-time"
        >
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500">Avg Response</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {metrics.averageResponseTimeHours > 0
              ? `${metrics.averageResponseTimeHours.toFixed(1)}h`
              : "—"}
          </p>
        </div>

        {/* By Status */}
        <div
          className="bg-gray-50 rounded-lg p-3 col-span-2 md:col-span-2"
          data-testid="metric-by-status"
        >
          <p className="text-xs text-gray-500 mb-2">By Status</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Open: {metrics.byStatus.open}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              In Progress: {metrics.byStatus.inProgress}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Resolved: {metrics.byStatus.resolved}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              Closed: {metrics.byStatus.closed}
            </span>
          </div>
        </div>
      </div>

      {/* Resolution Outcomes */}
      {totalOutcomes > 0 && (
        <div className="mt-4" data-testid="metric-outcomes">
          <p className="text-xs text-gray-500 mb-2">Resolution Outcomes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>Full Refund: {metrics.resolutionOutcomes.fullRefund}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Partial Refund: {metrics.resolutionOutcomes.partialRefund}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
              <span>
                Replacement: {metrics.resolutionOutcomes.productReplacement}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>
                Rejected: {metrics.resolutionOutcomes.disputeRejected}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
