"use client";

import { useUserStore } from "@/stores/useUserStore";
import React, { useState } from "react";
import TwoFactorSetup from "./components/TwoFactorSetup";
import DisableTwoFactor from "./components/DisableTwoFactor";
import PushNotification from "./components/PushNotification";

type Props = {};

const page = (props: Props) => {
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const { user, setUser } = useUserStore();

  return (
    <div className="flex justify-center items-center flex-col ">
    <div className="flex justify-center items-center flex-col text-xs mt-10 mb-4">
      <h3 className="text-lg font-bold mb-2">Two-Factor Authentication</h3>
      <p className="mb-4">
        Two-factor authentication adds an extra layer of security to your
        account.
      </p>

      {user?.twoFactorAuth?.enabled ? (
        <button
          className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer"
          onClick={() => setShowDisable2FA(true)}
        >
          Disable Two-Factor Authentication
        </button>
      ) : (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
          onClick={() => setShowTwoFactorSetup(true)}
        >
          Enable Two-Factor Authentication
        </button>
      )}

      {showTwoFactorSetup && (
        <TwoFactorSetup
          onComplete={(updatedUser) => {
            setUser({ ...user, ...updatedUser });
            setShowTwoFactorSetup(false);
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}

      {showDisable2FA && (
        <DisableTwoFactor
          onComplete={(updatedUser) => {
            setUser({ ...user, ...updatedUser });
            setShowDisable2FA(false);
          }}
          onCancel={() => setShowDisable2FA(false)}
        />
      )}
    </div>
    <PushNotification />
    </div>
  );
};

export default page;
