"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePasswordReset } from "@/contexts/PasswordResetContext";
import { useRouter } from "next/navigation";
import { useResendPasswordResetToken, useVerifyEmailForPasswordChange } from "@/hooks/mutations";
import {
  toastConfigError,
  toastConfigInfo,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { toast } from "react-toastify";
import Loader from "@/components/Loader";


type Props = {};

const VerifyToken = (props: Props) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [timer, setTimer] = useState(120);
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [redirecting, setRedirecting] = useState(false);

  const { mutate: verifyToken, isPending } = useVerifyEmailForPasswordChange();
  const { mutate, isPending: isResending } = useResendPasswordResetToken();

  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );

  const { step, setStep, userEmail } = usePasswordReset();
  const router = useRouter();

  useEffect(() => {
    const expiration = Date.now() + timer * 1000;

    const updateTimerDisplay = () => {
      const now = Date.now();
      const diff = expiration - now;

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );
    };

    const displayInterval = setInterval(updateTimerDisplay, 1000);

    const countdownInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(displayInterval);
      clearInterval(countdownInterval);
    };
  }, [isDisabled]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const updatedCode = [...verificationCode];
    updatedCode[index] = value;
    setVerificationCode(updatedCode);

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
  };

  const handleResendCode = () => {
    setVerificationCode(["", "", "", "", "", ""]);
    inputRefs[0].current?.focus();
    console.log("Resending verification code...");
    mutate({email: userEmail}, {
      onSuccess: (data) => {
        toast.success(data.message, toastConfigSuccess);
        setTimer(120); // Reset the timer to 2 minutes (120 seconds)
      },
      onError: (error) => {
        toast.error(error.message, toastConfigError);
        setIsDisabled(false);
      },
    });
    setIsDisabled(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    console.log("Verifying code:", code);

    const disabled = code.length !== 6;

    if (disabled) return;

    verifyToken(
      { code },
      {
        onSuccess: (data) => {
          toast.success(data.message, toastConfigInfo);
          setVerificationCode(["", "", "", "", "", ""]);
          setStep(step + 1); // Move to the next step
          setRedirecting(true);
          router.push("/reset-password");
        },
        onError: (error) => {
          toast.error(error.message, toastConfigError);
          setVerificationCode(["", "", "", "", "", ""]);
          setIsDisabled(true);
        },
      }
    );
  };

  if (redirecting) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-xl px-6 md:px-20 lg:px-40 pt-6 pb-8 w-full max-w-3xl font-[family-name:var(--font-alexandria)] ">
      <h2 className="text-center text-2xl  text-black my-2">
        Email Verification
      </h2>
      <p className="font-[family-name:var(--font-poppins)] text-sm text-center text-gray-400 mb-2">
        Enter the 6-digit OTP that was sent to your mail to complete your
        account registration
      </p>

      <div className="mt-8">
        <form className="space-y-10 px-2">
          <div>
            <div className="grid grid-cols-6 gap-3">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="appearance-none block w-full p-2 md:py-6 border border-black rounded-md shadow-sm placeholder-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center"
                  required
                />
              ))}
            </div>
          </div>

          <div className="text-xs text-red-400 mt-2 px-2 text-center ">
            <p>Code expires in: {timeRemaining}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-y-4 md:gap-x-2 md:gap-y-0 md:mt-4">
            <button
              onClick={handleResendCode}
              disabled={isDisabled  || isResending}
              className="text-sm w-full md:w-1/2 rounded-md font-semibold text-red-800 bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-2"
            >
              {isResending ? "Resending..." : "Resend"}
            </button>
            <button
              type="submit"
              className="w-full md:w-1/2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5187f6] hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-90"
              onClick={handleVerify}
              disabled={isPending}
            >
              {isPending ? "Verifying..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyToken;
