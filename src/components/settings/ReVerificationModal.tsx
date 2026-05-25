"use client";

import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Fingerprint,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ReVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export default function ReVerificationModal({
  isOpen,
  onClose,
  onVerified,
  title = "Re-verification Required",
  description = "Please verify your identity to continue with this sensitive operation.",
}: ReVerificationModalProps) {
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"totp" | "biometric">("totp");

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.PublicKeyCredential &&
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
        ) {
          const available =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricAvailable(available);
        }
      } catch {
        setIsBiometricAvailable(false);
      }
    };
    checkBiometric();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTotpCode("");
      setError("");
      setMethod("totp");
    }
  }, [isOpen]);

  const handleTOTPVerify = useCallback(async () => {
    if (!totpCode.trim() || totpCode.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/two-factor/reverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode, method: "totp" }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Verification failed");
      }

      toast.success("Identity verified.");
      onVerified();
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [totpCode, onVerified]);

  const handleBiometricVerify = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");

      // Get authentication options
      const optionsRes = await fetchWithAuth(`${API_BASE_URL}/webauthn/authenticate/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!optionsRes.ok) {
        const errData = await optionsRes.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to get authentication options");
      }

      const optionsData = await optionsRes.json();

      // Start WebAuthn authentication
      const authResponse = await startAuthentication({ optionsJSON: optionsData.options || optionsData });

      // Submit to re-verification endpoint
      const verifyRes = await fetchWithAuth(`${API_BASE_URL}/two-factor/reverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "webauthn", response: authResponse }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.message || "Biometric verification failed");
      }

      toast.success("Identity verified.");
      onVerified();
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Biometric authentication was cancelled.");
      } else {
        setError(err.message || "Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [onVerified]);

  // Handle Enter key for TOTP
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && method === "totp") {
      handleTOTPVerify();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reverify-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 id="reverify-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close re-verification modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-6">{description}</p>

        {/* Method toggle */}
        {isBiometricAvailable && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={method === "totp" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("totp")}
              className="flex-1"
            >
              <Shield className="w-4 h-4 mr-1" />
              TOTP Code
            </Button>
            <Button
              variant={method === "biometric" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("biometric")}
              className="flex-1"
            >
              <Fingerprint className="w-4 h-4 mr-1" />
              Biometric
            </Button>
          </div>
        )}

        {/* TOTP input */}
        {method === "totp" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reverify-code" className="text-sm">
                Enter your 6-digit authenticator code
              </Label>
              <Input
                id="reverify-code"
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                maxLength={6}
                className="mt-1 text-center text-lg tracking-widest"
                autoFocus
                aria-label="TOTP verification code"
              />
            </div>
            <Button
              onClick={handleTOTPVerify}
              disabled={isLoading || totpCode.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        )}

        {/* Biometric */}
        {method === "biometric" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Use your device&apos;s biometric sensor to verify your identity.
            </p>
            <Button
              onClick={handleBiometricVerify}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-1" />
                  Authenticate with Biometrics
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 mt-4 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
