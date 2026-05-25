"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";

interface SecurityScoreData {
  score: number;
  factors: {
    twoFactorEnabled: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    accountAgeOver90Days: boolean;
  };
  isVerifiedSeller: boolean;
}

async function fetchSecurityScore(): Promise<SecurityScoreData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/vendors/security-score`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch security score");
  }
  const data = await response.json();
  return data.data || data;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-blue-50 border-blue-200";
  if (score >= 40) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function SecurityScoreBadge() {
  const { data, isLoading, isError } = useQuery<SecurityScoreData>({
    queryKey: ["vendorSecurityScore"],
    queryFn: fetchSecurityScore,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-xs text-gray-500">Loading security score...</span>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className={`rounded-lg border p-4 ${getScoreBgColor(data.score)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${getScoreColor(data.score)}`} />
          <span className="text-sm font-semibold text-gray-900">Security Score</span>
        </div>
        {data.isVerifiedSeller && (
          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Verified Seller</span>
          </div>
        )}
      </div>

      {/* Score display */}
      <div className="flex items-end gap-1 mb-3">
        <span className={`text-3xl font-bold ${getScoreColor(data.score)}`}>
          {data.score}
        </span>
        <span className="text-sm text-gray-500 mb-1">/100</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(data.score)}`}
          style={{ width: `${data.score}%` }}
          role="progressbar"
          aria-valuenow={data.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Security score: ${data.score} out of 100`}
        />
      </div>

      {/* Factors breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <FactorItem label="2FA Enabled" active={data.factors.twoFactorEnabled} points={40} />
        <FactorItem label="Email Verified" active={data.factors.emailVerified} points={20} />
        <FactorItem label="Phone Verified" active={data.factors.phoneVerified} points={20} />
        <FactorItem label="Account Age 90d+" active={data.factors.accountAgeOver90Days} points={20} />
      </div>
    </div>
  );
}

function FactorItem({ label, active, points }: { label: string; active: boolean; points: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-2 h-2 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`}
      />
      <span className={`text-xs ${active ? "text-gray-700" : "text-gray-400"}`}>
        {label} ({points}pts)
      </span>
    </div>
  );
}
