"use client";
import React, { useEffect, useState, useRef } from "react";
import Header from "./(components)/Header";
import Sidebar from "./(components)/Sidebar";
import { useUserStore } from "@/stores/useUserStore";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import LogoutModal from "@/components/users/LogOutPromptModal";
import { useLogoutUser, useVerifyEmail, useResendVerification } from "@/hooks/mutations";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import { resetAllStores } from "@/stores/resetStore";
import { Mail, CheckCircle } from "lucide-react";

function EmailVerificationGate({ user }: { user: any }) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setUser } = useUserStore();
  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmail();
  const { mutate: resendVerification, isPending: isResending } = useResendVerification();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
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
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = (): void => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter all 6 digits", toastConfigError);
      return;
    }
    verifyEmail(
      { code: otpValue },
      {
        onSuccess: (data) => {
          const verifiedUser = { ...data.user, isEmailVerified: true };
          setUser(verifiedUser);
          toast.success("Email verified successfully! Welcome to your dashboard.", toastConfigSuccess);
        },
        onError: (error: any) => {
          toast.error(error.message || "Verification failed. Please try again.", toastConfigError);
        },
      }
    );
  };

  const handleResend = (): void => {
    if (timeLeft > 0) {
      toast.error(`Please wait ${formatTime(timeLeft)} before resending`, toastConfigError);
      return;
    }
    resendVerification(user.email, {
      onSuccess: () => {
        setTimeLeft(120);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        toast.success("New OTP sent to your email!", toastConfigSuccess);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to resend. Please try again.", toastConfigError);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Verify Your Email
        </h1>
        <p className="text-sm text-gray-600 text-center mb-1">
          We sent a verification code to
        </p>
        <p className="text-sm font-medium text-blue-600 text-center mb-6">
          {user.email}
        </p>
        <p className="text-xs text-gray-500 text-center mb-6">
          Please verify your email to access your vendor dashboard. Can&apos;t find it? Check your spam folder.
        </p>

        {/* OTP Input */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-gray-900"
              autoComplete="off"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={otp.join("").length !== 6 || isVerifying}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
        >
          {isVerifying ? "Verifying..." : "Verify Email"}
        </button>

        {/* Resend */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-600">Didn&apos;t receive code?</span>
          <button
            onClick={handleResend}
            disabled={timeLeft > 0 || isResending}
            className={`font-medium transition-colors ${
              timeLeft > 0 || isResending
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-700 cursor-pointer"
            }`}
          >
            {isResending ? "Sending..." : timeLeft > 0 ? `Resend (${formatTime(timeLeft)})` : "Resend"}
          </button>
        </div>

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Code expires in {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const { user } = useUserStore();
  const router = useRouter();
  const logoutMutation = useLogoutUser();

  useEffect(() => {
    // Check if user store has been initialized
    if (useUserStore.persist.hasHydrated()) {
      setIsLoading(false);
    } else {
      const unsubscribe = useUserStore.persist.onHydrate(() => {
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    // Only redirect if we're not loading
    if (!isLoading) {
      if (!user) {
        window.location.href = "/home";
      } else if (user.role === "user" && !user.canMakeSales) {
        toast.error(
          "You don't have permission to access this page. Please upgrade your account",
          toastConfigError
        );
        router.push("/home");
      }
    }
  }, [user, isLoading, router]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // After loading, check permissions
  if (!user) {
    return null;
  }

  // User without sales permission - will be redirected by useEffect
  if (user.role === "user" && !user.canMakeSales) {
    return null;
  }

  // Email verification gate - show OTP screen if email not verified
  if (!user.isEmailVerified) {
    return <EmailVerificationGate user={user} />;
  }

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        
        resetAllStores();
        window.location.href = "/home";
      },
      onError: (error) => {
        console.error("Logout failed:", error);
        toast.error(error.message, toastConfigError);
      },
    });
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <NotificationProvider scope="vendor">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            isOpen={true}
            onClose={() => {}}
            openLogoutModal={() => openLogoutModal()}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="">{children}</div>
          </main>
        </div>

        {/* Mobile Sidebar - overlays everything */}
        <div className="lg:hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            openLogoutModal={() => openLogoutModal()}
          />
        </div>

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={closeLogoutModal}
          logout={handleLogout}
          isLoading={logoutMutation.isPending}
        />
      </NotificationProvider>
    </div>
  );
}
