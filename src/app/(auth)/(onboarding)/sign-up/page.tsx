"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import BusinessRegistration from "@/components/BusinessRegistration";
import PersonalRegistrationForm from "@/components/PersonalRegistrationForm";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";

type Props = {};

const SignUpPage = (props: Props) => {
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
  );
  const [isCallingGoogle, setIsCallingGoogle] = useState(false)

  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (user) {
    return null; 
  }


  const handleAccountTypeChange = (type: "personal" | "business") => {
    setAccountType(type);
  };

  const handleGoogleLogin = async () => {
    setIsCallingGoogle(true)
    window.location.href = "http://localhost:5800/api/v1/auth/google";
    setTimeout(() => {
      setIsCallingGoogle(false)
    }, 2000)
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-x-8 justify-center items-center min-h-screen p-4 bg-gray-200">
      <Link href="/">
        <div className="bg-white md:mt-8 mb-4 md:mb-0 rounded-full w-[60px] h-[60px] p-3 flex items-center justify-center shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          <FaArrowLeft className="text-gray-600" size={32} />
        </div>
      </Link>
      <div className="bg-white shadow-md rounded-xl px-6 md:px-20 lg:px-40 pt-6 pb-8 w-full max-w-3xl font-[family-name:var(--font-alexandria)] mt-4 md:mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Create an account
        </h2>
        <div className="flex bg-gray-200 p-2 rounded-lg mt-2 mb-4 w-full md:w-3/4 mx-auto">
          <div className="w-full flex">
            <button
              className={`flex items-center justify-center py-3 w-1/2 rounded-l-lg shadow-md cursor-pointer ${
                accountType === "personal"
                  ? "bg-white text-[#5187f6]"
                  : "bg-gray-200 text-gray-400"
              }`}
              onClick={() => handleAccountTypeChange("personal")}
            >
              <span className="font-semibold">Personal</span>
            </button>
            <button
              className={`flex items-center justify-center w-1/2 bg-gray-200 rounded-r-lg shadow-md cursor-pointer ${
                accountType === "business"
                  ? "bg-white text-[#5187f6]"
                  : "bg-gray-200 text-gray-400"
              }`}
              onClick={() => handleAccountTypeChange("business")}
            >
              <span className="font-semibold">Business</span>
            </button>
          </div>
        </div>
        {accountType === "personal" && (
          <div className="md:px-10">
            <PersonalRegistrationForm />
            <div className="relative my-4 border-b-2 border-gray-300 w-3/4 mx-auto mb-4">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-gray-500">
                or
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 font-[family-name:var(--font-poppins)]">
              <button
                className="bg-white border-2 cursor-pointer border-gray-300 hover:bg-gray-100 text-gray-800 py-2 px-2 rounded-xl focus:outline-none focus:shadow-outline w-full flex items-center justify-center disabled:opacity-90 disabled:cursor-not-allowed"
                disabled={isCallingGoogle}
                onClick={handleGoogleLogin}
              >
                <img
                  src="/images/google.png"
                  alt="Google Logo"
                  className="w-5 h-5 mr-1"
                />
                <div className="text-xs">Sign In with Google</div>
              </button>
              <button className="bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-800 py-2 px-2 rounded-xl focus:outline-none focus:shadow-outline w-full flex items-center justify-center cursor-pointer">
                <img
                  src="/images/apple.png"
                  alt="Apple Logo"
                  className="w-5 h-5 mr-1"
                />
                <div className="text-xs">Sign Up with Apple</div>
              </button>
            </div>
            <p className="mt-4 text-center text-gray-600 text-xs font-[family-name:var(--font-inter)]">
              By Registering, you agree to Mprimo’s{" "}
              <Link
                href="/user/sign-in"
                className="text-[#5187f6] hover:text-[#5372b0]"
              >
                User Agreement
              </Link>
            </p>
            <p className="mt-4 text-center text-gray-600 text-xs font-[family-name:var(--font-inter)]">
              <span>Already have an account? </span>
              <Link
                href="/login"
                className="text-[#5187f6] hover:text-[#5372b0]"
              >
                <span>Sign In</span>
              </Link>
            </p>
          </div>
        )}
        {accountType === "business" && <BusinessRegistration />}

        <p className="mt-4 text-center text-black text-xs">
          Forgot your password?{" "}
          <a
            href="/user/forgot-password"
            className="text-blue-500 hover:text-blue-800"
          >
            Reset Password
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
