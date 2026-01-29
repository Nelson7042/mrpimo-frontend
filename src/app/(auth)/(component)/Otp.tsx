"use client";

import FullButton from "@/components/FullButton";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useVerifyEmail, useResendVerification } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { toastConfigSuccess, toastConfigError } from "@/app/config/toast.config";
import { useUserStore } from "@/stores/useUserStore";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface OTPModalProps {
  email?: string;
  close?: () => void;
  setAuthState?: (state: "login" | "recover" | "otp") => void;
}

const OTPModal: React.FC<OTPModalProps> = ({
  email: emailProp,
  close,
  setAuthState
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { setUser, user } = useUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmail();
  const { mutate: resendVerification, isPending: isResending } = useResendVerification();

  // Get email from prop, user store, or temporary storage
  const [tempUser, setTempUser] = useState<any>(null);
  
  useEffect(() => {
    // Try to get user from temporary storage if not in store
    if (!user) {
      const tempUserStr = localStorage.getItem('tempUserForVerification');
      if (tempUserStr) {
        try {
          const parsedUser = JSON.parse(tempUserStr);
          setTempUser(parsedUser);
          console.log('📧 Loaded temp user from localStorage:', parsedUser);
        } catch (e) {
          console.error('Failed to parse temp user:', e);
        }
      }
    }
  }, [user]);

  const email = emailProp || user?.email || tempUser?.email;

  // Log email for debugging
  useEffect(() => {
    console.log('📧 OTP Modal - Email from prop:', emailProp);
    console.log('📧 OTP Modal - Email from user store:', user?.email);
    console.log('📧 OTP Modal - Final email:', email);
  }, [emailProp, user?.email, email]);

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
            console.log('✅ Email verification successful, user data:', data.user);
            
            // Clear temporary user from localStorage
            localStorage.removeItem('tempUserForVerification');
            
            // Ensure isEmailVerified is set to true before adding to store
            const verifiedUser = {
              ...data.user,
              isEmailVerified: true
            };
            
            console.log('✅ Setting verified user in store:', verifiedUser);
            
            // Set the verified user in the store
            setUser(verifiedUser);
            
            // Invalidate user profile query to force refetch with updated data
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            
            toast.success("Email verified successfully!", toastConfigSuccess);
            
            // If we have setAuthState, we're in the auth modal flow
            if (setAuthState) {
              // After signup verification, close modal and redirect
              if (close) close();
              // Small delay to ensure store is persisted before redirect
              setTimeout(() => {
                router.push("/home/user");
              }, 100);
            } else {
              // Standalone flow (login with unverified email) - complete login
              if (close) close();
              setTimeout(() => {
                router.push("/home");
              }, 100);
            }
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
    console.log('🔄 Attempting to resend OTP for email:', email);
    
    if (!email || email.trim() === '') {
      console.error('❌ Email is missing or empty');
      toast.error("Email is required to resend verification", toastConfigError);
      return;
    }

    // Prevent resend if timer is still running
    if (timeLeft > 0) {
      toast.error(`Please wait ${formatTime(timeLeft)} before resending`, toastConfigError);
      return;
    }
    
    console.log('✅ Email validated, calling resendVerification...');
    resendVerification(
      email,
      {
        onSuccess: () => {
          setTimeLeft(120); // Reset timer to 2 minutes
          setOtp(["", "", "", "", "", ""]); // Clear OTP
          inputRefs.current[0]?.focus(); // Focus first input
          toast.success("New OTP sent to your email!", toastConfigSuccess);
        },
        onError: (error) => {
          console.error('❌ Resend verification failed:', error);
          toast.error(error.message, toastConfigError);
        },
      }
    );
  };

  // Check if resend button should be disabled
  const isResendDisabled = timeLeft > 0 || isResending;

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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-8 text-sm">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="text-gray-600">Didn't receive code?</span>
          <button
            onClick={handleResend}
            className={`font-medium transition-colors ${
              isResendDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-500 hover:text-blue-600 cursor-pointer'
            }`}
            disabled={isResendDisabled}
            type="button"
          >
            {isResending ? "Sending..." : timeLeft > 0 ? `Resend (${formatTime(timeLeft)})` : "Resend"}
          </button>
        </div>
        {timeLeft > 0 && (
          <div className="text-gray-800 font-medium bg-gray-100 px-3 py-1 rounded">
            {formatTime(timeLeft)}
          </div>
        )}
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
