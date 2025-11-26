"use client";

import Input from "@/components/Input";
import React from "react";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { usePasswordReset } from "@/contexts/PasswordResetContext";
import Successful from "@/components/Successful";

type Props = {};

const ResetPassword = (props: Props) => {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isVerified, setIsVerified] = React.useState(false);
  const [errors, setErrors] = React.useState({
    password: "",
    confirmPassword: "",
  });

  const { userEmail } = usePasswordReset();

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) => {
      return fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ password, email: userEmail }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  });

  const validate = () => {
    let isValid = true;
    const errors = {
      password: "",
      confirmPassword: "",
    };

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm Password is required";
      isValid = false;
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      // Perform the action to reset the password
      resetPasswordMutation.mutate(password, {
        onSuccess: () => {
          setIsVerified(true);
          toast.success("Password successfully changed!");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
  };
  return (
    <div className="relative bg-white shadow-md rounded-xl px-6 md:px-20 lg:px-40 pt-6 pb-8 w-full max-w-3xl font-[family-name:var(--font-alexandria)] ">
      <h2 className="text-2xl font-semibold text-center mb-1">
        Reset Password
      </h2>
      <p className="text-gray-600 text-center text-sm mb-2">
        Kindly reset your password below. Please make sure to use a strong
        password that you haven't used before.
      </p>
      <form className="flex flex-col mt-8" onSubmit={handleSubmit}>
        <Input
          type="password"
          placeholder="Enter your new password"
          label="New Password"
          id="password"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          value={password}
          error={errors.password}
        />
        <Input
          type="password"
          placeholder="Confirm your new password"
          label="Confirm Password"
          id="confirmPassword"
          onChange={(e) => {
            setConfirmPassword(e.target.value);
          }}
          value={confirmPassword}
          error={errors.confirmPassword}
        />
        <button
          type="submit"
          className="bg-[#5187f6] text-white py-2 px-4 mt-4 rounded-lg hover:bg-[#5187f6]/90 transition duration-200 disabled:cursor-not-allowed disabled:opacity-90"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending ? "Loading..." : "Reset Password"}
        </button>
        {isVerified && (
          <div className="absolute top-0 left-0 transform flex items-center justify-center bg-black/50 w-full h-full rounded-lg z-50">
            <div className="text-center p-6 pb-2 shadow-lg bg-white w-3/4 md:w-1/2 h-[70%] flex flex-col items-center justify-end opacity-100">
              <Successful />
              <h1 className="text-lg font-semibold mb-1 text-[#5187f6]">
                Successful
              </h1>
              <p className="mb-1 text-xs text-gray-600">
                Your password has been created successfully. You can now proceed
                to login.
              </p>
              <button className="text-white bg-[#5187f6] px-4 py-2 rounded-xl font-semibold hover:bg-[#5187f6]/90 transition duration-200">
                <Link href="/login">Go to Login</Link>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
