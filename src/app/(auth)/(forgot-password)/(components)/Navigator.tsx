"use client";
import { usePasswordReset } from "@/contexts/PasswordResetContext";

import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";

type Props = {};

const Navigator = (props: Props) => {
  const disabled = usePathname() === "/send-token" ? true : false;
  const { step, setStep } = usePasswordReset();
  const router = useRouter();
  const handleBack = () => {
    let copy: number;

    if (step > 1) {
      setStep(step - 1);
      copy = step - 1;

      switch (copy) {
        case 1:
          router.push("/send-token");
          break;
        case 2:
          router.push("/verify-token");
          break;
        default:
          break;
      }
    }
  };
  return (
    <div>
      <button
        className="cursor-pointer"
        onClick={handleBack}
        disabled={disabled}
      >
        <div className={`bg-white rounded-full size-10 p-3 flex items-center justify-center shadow-md hover:shadow-lg transition duration-300 ease-in-out ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          <FaArrowLeft className="text-gray-600" size={32} />
        </div>
      </button>
    </div>
  );
};

export default Navigator;
