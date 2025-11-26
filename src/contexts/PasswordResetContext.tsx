"use client";
import { createContext, useContext, useState } from "react";

type PasswordResetContextType = {
  step: number;
  setStep: (step: number) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
};

const PasswordResetContext = createContext<PasswordResetContextType | undefined>(undefined);

export const PasswordResetProvider = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = useState(1); // Start at step 1
  const [userEmail, setUserEmail] = useState("")

  return (
    <PasswordResetContext.Provider value={{ step, setStep, userEmail, setUserEmail }}>
      {children}
    </PasswordResetContext.Provider>
  );
};

export const usePasswordReset = () => {
  const context = useContext(PasswordResetContext);
  if (!context) {
    throw new Error("usePasswordReset must be used within PasswordResetProvider");
  }
  return context;
};
