"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface DeletionBannerProps {
  deletionScheduledAt: string;
}

/**
 * Formats the deletion date for display.
 */
function formatDeletionDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Calculates the number of days remaining until deletion.
 */
function daysRemaining(dateStr: string): number {
  const deletionDate = new Date(dateStr);
  const now = new Date();
  const diffMs = deletionDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * DeletionBanner displays a warning banner when the user has a pending
 * account deletion. It shows the scheduled deletion date and provides
 * a "Cancel Deletion" button to restore the account.
 */
export default function DeletionBanner({
  deletionScheduledAt,
}: DeletionBannerProps) {
  const queryClient = useQueryClient();
  const remaining = daysRemaining(deletionScheduledAt);

  const cancelMutation = useMutation({
    mutationFn: () => settingsService.cancelAccountDeletion(),
    onSuccess: () => {
      toast.success("Account deletion cancelled. Your account has been restored.");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel account deletion.");
    },
  });

  return (
    <div
      className="rounded-md bg-amber-50 border border-amber-300 p-4"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Account Deletion Pending
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Your account is scheduled for permanent deletion on{" "}
            <strong>{formatDeletionDate(deletionScheduledAt)}</strong>
            {remaining > 0 && ` (${remaining} day${remaining !== 1 ? "s" : ""} remaining)`}.
            After this date, your personal data will be permanently anonymized.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            aria-label="Cancel account deletion"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <XCircle className="w-4 h-4 mr-1" />
            )}
            Cancel Deletion
          </Button>
        </div>
      </div>
    </div>
  );
}
