"use client";

import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EscalationIndicatorProps {
  escalatedAt: string | null;
  variant: "badge" | "banner";
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays an escalation indicator for disputes that have been escalated
 * to admin review. Supports two variants:
 * - "badge": compact badge for list views
 * - "banner": full-width banner for detail views
 */
export default function EscalationIndicator({
  escalatedAt,
  variant,
}: EscalationIndicatorProps) {
  // Show nothing when not escalated
  if (!escalatedAt) {
    return null;
  }

  const escalationDate = format(new Date(escalatedAt), "MMM dd, yyyy");

  // Badge variant for list view
  if (variant === "badge") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
        data-testid="escalation-badge"
      >
        <AlertTriangle className="w-3 h-3" />
        Escalated · {escalationDate}
      </span>
    );
  }

  // Banner variant for detail view
  return (
    <div
      className="w-full rounded-lg border border-amber-300 bg-amber-50 p-4"
      data-testid="escalation-banner"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-amber-800">
            Escalated to Admin Review
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            Escalated on {escalationDate}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            An admin is reviewing this dispute
          </p>
        </div>
      </div>
    </div>
  );
}
