"use client";

import { useUserStore } from "@/stores/useUserStore";
import { useVendorStore } from "@/stores/useVendorStore";
import React, { useState } from "react";
import TwoFactorSetup from "./components/TwoFactorSetup";
import DisableTwoFactor from "./components/DisableTwoFactor";
import PushNotification from "./components/PushNotification";
import VendorPickupLocation from "./components/VendorPickupLocation";
import UpgradeToBusinessAccount from "./components/UpgradeToBusinessAccount";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const page = () => {
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const { user, setUser } = useUserStore();
  const { vendor } = useVendorStore();

  // Email notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    newOrder: true,
    orderStatusChange: true,
    payoutProcessed: true,
    lowStockAlert: true,
    disputeNotification: true,
  });

  // Order settings
  const [orderSettings, setOrderSettings] = useState({
    autoAcceptOrders: vendor?.settings?.autoAcceptOrders ?? false,
    minOrderAmount: vendor?.settings?.minOrderAmount ?? 0,
  });
  const [savingOrderSettings, setSavingOrderSettings] = useState(false);

  const handleNotifPrefChange = async (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      await fetchWithAuth(`${API_BASE_URL}/vendors/notification-preferences`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      toast.error("Failed to update notification preference", toastConfigError);
    }
  };

  const handleSaveOrderSettings = async () => {
    if (orderSettings.minOrderAmount < 0) {
      toast.error("Minimum order amount cannot be negative", toastConfigError);
      return;
    }
    setSavingOrderSettings(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/vendors/settings`, {
        method: "PATCH",
        body: JSON.stringify(orderSettings),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Order settings updated", toastConfigSuccess);
      } else {
        toast.error(data.message || "Failed to update settings", toastConfigError);
      }
    } catch {
      toast.error("Failed to update settings", toastConfigError);
    } finally {
      setSavingOrderSettings(false);
    }
  };

  return (
    <div className="flex justify-center items-center flex-col p-4 md:p-6">
      {/* Upgrade to Business Account Section */}
      <UpgradeToBusinessAccount />

      {/* Pickup Location Section */}
      <div className="w-full max-w-2xl mb-8">
        <VendorPickupLocation />
      </div>

      {/* Order Settings Section */}
      <div className="w-full max-w-2xl mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Order Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-Accept Orders</p>
              <p className="text-xs text-gray-500">Automatically accept incoming orders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={orderSettings.autoAcceptOrders}
                onChange={(e) => setOrderSettings(prev => ({ ...prev, autoAcceptOrders: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Minimum Order Amount</label>
            <input
              type="number"
              min="0"
              value={orderSettings.minOrderAmount}
              onChange={(e) => setOrderSettings(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
              className="w-full mt-1 p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <button
            onClick={handleSaveOrderSettings}
            disabled={savingOrderSettings}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {savingOrderSettings ? "Saving..." : "Save Order Settings"}
          </button>
        </div>
      </div>

      {/* Email Notification Preferences Section */}
      <div className="w-full max-w-2xl mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Email Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { key: "newOrder", label: "New Order Received" },
            { key: "orderStatusChange", label: "Order Status Changes" },
            { key: "payoutProcessed", label: "Payout Processed" },
            { key: "lowStockAlert", label: "Low Stock Alerts" },
            { key: "disputeNotification", label: "Dispute Notifications" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm">{item.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                  onChange={(e) => handleNotifPrefChange(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plan Display */}
      {vendor?.subscription && (
        <div className="w-full max-w-2xl mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Subscription Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{(vendor.subscription as any)?.plan?.name || "Current Plan"}</p>
              <p className="text-xs text-gray-500 capitalize">{(vendor.subscription as any)?.status || "Active"}</p>
            </div>
            <a href="/vendor/dashboard/subscription" className="text-sm text-blue-600 hover:text-blue-700">
              Manage Subscription
            </a>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <div className="flex justify-center items-center flex-col text-xs mt-10 mb-4">
        <h3 className="text-lg font-bold mb-2">Two-Factor Authentication</h3>
        <p className="mb-4">
          Two-factor authentication adds an extra layer of security to your account.
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
      
      {/* Push Notification Section */}
      <PushNotification />
    </div>
  );
};

export default page;
