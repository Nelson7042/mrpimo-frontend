"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsService, SecurityEvent } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Mail,
  LogIn,
  LogOut,
  Trash2,
  XCircle,
  CheckCircle2,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

/**
 * Returns an icon and label for a given security event type.
 */
function getEventTypeDisplay(eventType: SecurityEvent["eventType"]): {
  icon: React.ReactNode;
  label: string;
} {
  switch (eventType) {
    case "password_change":
      return { icon: <KeyRound className="w-4 h-4" />, label: "Password Changed" };
    case "email_change":
      return { icon: <Mail className="w-4 h-4" />, label: "Email Changed" };
    case "login_success":
      return { icon: <LogIn className="w-4 h-4" />, label: "Login Success" };
    case "login_failure":
      return { icon: <LogIn className="w-4 h-4" />, label: "Login Failed" };
    case "session_terminated":
      return { icon: <LogOut className="w-4 h-4" />, label: "Session Terminated" };
    case "account_deletion_request":
      return { icon: <Trash2 className="w-4 h-4" />, label: "Deletion Requested" };
    case "account_deletion_cancelled":
      return { icon: <XCircle className="w-4 h-4" />, label: "Deletion Cancelled" };
    default:
      return { icon: <Shield className="w-4 h-4" />, label: eventType };
  }
}

/**
 * Formats a timestamp into a readable date/time string.
 */
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecurityEventLog() {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch security events with pagination
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["securityEvents", currentPage],
    queryFn: () => settingsService.getSecurityEvents(currentPage),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading security events...</span>
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
            {(error as Error)?.message || "Failed to load security events."}
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
        <h3 className="text-lg font-semibold text-gray-900">Security Event Log</h3>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No security events found.</p>
      ) : (
        <>
          <div className="space-y-2">
            {events.map((event: SecurityEvent) => {
              const { icon, label } = getEventTypeDisplay(event.eventType);
              const isFailure = event.outcome === "failure";

              return (
                <div
                  key={event._id}
                  data-testid={`security-event-${event._id}`}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    isFailure
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full mt-0.5 ${
                        isFailure
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(event.createdAt)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          IP: {event.ipAddress}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {event.browser} on {event.deviceType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isFailure
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                      data-testid={`event-outcome-${event._id}`}
                    >
                      {isFailure ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          Failed
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
