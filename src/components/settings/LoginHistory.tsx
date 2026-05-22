"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsService, LoginEvent } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

/**
 * Returns the appropriate device icon based on device type.
 */
function DeviceIcon({ deviceType }: { deviceType: string }) {
  switch (deviceType) {
    case "mobile":
      return <Smartphone className="w-4 h-4" />;
    case "tablet":
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
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

/**
 * Formats location into a readable string.
 */
function formatLocation(location?: { city: string; country: string }): string {
  if (!location) return "Unknown location";
  return `${location.city}, ${location.country}`;
}

export default function LoginHistory() {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch login history with pagination
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loginHistory", currentPage],
    queryFn: () => settingsService.getLoginHistory(currentPage),
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
        <span className="ml-2 text-sm text-gray-500">Loading login history...</span>
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
            {(error as Error)?.message || "Failed to load login history."}
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
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Login History</h3>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No login history found.</p>
      ) : (
        <>
          <div className="space-y-2">
            {events.map((event: LoginEvent) => {
              const isAnomalous = event.isNewDevice || event.isUnusualLocation;

              return (
                <div
                  key={event._id}
                  data-testid={`login-event-${event._id}`}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    isAnomalous
                      ? "border-amber-300 bg-amber-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full mt-0.5 ${
                        isAnomalous
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <DeviceIcon deviceType={event.deviceType} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {event.browser} on {event.deviceType}
                        </span>
                        {isAnomalous && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                            data-testid="anomaly-indicator"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {event.isNewDevice && event.isUnusualLocation
                              ? "New device & location"
                              : event.isNewDevice
                              ? "New device"
                              : "Unusual location"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(event.timestamp)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          IP: {event.ipAddress}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatLocation(event.location)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {event.success ? "Success" : "Failed"}
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
