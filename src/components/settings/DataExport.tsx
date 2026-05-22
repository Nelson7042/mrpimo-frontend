"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2,
  CheckCircle,
  Clock,
  FileArchive,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DataExport() {
  const queryClient = useQueryClient();
  const [activeExportId, setActiveExportId] = useState<string | null>(null);

  // Check if user can request a new export
  const { data: canExportData, isLoading: isCheckingCooldown } = useQuery({
    queryKey: ["canRequestExport"],
    queryFn: () => settingsService.canRequestDataExport(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Poll export status when there's an active export
  const { data: exportStatus } = useQuery({
    queryKey: ["exportStatus", activeExportId],
    queryFn: () => settingsService.getExportStatus(activeExportId!),
    enabled: !!activeExportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "expired") return false;
      return 5000; // Poll every 5 seconds while pending/processing
    },
  });

  // Request export mutation
  const exportMutation = useMutation({
    mutationFn: () => settingsService.requestDataExport(),
    onSuccess: (data) => {
      setActiveExportId(data.exportId);
      toast.success("Data export requested. You'll be notified when it's ready.");
      queryClient.invalidateQueries({ queryKey: ["canRequestExport"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to request data export");
    },
  });

  // Update cooldown state when export completes
  useEffect(() => {
    if (exportStatus?.status === "ready") {
      queryClient.invalidateQueries({ queryKey: ["canRequestExport"] });
    }
  }, [exportStatus?.status, queryClient]);

  const canExport = canExportData?.canExport ?? false;
  const isExporting =
    exportStatus?.status === "pending" || exportStatus?.status === "processing";
  const isReady = exportStatus?.status === "ready";

  const getStatusIcon = () => {
    if (isExporting) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (isReady) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const getStatusText = () => {
    if (!exportStatus) return null;
    switch (exportStatus.status) {
      case "pending":
        return "Export queued...";
      case "processing":
        return "Generating your data export...";
      case "ready":
        return "Export ready for download";
      case "expired":
        return "Export has expired";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileArchive className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Data Export</h3>
      </div>

      <p className="text-sm text-gray-600">
        Download a copy of your personal data including your profile, orders,
        disputes, addresses, and activity history. The export is generated as a
        ZIP archive containing JSON files.
      </p>

      {/* Status display */}
      {exportStatus && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 border border-gray-200">
          {getStatusIcon()}
          <span className="text-sm text-gray-700">{getStatusText()}</span>
        </div>
      )}

      {/* Download link when ready */}
      {isReady && exportStatus?.downloadUrl && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-2">
                Your data export is ready
              </p>
              <a
                href={exportStatus.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                aria-label="Download data export"
              >
                <Download className="w-4 h-4" />
                Download Export
              </a>
              {exportStatus.expiresAt && (
                <p className="text-xs text-green-700 mt-2">
                  This link expires on{" "}
                  {new Date(exportStatus.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cooldown notice */}
      {!canExport && !isExporting && !isReady && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <span className="text-sm text-yellow-700">
            You can request a new export once every 24 hours.
          </span>
        </div>
      )}

      {/* Request button */}
      <Button
        onClick={() => exportMutation.mutate()}
        disabled={
          !canExport ||
          isExporting ||
          exportMutation.isPending ||
          isCheckingCooldown
        }
        className="flex items-center gap-2"
        aria-label="Request data export"
      >
        {exportMutation.isPending || isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isExporting ? "Export in Progress..." : "Request Export"}
      </Button>

      <p className="text-xs text-gray-500">
        Exports typically take 1-2 minutes to generate. You&apos;ll receive an
        email notification when your export is ready. Download links are valid
        for 7 days.
      </p>
    </div>
  );
}
