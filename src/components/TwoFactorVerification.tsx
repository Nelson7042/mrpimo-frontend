"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

interface TwoFactorVerificationProps {
  userId: string;
  onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  userId,
  onCancel,
}) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code", toastConfigError);
      return;
    }

    setIsLoading(true);

    try {
      setIsLoading(true);
      const endpoint = isUsingBackupCode
        ? "http://localhost:5800/api/v1/two-factor/verify-backup"
        : "http://localhost:5800/api/v1/two-factor/verify";

      const response = await fetchWithAuth(endpoint, {
        method: "POST",
        body: JSON.stringify({
          [isUsingBackupCode ? "backupCode" : "token"]: verificationCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }
      toast.success("Login successful", toastConfigSuccess);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl px-6 md:px-20 lg:px-40 pt-6 pb-8 w-full max-w-3xl font-[family-name:var(--font-alexandria)] mt-4 md:mt-8">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Two-Factor Authentication
      </h2>

      <form onSubmit={handleVerify} className="md:px-10">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(
                isUsingBackupCode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/[^0-9]/g, "")
              )
            }
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder={
              isUsingBackupCode ? "Enter backup code" : "Enter 6-digit code"
            }
            maxLength={isUsingBackupCode ? 8 : 6}
            autoFocus
          />
          <p className="text-sm text-gray-600 mt-2">
            {isUsingBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading || (!isUsingBackupCode && verificationCode.length !== 6)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsUsingBackupCode(!isUsingBackupCode);
              setVerificationCode("");
            }}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {isUsingBackupCode 
              ? "Use authenticator app instead" 
              : "Use backup code instead"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default TwoFactorVerification;
