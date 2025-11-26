"use client";

import LoginForm from "@/components/LoginForm";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigInfo, toastConfigSuccess } from "@/app/config/toast.config";
import { useGoogleLogin } from "@/hooks/queries";
import TwoFactorVerification from "@/components/TwoFactorVerification";
import { useProductStore } from "@/stores/useProductStore";


const LoginPage = () => {
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState("");
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const {setVendor} = useProductStore();

  const { data, isFetching: isCallingGoogle, error, refetch, isFetched } = useGoogleLogin();

  if (user && user.role==="personal" && !user.isEmailVerified) {
    router.push("/email-verification");
    toast.info("Please verify your email", toastConfigInfo);
    return null;
  }

  const handleGoogleLogin = () => {
    refetch();
  };

  // Add this function to handle successful login from LoginForm
  const handleLoginSuccess = (userData: any) => {
    if (userData.has2faEnabled) {
      setUserId(userData.user._id);
      setRequires2FA(true);
      
    } else {
      setUser(userData.user);
      router.push("/");
    }
  };

  useEffect(() => {
    if (isFetched && data && !error) {
      setUser(data.user);
      if (data.vendor) setVendor(data.vendor)
      if (data.requires2FA) {
        setUserId(data.user._id);
        setRequires2FA(true);
      } else {
        toast.success(data.message, toastConfigSuccess);
        router.push("/");
      }
    } else if (isFetched && error) {
      toast.error(error.message, toastConfigError);
    }
  }, [isFetched]);

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-x-8 justify-center items-center min-h-screen p-4 bg-gray-200">
      <Link href="/">
        <div className="bg-white md:mt-8 mb-4 md:mb-0 rounded-full w-[60px] h-[60px] p-3 flex items-center justify-center shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <FaArrowLeft className="text-gray-600" size={32} />
        </div>
      </Link>
      
      {requires2FA ? (
        <TwoFactorVerification 
          userId={userId}
          onCancel={() => setRequires2FA(false)}
        />
      ) : (
        <div className="bg-white shadow-md rounded-xl px-6 md:px-20 lg:px-40 pt-6 pb-8 w-full max-w-3xl font-[family-name:var(--font-alexandria)] mt-4 md:mt-8">
          <h2 className="text-2xl font-semibold text-center">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-center text-sm mb-6">
            Continue shopping effortlessly
          </p>
          <div className="md:px-10">
            <LoginForm onLoginSuccess={handleLoginSuccess} />
            <div className="relative my-4 border-b-2 border-gray-300 w-3/4 mx-auto mb-4">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500">
                or
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 font-[family-name:var(--font-poppins)]">
              <button 
                className={`bg-white border-2 cursor-pointer border-gray-300 hover:bg-gray-100 text-gray-800 py-2 px-2 rounded-xl focus:outline-none focus:shadow-outline w-full flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed`}
                disabled={isCallingGoogle}
                onClick={handleGoogleLogin}
              >
                <img
                  src="/images/google.png"
                  alt="Google Logo"
                  className="w-5 h-5 mr-1"
                />
                <div className="text-xs">{!isCallingGoogle ? "Continue with Google" : "..." }</div>
              </button>
              <button className="bg-white border-2 cursor-pointer border-gray-300 hover:bg-gray-100 text-gray-800 py-2 px-2 rounded-xl focus:outline-none focus:shadow-outline w-full flex items-center justify-center">
                <img
                  src="/images/apple.png"
                  alt="Apple Logo"
                  className="w-5 h-5 mr-1"
                />
                <div className="text-xs">Continue with Apple</div>
              </button>
            </div>
            {error && <p className="text-red-500 text-xs my-2 font-[family-name:var(--font-poppins)]">{error.message}</p>}
            <p className="mt-4 text-center text-gray-600 text-xs font-[family-name:var(--font-inter)]">
              <span>Don't have an account? </span>
              <Link
                href="/sign-up"
                className="text-[#5187f6] hover:text-[#5372b0]"
              >
                <span>Sign Up</span>
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
