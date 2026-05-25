"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Loader2,
  RefreshCw,
  Shield,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface TrustedDevice {
  _id: string;
  fingerprint: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  trustedAt: string;
  expiresAt: string;
}

function getDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
    return "mobile";
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }
  return "desktop";
}

function DeviceIcon({ userAgent }: { userAgent: string }) {
  const type = getDeviceType(userAgent);
  switch (type) {
    case "mobile":
      return <Smartphone className="w-5 h-5" />;
    case "tablet":
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

function getBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("opera") || ua.includes("opr")) return "Opera";
  return "Unknown Browser";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / 86400000));
}

async function fetchTrustedDevices(): Promise<TrustedDevice[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/trusted-devices`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch trusted devices");
  }
  const data = await response.json();
  return data.devices || data.trustedDevices || [];
}

async function revokeDevice(deviceId: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/trusted-devices/${deviceId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to revoke device");
  }
}

async function revokeAllDevices(): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/trusted-devices`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to revoke all devices");
  }
}

export default function TrustedDevices() {
  const queryClient = useQueryClient();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const {
    data: devices,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TrustedDevice[]>({
    queryKey: ["trustedDevices"],
    queryFn: fetchTrustedDevices,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeDevice,
    onMutate: async (deviceId: string) => {
      setRevokingId(deviceId);
      await queryClient.cancelQueries({ queryKey: ["trustedDevices"] });
      const previousDevices = queryClient.getQueryData<TrustedDevice[]>(["trustedDevices"]);
      queryClient.setQueryData<TrustedDevice[]>(["trustedDevices"], (old) =>
        old ? old.filter((d) => d._id !== deviceId) : []
      );
      return { previousDevices };
    },
    onError: (_err, _deviceId, context) => {
      if (context?.previousDevices) {
        queryClient.setQueryData(["trustedDevices"], context.previousDevices);
      }
      toast.error("Failed to revoke device. Please try again.");
    },
    onSuccess: () => {
      toast.success("Device revoked successfully.");
    },
    onSettled: () => {
      setRevokingId(null);
      queryClient.invalidateQueries({ queryKey: ["trustedDevices"] });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllDevices,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["trustedDevices"] });
      const previousDevices = queryClient.getQueryData<TrustedDevice[]>(["trustedDevices"]);
      queryClient.setQueryData<TrustedDevice[]>(["trustedDevices"], []);
      return { previousDevices };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDevices) {
        queryClient.setQueryData(["trustedDevices"], context.previousDevices);
      }
      toast.error("Failed to revoke all devices. Please try again.");
    },
    onSuccess: () => {
      toast.success("All trusted devices revoked.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trustedDevices"] });
    },
  });

  const handleRevoke = useCallback(
    (deviceId: string) => {
      revokeMutation.mutate(deviceId);
    },
    [revokeMutation]
  );

  const handleRevokeAll = useCallback(() => {
    revokeAllMutation.mutate();
  }, [revokeAllMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading trusted devices...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {(error as Error)?.message || "Failed to load trusted devices."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Trusted Devices</h3>
        </div>
        {devices && devices.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAll}
            disabled={revokeAllMutation.isPending}
            aria-label="Revoke all trusted devices"
          >
            {revokeAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1" />
            )}
            Revoke All
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Trusted devices can skip 2FA verification for 30 days. Revoke any device you no longer recognize.
      </p>

      {!devices || devices.length === 0 ? (
        <p className="text-sm text-gray-500">No trusted devices found.</p>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device._id}
              data-testid={`trusted-device-${device._id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                  <DeviceIcon userAgent={device.userAgent} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getBrowserName(device.userAgent)} on {getDeviceType(device.userAgent)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">IP: {device.ipAddress}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Trusted: {formatDate(device.trustedAt)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Expires in {getDaysRemaining(device.expiresAt)} days
                    </span>
                  </div>
                  {device.location && (
                    <span className="text-xs text-gray-400 mt-0.5 block">
                      {device.location}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevoke(device._id)}
                disabled={revokingId === device._id}
                aria-label={`Revoke trusted device ${getBrowserName(device.userAgent)}`}
              >
                {revokingId === device._id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
