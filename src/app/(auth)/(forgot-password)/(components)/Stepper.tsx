"use client";

import { usePasswordReset } from "@/contexts/PasswordResetContext";
import { motion, AnimatePresence } from "framer-motion";


const steps = ["Send Token", "Token Verification", "Password Reset"];

export default function Stepper() {
  const { step } = usePasswordReset();

  return (
    <div className="flex items-center justify-between gap-x-2 relative">
      {steps.map((label, index) => {
        const isActive = index + 1 === step;
        const isCompleted = index + 1 < step;

        return (
            <div
              key={label}
              className="flex-1 flex flex-col items-center relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    isActive
                      ? "active" + index
                      : isCompleted
                      ? "done" + index
                      : "idle" + index
                  }
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`h-2 flex items-center justify-center rounded-full z-10
                  ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-400 text-black"
                  } ${isActive ? "w-10" : "w-8"}`}
                >
                </motion.div>
              </AnimatePresence>
            </div>
        );
      })}
    </div>
  );
}
