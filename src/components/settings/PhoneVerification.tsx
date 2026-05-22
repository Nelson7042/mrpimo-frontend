"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface PhoneVerificationProps {
  /** Current phone number from user profile */
  phoneNumber?: string;
  /** Whether the phone is already verified */
  isVerified?: boolean;
  /** Callback when verification succeeds */
  onVerified?: () => void;
}

type VerificationState = "idle" | "sending" | "otp_sent" | "verifying" | "verified" | "locked";

const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes
const MAX_ATTEMPTS = 3;

export default function PhoneVerification({
  phoneNumber: initialPhone = "",
  isVerified = false,
  onVerified,
}: PhoneVerificationProps) {
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState("");
  const [state, setState] = useState<VerificationState>(
    isVerified ? "verified" : "idle"
  );
  const [countdown, setCountdown] = useState(0);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const failedAttemptsRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (lockoutRef.current) clearInterval(lockoutRef.current);
    };
  }, []);

  // Start OTP countdown timer
  const startCountdown = useCallback((seconds: number) => {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start lockout countdown timer
  const startLockout = useCallback((seconds: number) => {
    setState("locked");
    setLockoutCountdown(seconds);
    if (lockoutRef.current) clearInterval(lockoutRef.current);
    lockoutRef.current = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          if (lockoutRef.current) clearInterval(lockoutRef.current);
          setState("idle");
          setFailedAttempts(0);
          failedAttemptsRef.current = 0;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => settingsService.sendPhoneOTP(phone),
    onSuccess: (data) => {
      setState("otp_sent");
      setOtpCode("");
      const expiresAt = new Date(data.expiresAt);
      const secondsRemaining = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      startCountdown(secondsRemaining || OTP_EXPIRY_SECONDS);
      toast.success("OTP sent to your phone number.");
    },
    onError: (error: Error) => {
      if (error.message?.toLowerCase().includes("locked") || error.message?.toLowerCase().includes("too many")) {
        startLockout(LOCKOUT_SECONDS);
        toast.error(error.message);
      } else {
        toast.error(error.message || "Failed to send OTP.");
      }
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (code: string) => settingsService.verifyPhoneOTP(code),
    onSuccess: (data) => {
      if (data.verified) {
        setState("verified");
        setOtpCode("");
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(0);
        toast.success("Phone number verified successfully!");
        onVerified?.();
      } else {
        failedAttemptsRef.current += 1;
        const newAttempts = failedAttemptsRef.current;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          startLockout(LOCKOUT_SECONDS);
          toast.error("Too many failed attempts. Verification locked for 15 minutes.");
        } else {
          setState("otp_sent");
          toast.error(`Incorrect OTP. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
        }
      }
    },
    onError: (error: Error) => {
      if (error.message?.toLowerCase().includes("locked") || error.message?.toLowerCase().includes("too many")) {
        startLockout(LOCKOUT_SECONDS);
        toast.error(error.message);
      } else {
        failedAttemptsRef.current += 1;
        const newAttempts = failedAttemptsRef.current;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          startLockout(LOCKOUT_SECONDS);
          toast.error("Too many failed attempts. Verification locked for 15 minutes.");
        } else {
          setState("otp_sent");
          toast.error(error.message || `Incorrect or expired OTP. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
        }
      }
    },
  });

  const handleSendOtp = () => {
    if (!phoneInput.trim()) {
      toast.error("Please enter a phone number.");
      return;
    }
    setState("sending");
    sendOtpMutation.mutate(phoneInput.trim());
  };

  const handleVerifyOtp = () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setState("verifying");
    verifyOtpMutation.mutate(otpCode.trim());
  };

  const handleResendOtp = () => {
    setState("sending");
    sendOtpMutation.mutate(phoneInput.trim());
  };

  /**
   * Format seconds into MM:SS display.
   */
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Phone className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Phone Verification</h3>
        {/* Verification status badge */}
        {state === "verified" || isVerified ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            data-testid="verified-badge"
          >
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
            data-testid="unverified-badge"
          >
            <XCircle className="w-3 h-3" />
            Unverified
          </span>
        )}
      </div>

      {/* Locked state */}
      {state === "locked" && (
        <div
          className="rounded-md bg-red-50 border border-red-200 p-4"
          data-testid="lockout-message"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Verification locked
              </p>
              <p className="text-xs text-red-600 mt-1">
                Too many failed attempts. Try again in{" "}
                <span data-testid="lockout-timer">{formatTime(lockoutCountdown)}</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phone input and Send OTP button */}
      {state !== "verified" && state !== "locked" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={state === "otp_sent" || state === "sending" || state === "verifying"}
              className="flex-1"
              data-testid="phone-input"
              aria-label="Phone number"
            />
            <Button
              onClick={handleSendOtp}
              disabled={
                state === "sending" ||
                state === "otp_sent" ||
                state === "verifying" ||
                !phoneInput.trim()
              }
              data-testid="send-otp-button"
            >
              {state === "sending" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </div>

          {/* OTP input section - shown after OTP is sent */}
          {(state === "otp_sent" || state === "verifying") && (
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-gray-50" data-testid="otp-section">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Enter the 6-digit code sent to your phone
                </p>
                {countdown > 0 && (
                  <span className="text-xs text-gray-500" data-testid="otp-countdown">
                    Expires in {formatTime(countdown)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={state === "verifying"}
                  className="flex-1 text-center tracking-widest text-lg font-mono"
                  data-testid="otp-input"
                  aria-label="OTP code"
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={state === "verifying" || otpCode.length !== 6}
                  data-testid="verify-otp-button"
                >
                  {state === "verifying" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>

              {/* Resend and countdown info */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 && state !== "otp_sent"}
                  data-testid="resend-otp-button"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Resend OTP
                </Button>
                {failedAttempts > 0 && (
                  <span className="text-xs text-amber-600" data-testid="attempts-remaining">
                    {MAX_ATTEMPTS - failedAttempts} attempt(s) remaining
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified state - allow re-verification with different number */}
      {state === "verified" && (
        <p className="text-sm text-gray-500">
          Your phone number is verified. To change your phone number, update it in your profile settings.
        </p>
      )}
    </div>
  );
}
