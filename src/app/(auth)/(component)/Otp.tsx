"use client";

import FullButton from "@/components/FullButton";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useVerifyEmail, useResendVerification } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { toastConfigSuccess, toastConfigError } from "@/app/config/toast.config";
import { useUserStore } from "@/stores/useUserStore";
import { useRouter } from "next/navigation";

interface OTPModalProps {
  email?: string;
  close?: () => void;
  setAuthState?: (state: "login" | "recover" | "otp") => void;
}

const OTPModal: React.FC<OTPModalProps> = ({
  email,
  close,
  setAuthState
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { setUser } = useUserStore();
  const router = useRouter();
  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmail();
  const { mutate: resendVerification, isPending: isResending } = useResendVerification();

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && isOpen) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle input change
  const handleInputChange = (index: number, value: string): void => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down events
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const digits = pasteData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);

      // Focus the next empty input or the last input
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Handle submit
  const handleNext = (): void => {
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      verifyEmail(
        { code: otpValue },
        {
          onSuccess: (data) => {
            setUser(data.user);
            setAuthState?.("login");
            toast.success("Email verified successfully!", toastConfigSuccess);
            if (close) close();
            router.push("/home");
          },
          onError: (error) => {
            toast.error(error.message, toastConfigError);
          },
        }
      );
    } else {
      toast.error("Please enter all 6 digits", toastConfigError);
    }
  };

  // Handle resend
  const handleResend = (): void => {
    if (!email) {
      toast.error("Email is required to resend verification", toastConfigError);
      return;
    }
    
    resendVerification(
      email,
      {
        onSuccess: () => {
          setTimeLeft(120); // Reset timer
          setOtp(["", "", "", "", "", ""]); // Clear OTP
          inputRefs.current[0]?.focus(); // Focus first input
          toast.success("New OTP sent to your email!", toastConfigSuccess);
        },
        onError: (error) => {
          toast.error(error.message, toastConfigError);
        },
      }
    );
  };

  // Handle close
  const handleClose = (): void => {
    setIsOpen(false);
  };

  // Handle cancel
  const handleCancel = (): void => {
    if (close) {
      close();
    } else {
      setIsOpen(false);
    }
  };

 

  return (
    <div>
      <div className="py-3 flex justify-between mb-[10px]   ">
        <h3 className="text-[14px] flex-1  text-center   md:text-[20px] md:leading-[24px]  text-gray-700 font-semibold">
          Email Confirmation{" "}
        </h3>

        <X onClick={close} className="cursor-pointer text-black" size={20} />
      </div>
      <p className="text-xs text-black text-center mb-[10px] md:mb-[24px]">
        {" "}
        Provide the One Time Password sent to your email
      </p>

      {/* OTP Input */}
      <div className="flex justify-center gap-4 mb-6">
        {otp.map((digit, index) => (
          <div key={index} className="flex flex-col items-center">
             {/* <span className="text-3xl font-bold text-gray-800 mt-2">
                {digit || "*"}
              </span> */}
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-16 h-16 text-center text-2xl text-black font-semibold border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors bg-transparent"
              autoComplete="off"
              aria-label={`Digit ${index + 1}`}
            />
           
          </div>
        ))}
      </div>

      {/* Resend and Timer */}
      <div className="flex justify-between items-center mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Didn't receive code?</span>
          <button
            onClick={handleResend}
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors disabled:opacity-50"
            disabled={timeLeft > 0 || isResending}
          >
            {isResending ? "Sending..." : "Resend"}
          </button>
        </div>
        <div className="text-gray-800 font-medium">{formatTime(timeLeft)}</div>
      </div>

      {/* Action Buttons */}

      <div className="mb-4 md:mb-6 mt-4 md:mt-6 flex flex-col gap-4">
        <FullButton
          action={() => handleNext()}
          color="blue"
          name={isVerifying ? "Verifying..." : "Verify"}
          disabled={otp.join("").length !== 6 || isVerifying}
          isLoading={isVerifying}
        />
        <FullButton action={() => handleCancel()} color="" name="Cancel" />
      </div>
    </div>
  );
};
export default OTPModal;
