"use client";

import LoginForm from "@/components/LoginForm";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { X, Fingerprint } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "react-toastify";
import { toastConfigInfo, toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import TwoFactorVerification from "@/components/TwoFactorVerification";
import OTPModal from "@/app/(auth)/(component)/Otp";
import { useProductStore } from "@/stores/useProductStore";
import { API_BASE_URL } from "@/utils/config";

const LoginPage = () => {
  const [requires2FA, setRequires2FA] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [userId, setUserId] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUserStore();
  const { setVendor } = useProductStore();

  const returnUrl = searchParams.get('returnUrl') || '/';

  // Check if biometric login is available
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.PublicKeyCredential &&
          typeof window.PublicKeyCredential.isConditionalMediationAvailable === "function"
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

  if (user && user.role === "user" && !user.isEmailVerified) {
    router.push("/email-verification");
    toast.info("Please verify your email", toastConfigInfo);
    return null;
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    
    const googleAuthUrl = `${API_BASE_URL}/auth/google`;
    
    window.location.href = googleAuthUrl;
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");

      // Get discoverable authentication options (no userId needed)
      const optionsRes = await fetch(`${API_BASE_URL}/webauthn/authenticate/discoverable/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!optionsRes.ok) {
        const errData = await optionsRes.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to get authentication options");
      }

      const optionsData = await optionsRes.json();

      // Start WebAuthn authentication ceremony with discoverable credentials
      const authResponse = await startAuthentication({ optionsJSON: optionsData.options });

      // Verify with discoverable endpoint
      const verifyRes = await fetch(`${API_BASE_URL}/webauthn/authenticate/discoverable/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challengeId: optionsData.challengeId, response: authResponse }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.message || "Biometric authentication failed");
      }

      const data = await verifyRes.json();

      if (data.success && data.user) {
        // Store tokens in localStorage (same as normal login flow)
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        setUser(data.user);
        if (data.vendor) setVendor(data.vendor);
        toast.success("Signed in with biometrics!", toastConfigSuccess);
        router.push(returnUrl);
      } else {
        throw new Error(data.message || "Authentication failed");
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Biometric authentication was cancelled.", toastConfigError);
      } else {
        toast.error(err.message || "Biometric authentication failed", toastConfigError);
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    // Check if email verification is required
    if (userData.requiresEmailVerification) {
      if (userData.user) {
        setUser(userData.user);
      }
      setRequiresEmailVerification(true);
      return;
    }

    // Check if 2FA is required
    if (userData.requires2FA || userData.has2faEnabled) {
      setUserId(userData.user?._id || "");
      setRequires2FA(true);
    } else {
      setUser(userData.user);
      if (userData.vendor) setVendor(userData.vendor);
      router.push(returnUrl);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
      {requires2FA ? (
        <TwoFactorVerification 
          userId={userId}
          onCancel={() => setRequires2FA(false)}
        />
      ) : requiresEmailVerification ? (
        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 w-full max-w-md">
          <OTPModal 
            close={() => {
              setRequiresEmailVerification(false);
              router.push("/");
            }}
          />
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 w-full max-w-md">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 flex-1 text-center">
              Log in or Create an Account
            </h3>
            <Link href="/home">
              <X className="cursor-pointer text-gray-600 hover:text-gray-800" size={20} />
            </Link>
          </div>

          {/* Login Form */}
          <LoginForm onLoginSuccess={handleLoginSuccess} />

          {/* Divider */}
          <div className="relative border-b-2 border-gray-300 w-full mx-auto my-6">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500 text-sm">
              or
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full py-2 md:py-3 text-sm text-center px-4 flex items-center justify-center bg-[#F6B76F] text-[#121212] rounded-md hover:bg-[#F5A94E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                width="25"
                height="24"
                viewBox="0 0 31 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M27.7569 12.5519H26.75V12.5H15.5V17.5H22.5644C21.5338 20.4106 18.7644 22.5 15.5 22.5C11.3581 22.5 8 19.1419 8 15C8 10.8581 11.3581 7.5 15.5 7.5C17.4119 7.5 19.1513 8.22125 20.4756 9.39937L24.0112 5.86375C21.7787 3.78312 18.7925 2.5 15.5 2.5C8.59688 2.5 3 8.09688 3 15C3 21.9031 8.59688 27.5 15.5 27.5C22.4031 27.5 28 21.9031 28 15C28 14.1619 27.9137 13.3438 27.7569 12.5519Z"
                  fill="#FFC107"
                />
                <path
                  d="M4.44116 9.18188L8.54804 12.1938C9.65929 9.4425 12.3505 7.5 15.4999 7.5C17.4118 7.5 19.1512 8.22125 20.4755 9.39937L24.0112 5.86375C21.7787 3.78312 18.7924 2.5 15.4999 2.5C10.6987 2.5 6.53491 5.21062 4.44116 9.18188Z"
                  fill="#FF3D00"
                />
                <path
                  d="M15.5 27.4999C18.7287 27.4999 21.6625 26.2643 23.8806 24.2549L20.0118 20.9812C18.7149 21.9681 17.1297 22.5017 15.5 22.4999C12.2487 22.4999 9.48808 20.4268 8.44808 17.5337L4.37183 20.6743C6.44058 24.7224 10.6418 27.4999 15.5 27.4999Z"
                  fill="#4CAF50"
                />
                <path
                  d="M27.7569 12.5519H26.75V12.5H15.5V17.5H22.5644C22.0714 18.8853 21.1833 20.0957 20.01 20.9819L20.0119 20.9806L23.8806 24.2544C23.6069 24.5031 28 21.25 28 15C28 14.1619 27.9137 13.3438 27.7569 12.5519Z"
                  fill="#1976D2"
                />
              </svg>
              <span className="ml-2">
                {isGoogleLoading ? "Redirecting..." : "Sign in with Google"}
              </span>
            </button>

            <button
              className="w-full py-2 md:py-3 text-sm text-center px-4 flex items-center justify-center border border-[#F6B76F] text-[#121212] rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.1813 3.0025C20.1813 4.2825 19.6313 5.5625 18.8538 6.485C18.0288 7.5075 16.6012 8.2675 15.4663 8.2675C15.3363 8.2675 15.2063 8.25 15.1262 8.235C15.0967 8.08592 15.0808 7.93446 15.0787 7.7825C15.0787 6.485 15.7437 5.205 16.4563 4.395C17.3637 3.3425 18.8688 2.5475 20.1338 2.5C20.1663 2.645 20.1813 2.825 20.1813 3.0025ZM24.6425 11.065L24.705 11.0238C23.0187 8.6075 20.4587 8.5425 19.7463 8.5425C18.6562 8.5425 17.68 8.93 16.86 9.255C16.2662 9.49 15.7537 9.6925 15.3387 9.6925C14.88 9.6925 14.355 9.48 13.7688 9.245C13.0288 8.945 12.1938 8.6075 11.2713 8.6075C8.16 8.6075 5 11.1875 5 16.0462C5 19.0763 6.1675 22.27 7.6125 24.325C8.86 26.075 9.945 27.5 11.5 27.5C12.2375 27.5 12.7788 27.2712 13.3475 27.03C13.9775 26.7625 14.6425 26.48 15.6475 26.48C16.665 26.48 17.2725 26.745 17.8575 27C18.4038 27.2375 18.9288 27.4675 19.7487 27.4675C21.4487 27.4675 22.5662 25.93 23.6362 24.39C24.8363 22.64 25.34 20.9225 25.355 20.8425C25.2575 20.81 21.9988 19.4963 21.9988 15.7862C21.9988 12.7987 24.22 11.3425 24.6425 11.065Z"
                  fill="black"
                />
              </svg>
              <span className="ml-2">Sign in with Apple</span>
            </button>

            {/* Biometric Login Button - conditionally shown */}
            {isBiometricAvailable && (
              <button
                onClick={handleBiometricLogin}
                disabled={isBiometricLoading}
                className="w-full py-2 md:py-3 text-sm text-center px-4 flex items-center justify-center border border-[#F6B76F] text-[#121212] rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Sign in with biometrics"
              >
                <Fingerprint className="w-5 h-5" />
                <span className="ml-2">
                  {isBiometricLoading ? "Authenticating..." : "Sign in with Biometrics"}
                </span>
              </button>
            )}
          </div>

          {/* Sign Up Link */}
          <div className="text-xs text-gray-500 text-center mt-4">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
