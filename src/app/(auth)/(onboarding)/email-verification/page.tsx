"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useVerifyEmail, useResendVerification } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/useUserStore";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";
import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import FullButton from "@/components/FullButton";

const VerifyAccount = () => {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isChecking, setIsChecking] = useState(true);
  const [showPage, setShowPage] = useState(false);
  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );

  const router = useRouter();
  const { mutate: verifyEmail, isPending } = useVerifyEmail();
  const { mutate: resendCode, isPending: isResending } = useResendVerification();
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!user) {
      // Check for temp user from login
      try {
        const tempUserStr = localStorage.getItem('tempUser');
        if (tempUserStr) {
          const tempUser = JSON.parse(tempUserStr);
          setUser(tempUser);
          localStorage.removeItem('tempUser');
          setIsChecking(false);
          setShowPage(true);
          return;
        }
      } catch (e) {
        console.error('Failed to parse temp user:', e);
      }
      
      toast.error("Please login to verify your email", toastConfigError);
      router.push("/login");
    } else {
      setIsChecking(false);
      setShowPage(true);
    }
  }, [user, router, setUser]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && showPage) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, showPage]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const updatedCode = [...verificationCode];
    updatedCode[index] = value;
    setVerificationCode(updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const updatedCode = pastedData.split("");
      setVerificationCode(updatedCode);
      // Focus the last input
      inputRefs[5].current?.focus();
    }
  };

  const handleResendCode = () => {
    if (!user?.email) {
      console.error("❌ User email is missing");
      toast.error("Email is required to resend verification", toastConfigError);
      return;
    }

    // Prevent resend if timer is still running
    if (timeLeft > 0) {
      toast.error(
        `Please wait ${formatTime(timeLeft)} before resending`,
        toastConfigError
      );
      return;
    }

    setVerificationCode(["", "", "", "", "", ""]);
    inputRefs[0].current?.focus();
    setTimeLeft(120); // Reset timer to 2 minutes

    resendCode(user.email, {
      onSuccess: (data) => {
        toast.success(data.message, toastConfigSuccess);
      },
      onError: (error) => {
        console.error("❌ Resend failed:", error);
        toast.error(error.message, toastConfigError);
      },
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");

    if (code.length !== 6) {
      toast.error("Please enter all 6 digits", toastConfigError);
      return;
    }

    verifyEmail(
      { code },
      {
        onSuccess: (data) => {
          setUser(data.user);
          toast.success("Email verified successfully!", toastConfigSuccess);
          router.push("/home");
        },
        onError: (error) => {
          toast.error(error.message, toastConfigError);
          setVerificationCode(["", "", "", "", "", ""]);
          inputRefs[0].current?.focus();
        },
      }
    );
  };

  const isResendDisabled = timeLeft > 0 || isResending;

  if (isChecking) return <Loader />;

  return (
    <>
      {showPage && (
        <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
          <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 flex-1 text-center">
                Email Confirmation
              </h3>
              <Link href="/home">
                <X className="cursor-pointer text-gray-600 hover:text-gray-800" size={20} />
              </Link>
            </div>

            <p className="text-xs md:text-sm text-gray-600 text-center mb-6">
              Provide the One Time Password sent to your email
            </p>

            {/* OTP Input */}
            <form onSubmit={handleVerify}>
              <div className="flex justify-center gap-2 md:gap-4 mb-6">
                {verificationCode.map((digit, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <input
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 md:w-16 md:h-16 text-center text-xl md:text-2xl text-black font-semibold border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors bg-transparent"
                      autoComplete="off"
                      aria-label={`Digit ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Resend and Timer */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-6 text-sm">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <span className="text-gray-600">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className={`font-medium transition-colors ${
                      isResendDisabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-500 hover:text-blue-600 cursor-pointer"
                    }`}
                    disabled={isResendDisabled}
                  >
                    {isResending
                      ? "Sending..."
                      : timeLeft > 0
                      ? `Resend (${formatTime(timeLeft)})`
                      : "Resend"}
                  </button>
                </div>
                {timeLeft > 0 && (
                  <div className="text-gray-800 font-medium bg-gray-100 px-3 py-1 rounded">
                    {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <FullButton
                  action={() => {}}
                  color="blue"
                  name={isPending ? "Verifying..." : "Verify"}
                  disabled={verificationCode.some((code) => code === "") || isPending}
                  isLoading={isPending}
                />
                <FullButton
                  action={() => router.push("/home")}
                  color=""
                  name="Cancel"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VerifyAccount;
