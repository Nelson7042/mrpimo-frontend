"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useVerifyEmail, useResendVerification } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/useUserStore";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";
import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import Successful from "@/components/Successful";

const VerifyAccount = () => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [timer, setTimer] = useState(120);
  const [isChecking, setIsChecking] = useState(true);
  const [showPage, setShowPage] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isInvalidCode, setIsInvalidCode] = useState(false);
  const inputRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );
  const expirationRef = useRef(Date.now() + timer * 1000);

  const router = useRouter();
  const { mutate, isPending } = useVerifyEmail();
  const { mutate: resendCode, isPending: isResending } =
    useResendVerification();
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!user) {
      toast.error("Please login to verify your email", toastConfigError);
      router.push("/login");
    } else {
      setIsChecking(false);
      setShowPage(true);
    }
  }, [user]);

  useEffect(() => {
    expirationRef.current = Date.now() + timer * 1000;

    const updateTimerDisplay = () => {
      const now = Date.now();
      const diff = expirationRef.current - now;

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
  }, [timer]);

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
    inputRefs[0].current?.focus(); // Focus the first input field
    console.log("Resending verification code...");

    expirationRef.current = Date.now() + 120 * 1000; // reset expiration
    setTimer(120); // reset timer
    setIsDisabled(true);
    resendCode(user?.email!, {
      onSuccess: (data) => {
        toast.success(data.message, toastConfigSuccess);
      },
      onError: (error) => {
        toast.error(error.message, toastConfigError);
      },
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const updatedCode = pastedData.split("");
      setVerificationCode(updatedCode);
      setIsDisabled(false);
    }
  };

  const handleResetCode = () => {
    setVerificationCode(["", "", "", "", "", ""]);
    inputRefs[0].current?.focus();
    setIsInvalidCode(false);
  };

  const checkIfDisabled = () => {
    const isAnyFieldEmpty = verificationCode.some((code) => code === "");
    return isAnyFieldEmpty;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    console.log("Verifying code:", code);
    // Add your verification
    const disabled = checkIfDisabled();

    if (disabled) return;

    mutate(
      { code },
      {
        onSuccess: (data) => {
          toast.success(data.message, toastConfigSuccess);
          setVerificationCode(["", "", "", "", "", ""]);
          setIsVerified(true);
          setUser(data.user)
        },
        onError: (error) => {
          toast.error(error.message, toastConfigError);
          setIsInvalidCode(true);
          setIsDisabled(true);
        },
      }
    );
  };

  if (isChecking) return <Loader />;

  return (
    <>
      {showPage && (
        <div
          className={`flex flex-col md:flex-row gap-6 md:gap-x-8 justify-center items-center min-h-screen p-4 bg-gray-200`}
        >
          <Link href="/">
            <div className="bg-white md:mt-8 mb-4 md:mb-0 rounded-full w-[60px] h-[60px] p-3 flex items-center justify-center shadow-md hover:shadow-lg transition duration-300 ease-in-out">
              <FaArrowLeft className="text-gray-600" size={32} />
            </div>
          </Link>
          <div className="relative bg-white shadow-md rounded-xl px-6 md:px-20 lg:px-40 pt-6 pb-8 w-full max-w-3xl font-[family-name:var(--font-alexandria)] mt-4 md:mt-8">
            <h2 className="text-center text-2xl  text-black my-2">
              Email Verification
            </h2>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-center text-gray-400 mb-2">
              Enter the 6-digit OTP that was sent to your mail to complete your
              account registration
            </p>

            <div className="mt-8">
              <form className="space-y-10 px-2" onSubmit={handleVerify}>
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
                        onPaste={handlePaste}
                        className={`appearance-none block w-full px-2 py-2  md:py-6 border rounded-md shadow-sm placeholder-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center ${
                          isInvalidCode
                            ? "text-red-500 border-red"
                            : "border-black"
                        } `}
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
                    type="submit"
                    className="w-full md:w-1/2 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5187f6] hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      verificationCode.some((code) => code === "") || isPending
                    }
                  >
                    {isPending ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    onClick={handleResendCode}
                    disabled={isDisabled || isResending}
                    className="text-sm w-full md:w-1/2 rounded-md font-semibold text-red-800 bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-2"
                  >
                    Resend
                  </button>
                  {isInvalidCode && (
                    <button
                      onClick={handleResetCode}
                      className="text-sm w-full md:w-1/2 rounded-md font-semibold text-yellow-800 bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-2"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
            {isVerified && (
              <div className="absolute top-0 left-0 transform flex items-center justify-center bg-black/50 w-full h-full rounded-lg">
                <div className="text-center p-6 pb-2 shadow-lg bg-white w-3/4 md:w-1/2 h-[70%] flex flex-col items-center justify-end opacity-100">
                  <Successful />
                  <h1 className="text-xl font-semibold mb-1 text-[#5187f6] mt-2">
                    Successful
                  </h1>
                  <p className="mb-4 text-xs text-gray-600">
                    Your account has been created successfully. You can now
                    proceed to login.
                  </p>
                  <button className="text-white bg-[#5187f6] px-4 py-2 rounded-xl font-semibold hover:bg-[#5187f6]/90 transition duration-200">
                    <Link href="/login">Go to Login</Link>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VerifyAccount;
