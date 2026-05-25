"use client";

import { useState } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldAlert,
  Mail,
  HelpCircle,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type RecoveryStep = "idle" | "email_sent" | "security_question" | "cooling_period" | "completed" | "error";

interface RecoveryFlowProps {
  onClose?: () => void;
}

export default function RecoveryFlow({ onClose }: RecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [coolingPeriodExpires, setCoolingPeriodExpires] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInitiateRecovery = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/recovery/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to initiate recovery");
      }

      toast.success("Recovery email sent. Check your inbox.");
      setStep("email_sent");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate recovery");
      toast.error(err.message || "Failed to initiate recovery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/recovery/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Invalid verification code");
      }

      const data = await response.json();
      setSecurityQuestion(data.securityQuestion || "What is your security answer?");
      setStep("security_question");
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed");
      toast.error(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySecurityQuestion = async () => {
    if (!securityAnswer.trim()) {
      toast.error("Please enter your answer.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/recovery/verify-security-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: securityAnswer.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Incorrect answer");
      }

      const data = await response.json();
      setCoolingPeriodExpires(data.coolingPeriodExpiresAt || null);
      setStep("cooling_period");
      toast.success("Security question verified. Cooling period started.");
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed");
      toast.error(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRecovery = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/recovery/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to cancel recovery");
      }

      toast.success("Recovery cancelled.");
      setStep("idle");
      setEmailCode("");
      setSecurityAnswer("");
      setErrorMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel recovery");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "email_sent", label: "Email", icon: Mail },
      { key: "security_question", label: "Security", icon: HelpCircle },
      { key: "cooling_period", label: "Waiting", icon: Clock },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center justify-center gap-2 mb-6" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={3}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i <= currentIndex;
          return (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${isActive ? "bg-blue-300" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Account Recovery</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close recovery flow">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {step !== "idle" && renderStepIndicator()}

      {/* Idle state - start recovery */}
      {step === "idle" && (
        <div className="space-y-4">
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Lost your authenticator?</p>
                <p className="text-xs text-amber-700 mt-1">
                  If you&apos;ve lost access to your authenticator app and backup codes, you can
                  recover your account through email verification and security questions. This
                  process includes a 48-hour cooling period for security.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleInitiateRecovery} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Initiating...
              </>
            ) : (
              "Start Recovery Process"
            )}
          </Button>
        </div>
      )}

      {/* Email verification step */}
      {step === "email_sent" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            A verification code has been sent to your registered email address.
            Enter the code below to continue.
          </p>
          <div>
            <Label htmlFor="recovery-email-code" className="text-sm">
              Verification Code
            </Label>
            <Input
              id="recovery-email-code"
              type="text"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="mt-1"
              aria-label="Email verification code"
            />
          </div>
          {errorMessage && (
            <p className="text-xs text-red-600">{errorMessage}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleVerifyEmail} disabled={isLoading || !emailCode.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <Button variant="outline" onClick={handleCancelRecovery} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Security question step */}
      {step === "security_question" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please answer your security question to proceed.
          </p>
          <div>
            <Label className="text-sm font-medium text-gray-700">
              {securityQuestion}
            </Label>
            <Input
              id="recovery-security-answer"
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Your answer"
              className="mt-2"
              aria-label="Security question answer"
            />
          </div>
          {errorMessage && (
            <p className="text-xs text-red-600">{errorMessage}</p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleVerifySecurityQuestion}
              disabled={isLoading || !securityAnswer.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Verifying...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
            <Button variant="outline" onClick={handleCancelRecovery} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Cooling period step */}
      {step === "cooling_period" && (
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">48-Hour Cooling Period</p>
                <p className="text-xs text-blue-700 mt-1">
                  For your security, there is a mandatory 48-hour waiting period before your
                  2FA is reset. You will receive an email with a cancellation link in case
                  this request was not made by you.
                </p>
                {coolingPeriodExpires && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Recovery will complete: {new Date(coolingPeriodExpires).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleCancelRecovery} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Cancelling...
              </>
            ) : (
              "Cancel Recovery"
            )}
          </Button>
        </div>
      )}

      {/* Completed state */}
      {step === "completed" && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-800">
              Account recovery completed. Your 2FA has been reset. Please set up 2FA again for security.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
