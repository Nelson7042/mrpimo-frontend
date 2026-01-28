"use client";

import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import FullButton from "@/components/FullButton";
import { useLoginUser } from "@/hooks/mutations";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useUserStore } from "@/stores/useUserStore";
import { useVendorStore } from "@/stores/useVendorStore";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

interface LoginProps {
  setAuthState?: (authState: "login" | "recover" | "otp") => void;
  close?: () => void;
  onLoginSuccess?: (data: any) => void; // ✅ Add callback for 2FA handling
}

const LoginForm = ({ setAuthState, close, onLoginSuccess }: LoginProps) => {
  const [open, setOpen] = React.useState(false);

  const toggle = () => {
    setOpen(!open);
  };

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    email: "",
  });

  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const { setVendor } = useVendorStore();
  const { mutate: loginUser, isPending } = useLoginUser();
  const { authType } = useAuthModalStore();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {
      password: "",
      email: "",
    };

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid.";
    }

    if (password && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (validateForm()) {
      loginUser(
        { email, password },
        {
          onSuccess: (data) => {
            // ✅ Check if 2FA is required
            if (data.requires2FA || data.has2faEnabled) {
              setIsLoading(false);
              if (onLoginSuccess) {
                onLoginSuccess(data); // Pass to parent for 2FA handling
              }
              return;
            }

            // ✅ No 2FA - complete login
            if (data.user) {
              setUser(data.user);
              if (data.vendor) setVendor(data.vendor);
              toast.success("Login successful", toastConfigSuccess);
              
              // Check for stored redirect URL
              const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
              if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectUrl);
              } else if (authType === "vendor") {
                router.push("/vendor/dashboard");
              } else {
                router.push("/");
              }
              
              if (close) close();
            }
            setIsLoading(false);
          },
          onError: (error) => {
            toast.error(error.message, toastConfigError);
            setIsLoading(false);
          },
        }
      );
    } else {
      toast.error(
        "Form submission failed. Please ensure you provided the necessary fields",
        toastConfigError
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[10px] min-w-[330px] ">
      <div className="mb-[10px]">
        <div className="flex items-center justify-between">
          <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
            Email Address
          </label>
        </div>
        <div className=" relative    flex items-center">
          <input
            type={"email"}
            placeholder="Enter your email"
            className="w-full h-[48px] px-[16px] py-[12px]  text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px]  border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary "
            required
            autoComplete="on"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </div>

      <div className="mb-[10px]">
        <div className="flex items-center justify-between">
          <label className="text-[14px] md:text-[14px] xl:text-[16px] font-normal leading-[24px] text-[#000000] mb-[8px]">
            Password
          </label>
          <button
            type="button"
            onClick={() => setAuthState && setAuthState("recover")}
            className="text-sm text-blue-600"
          >
            Forgot Password?
          </button>
        </div>
        <div className=" relative    flex items-center">
          <div className="absolute right-[16px]">
            {open === false ? (
              <Eye size="16" color="#98A2B3" onClick={toggle} />
            ) : (
              <FaEyeSlash size="16" color="#98A2B3" onClick={toggle} />
            )}
          </div>
          <input
            type={open === false ? "password" : "text"}
            placeholder="Enter your password"
            className="w-full h-[48px] px-[16px] py-[12px] text-[14px] text-[#344054] leading-[20px] bg-[#F7F9FC] placeholder:text-[#98A2B3] placeholder:text-[12px]  border-[#D0D5DD] border-[0.2px] rounded-[8px] focus:outline-none focus:ring-primary focus:border-primary "
            required
            autoComplete="on"
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
      </div>

      <div className="mb-4 md:mb-6 mt-4 md:mt-6">
        <FullButton action={() => {}} isLoading={isLoading || isPending} color="blue" name="Sign In" />
      </div>
    </form>
  );
};

export default LoginForm;
