"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DisputeEscalateButtonProps {
  issueId: string;
  disputeCreatedAt: string;
  disputeStatus: string;
  escalatedAt?: string | null;
  onEscalated?: (escalatedAt: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Checks if a dispute has been open for more than 7 days.
 */
export function isEligibleForEscalation(
  createdAt: string,
  status: string,
  escalatedAt?: string | null
): boolean {
  // Must not already be escalated
  if (escalatedAt) return false;

  // Must be in an open/active state (not resolved or closed)
  const activeStatuses = ["open", "in-progress", "in_progress"];
  if (!activeStatuses.includes(status.toLowerCase())) return false;

  // Must be open for more than 7 days
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > 7;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DisputeEscalateButton({
  issueId,
  disputeCreatedAt,
  disputeStatus,
  escalatedAt: initialEscalatedAt,
  onEscalated,
}: DisputeEscalateButtonProps) {
  const [isEscalating, setIsEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalatedAt, setEscalatedAt] = useState<string | null>(
    initialEscalatedAt || null
  );

  // If already escalated, show the escalation date
  if (escalatedAt) {
    const escalationDate = new Date(escalatedAt);
    return (
      <div
        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
        data-testid="escalation-info"
      >
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <span>
          Escalated on{" "}
          {escalationDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    );
  }

  // Check eligibility
  const eligible = isEligibleForEscalation(
    disputeCreatedAt,
    disputeStatus,
    escalatedAt
  );

  // If not eligible, don't render anything
  if (!eligible) {
    return null;
  }

  // ─── Handle escalation ─────────────────────────────────────────────────

  const handleEscalate = async () => {
    setIsEscalating(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/issues/${issueId}/escalate`,
        { method: "POST" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to escalate dispute"
        );
      }

      const data = await response.json();
      const newEscalatedAt =
        data.escalatedAt || new Date().toISOString();

      setEscalatedAt(newEscalatedAt);
      onEscalated?.(newEscalatedAt);
    } catch (err: any) {
      setError(err.message || "Failed to escalate dispute");
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div className="space-y-2" data-testid="escalate-section">
      <Button
        variant="outline"
        size="sm"
        onClick={handleEscalate}
        disabled={isEscalating}
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
        data-testid="escalate-button"
      >
        {isEscalating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Escalating...
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Escalate
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600" data-testid="escalate-error">
          {error}
        </p>
      )}
    </div>
  );
}
