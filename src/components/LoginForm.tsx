"use client";
import React, { useState } from "react";
import Input from "./Input";
import Link from "next/link";
import { useUserStore } from "@/stores/useUserStore";
import  { toast } from "react-toastify";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import { useRouter } from "next/navigation";
import {useLoginUser} from "@/hooks/mutations";
import { useProductStore } from "@/stores/useProductStore";
import { useVendorStore } from "@/stores/useVendorStore";

interface LoginFormProps {
  onLoginSuccess?: (data: any) => void;
}


const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess })=> {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    email: "",
  });

  const { setUser } = useUserStore();
  const { setVendor } = useVendorStore();
  const router = useRouter();
  const { mutate: loginUser, isPending } = useLoginUser();

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
    // Perform validation and submit the form if valid
    if (validateForm()) {
      // Submit the form
      loginUser(
        { email, password },
        {
          onSuccess: (data) => {
            if (onLoginSuccess) {
              if (data.has2faEnabled) {
                onLoginSuccess(data)
              }
            }
            setUser(data.user);
            setVendor(data.vendor);
            toast.success("Login successful", toastConfigSuccess);
            router.push("/");
          },
          onError: (error) => {
            console.error("Login failed:", error);
            toast.error(error.message, toastConfigError);
          },
        }
      );
    } else {
      toast.error("Form submission failed. Please ensure you provided the necessary fields", toastConfigError);
    }
  };

  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Input
        label="Email Address"
        id="email"
        placeholder="Type your Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Input
        label="Password"
        id="password"
        placeholder="Type your Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        error={errors.password}
      />
      <div className="text-xs text-gray-500 ">
        Forgot password?
        <span className="text-[#5187f6] font-bold ml-1">
            <Link href={"/send-token"}>Reset Password</Link>
        </span>
      </div>
      <button
        type="submit"
        className="bg-[#5187f6] hover:bg-blue-700 cursor-pointer text-white font-bold py-2 px-4 mt-2 rounded-xl focus:outline-none focus:shadow-outline w-full"
      >
        {isPending ? "Login..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;
