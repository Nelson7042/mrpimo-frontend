"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface PromptData {
  shouldShow: boolean;
}

async function checkShouldShowPrompt(): Promise<PromptData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/vendors/security-score`);
  if (!response.ok) {
    return { shouldShow: false };
  }
  const data = await response.json();
  // Show prompt if 2FA is not enabled and the API indicates it should be shown
  const scoreData = data.data || data;
  return {
    shouldShow: scoreData.showEnrollmentPrompt === true || 
      (!scoreData.factors?.twoFactorEnabled && scoreData.score < 80),
  };
}

async function dismissPrompt(): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/vendors/2fa/dismiss-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to dismiss prompt");
  }
}

export default function TwoFactorEnrollmentBanner() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  const { data } = useQuery<PromptData>({
    queryKey: ["vendor2faPrompt"],
    queryFn: checkShouldShowPrompt,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const dismissMutation = useMutation({
    mutationFn: dismissPrompt,
    onSuccess: () => {
      setIsDismissed(true);
      queryClient.invalidateQueries({ queryKey: ["vendor2faPrompt"] });
    },
  });

  // Don't show if dismissed or API says not to show
  if (isDismissed || !data?.shouldShow) {
    return null;
  }

  return (
    <div
      className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4 md:mb-5"
      role="alert"
      aria-label="Two-factor authentication enrollment prompt"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-blue-100">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-roboto font-bold text-sm text-blue-900">
              Secure Your Store with 2FA
            </h3>
            <p className="font-roboto text-xs text-blue-800 mt-1">
              Protect your vendor account and customer data by enabling two-factor authentication.
              Earn the &quot;Verified Seller&quot; badge and boost your security score.
            </p>
            <Button
              size="sm"
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push("/vendor/dashboard/settings?tab=security")}
            >
              <Shield className="w-3.5 h-3.5 mr-1" />
              Enable 2FA Now
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dismissMutation.mutate()}
          disabled={dismissMutation.isPending}
          aria-label="Dismiss 2FA enrollment prompt"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
