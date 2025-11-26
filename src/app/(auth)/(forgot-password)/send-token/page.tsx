"use client";

import Input from "@/components/Input";
import React from "react";
import { usePasswordReset } from "@/contexts/PasswordResetContext";
import { FaInfoCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigInfo } from "@/app/config/toast.config";
import Loader from "@/components/Loader";

type Props = {};

const SendToken = (props: Props) => {
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState({
    email: "",
  });
  const [redirecting, setRedirecting] = React.useState(false);

  const { step, setStep, setUserEmail } = usePasswordReset();
  const router = useRouter();

  const sendPasswordResetRequest = async (
    email: string
  ): Promise<{ message: string }> => {
    const response = await fetch(
      "http://localhost:5800/api/v1/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.message, toastConfigError);
      throw new Error(errorData.message);
    }

    return response.json();
  };

  const mutation = useMutation({
    mutationFn: sendPasswordResetRequest,
  });

  const validate = () => {
    let isValid = true;
    const errors = {
      email: "",
    };

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      // Perform the action to send the token
      console.log("Token sent to:", email);
      mutation.mutate(email, {
        onSuccess: () => {
          setStep(step + 1); // Move to the next step
          setUserEmail(email);
          toast.success("Token sent to your email", toastConfigInfo);
          setRedirecting(true);
          router.push("/verify-token");
        },
        onError: (error) => {
          toast.error(error.message || "An error occurred", toastConfigError);
        },
      });
    }
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
      <h2 className="text-2xl font-semibold text-center mb-6">
        Forgot Password
      </h2>
      <p className="text-gray-600 text-center text-sm mb-2">
        Don't panic kindly enter your email address and we will send you a token
        to reset your password
        <br />{" "}
      </p>
      <div className="text-gray-400 text-xs flex items-center justify-center gap-x-2 mb-10">
        <FaInfoCircle size={24} className="text-blue-500" />
        Check your spam folder if you don't see it
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="Enter your email address"
          label="Email Address"
          id="email"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          value={email}
          error={errors.email}
        />
        <button
          type="submit"
          className="bg-[#5187f6] text-white py-2 px-4 rounded-lg hover:bg-[#5187f6]/90 transition duration-200 disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Requesting Token..." : "Send Token"}
        </button>
      </form>
    </div>
  );
};

export default SendToken;
