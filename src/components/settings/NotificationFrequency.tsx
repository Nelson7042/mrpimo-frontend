"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Frequency = "real-time" | "daily_digest";

export default function NotificationFrequency() {
  const queryClient = useQueryClient();
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency>("real-time");
  const [digestTime, setDigestTime] = useState("09:00");
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch current user profile to get existing preference
  const { isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    select: (data) => {
      const prefs = data?.user?.preferences?.notifications;
      return {
        frequency: prefs?.frequency || "real-time",
        digestTime: prefs?.digestTime || "09:00",
      };
    },
    enabled: !hasLoaded,
  });

  // Initialize state from fetched data
  useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    select: (data) => {
      const prefs = data?.user?.preferences?.notifications;
      if (!hasLoaded && prefs) {
        setSelectedFrequency(prefs.frequency || "real-time");
        setDigestTime(prefs.digestTime || "09:00");
        setHasLoaded(true);
      }
      return prefs;
    },
  });

  // Mutation to update frequency
  const updateMutation = useMutation({
    mutationFn: ({
      frequency,
      digestTime,
    }: {
      frequency: Frequency;
      digestTime?: string;
    }) => settingsService.updateNotificationFrequency(frequency, digestTime),
    onSuccess: () => {
      toast.success("Notification frequency updated");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update notification frequency");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      frequency: selectedFrequency,
      digestTime: selectedFrequency === "daily_digest" ? digestTime : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Notification Frequency
        </h3>
      </div>

      <p className="text-sm text-gray-600">
        Choose how often you receive non-critical notifications. Security
        notifications (password changes, login alerts) are always delivered
        immediately.
      </p>

      {/* Frequency selection */}
      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
            selectedFrequency === "real-time"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="frequency"
            value="real-time"
            checked={selectedFrequency === "real-time"}
            onChange={() => setSelectedFrequency("real-time")}
            className="mt-1 accent-blue-600"
            aria-label="Real-time notifications"
          />
          <div>
            <span className="font-medium text-gray-900">Real-time</span>
            <p className="text-sm text-gray-500 mt-0.5">
              Receive notifications as they happen
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
            selectedFrequency === "daily_digest"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="frequency"
            value="daily_digest"
            checked={selectedFrequency === "daily_digest"}
            onChange={() => setSelectedFrequency("daily_digest")}
            className="mt-1 accent-blue-600"
            aria-label="Daily digest notifications"
          />
          <div>
            <span className="font-medium text-gray-900">Daily Digest</span>
            <p className="text-sm text-gray-500 mt-0.5">
              Receive a summary of all notifications once per day
            </p>
          </div>
        </label>
      </div>

      {/* Time picker for daily digest */}
      {selectedFrequency === "daily_digest" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <label
            htmlFor="digest-time"
            className="text-sm font-medium text-gray-700"
          >
            Delivery time:
          </label>
          <input
            id="digest-time"
            type="time"
            value={digestTime}
            onChange={(e) => setDigestTime(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Digest delivery time"
          />
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="flex items-center gap-2"
        aria-label="Save notification frequency preference"
      >
        {updateMutation.isPending && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        Save Preference
      </Button>
    </div>
  );
}
