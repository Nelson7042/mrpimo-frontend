"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, Session } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Tablet,
  LogOut,
  Loader2,
  RefreshCw,
  Shield,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Returns the appropriate device icon based on device type.
 */
function DeviceIcon({ deviceType }: { deviceType: string }) {
  switch (deviceType) {
    case "mobile":
      return <Smartphone className="w-5 h-5" />;
    case "tablet":
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

/**
 * Formats a date string into a human-readable relative time or date.
 */
function formatLastActivity(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export default function SessionManagement() {
  const queryClient = useQueryClient();
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  // Fetch active sessions
  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => settingsService.getActiveSessions(),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });

  // Terminate session mutation with optimistic updates
  const terminateMutation = useMutation({
    mutationFn: (sessionId: string) => settingsService.terminateSession(sessionId),
    onMutate: async (sessionId: string) => {
      setTerminatingId(sessionId);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["sessions"] });

      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData<Session[]>(["sessions"]);

      // Optimistically remove the session from the list
      queryClient.setQueryData<Session[]>(["sessions"], (old) =>
        old ? old.filter((s) => s.sessionId !== sessionId) : []
      );

      return { previousSessions };
    },
    onError: (_err, _sessionId, context) => {
      // Rollback on failure
      if (context?.previousSessions) {
        queryClient.setQueryData(["sessions"], context.previousSessions);
      }
      toast.error("Failed to terminate session. Please try again.");
    },
    onSuccess: () => {
      toast.success("Session terminated successfully.");
    },
    onSettled: () => {
      setTerminatingId(null);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const handleTerminate = useCallback(
    (sessionId: string) => {
      terminateMutation.mutate(sessionId);
    },
    [terminateMutation]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading sessions...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {(error as Error)?.message || "Failed to load sessions."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-3"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
      </div>

      {!sessions || sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No active sessions found.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              data-testid={`session-${session.sessionId}`}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                session.isCurrent
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    session.isCurrent
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <DeviceIcon deviceType={session.deviceType} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {session.browser} on {session.deviceType}
                    </span>
                    {session.isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Current session
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      IP: {session.ipAddress}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Last active: {formatLastActivity(session.lastActivity)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {session.isCurrent ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="Cannot terminate current session"
                    aria-label="Cannot terminate current session"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Log Out
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminate(session.sessionId)}
                    disabled={terminatingId === session.sessionId}
                    aria-label={`Log out session on ${session.browser}`}
                  >
                    {terminatingId === session.sessionId ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-1" />
                    )}
                    Log Out
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
