"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

const CompleteVerificationPage = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  const checkVerificationStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetchWithAuth(
        "http://localhost:5800/api/v1/verification/stripe/status"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch verification status");
      }
      const data = await response.json();
      console.log(data);
      setVerificationStatus(data);
      setIsVerified(data.status === "verified" || data.status === "complete");
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const handleGoToDashboard = () => {
    router.push("/vendor/dashboard");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {isVerified ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Complete!
              </h1>

              <p className="text-gray-600 mb-6">
                Congratulations! Your vendor account has been successfully
                verified. You can now start selling on our platform.
              </p>

              <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-900 mb-2">
                  What's Next:
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Add your first product</li>
                  <li>• Set up your store profile</li>
                  <li>• Configure payment settings</li>
                  <li>• Start receiving orders</li>
                </ul>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-yellow-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Pending
              </h1>

              <p className="text-gray-600 mb-6">
                Your verification is still being processed. This may take a few
                minutes.
              </p>

              {verificationStatus && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Current Status:
                  </h3>
                  <p className="text-sm text-gray-600">
                    Status:{" "}
                    <span className="font-medium">
                      {verificationStatus.status}
                    </span>
                  </p>
                  {verificationStatus.requirements_pending?.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Pending:{" "}
                      {verificationStatus.requirements_pending.join(", ")}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={checkVerificationStatus}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Status Again
                </button>

                <button
                  onClick={() => router.push("/vendor/verification/refresh")}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Continue Verification
                </button>
              </div>
              <div className="space-y-3 mt-3">
                <button
                  onClick={handleGoToDashboard}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompleteVerificationPage;
