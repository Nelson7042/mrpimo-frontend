"use client";

import { useUserStore } from "@/stores/useUserStore";
import { useVendorStore } from "@/stores/useVendorStore";
import React, { useState, useCallback } from "react";
import TwoFactorSetup from "./components/TwoFactorSetup";
import DisableTwoFactor from "./components/DisableTwoFactor";
import PushNotification from "./components/PushNotification";
import VendorPickupLocation from "./components/VendorPickupLocation";
import UpgradeToBusinessAccount from "./components/UpgradeToBusinessAccount";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import KybModal from "@/components/KybModal";
import { useKybStore } from "@/stores/useKybStore";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const page = () => {
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showKybModal, setShowKybModal] = useState(false);
  const { user, setUser } = useUserStore();
  const { vendor } = useVendorStore();
  const { setCurrentStep } = useKybStore();

  const kycStatus = vendor?.kycStatus;
  const kybStatus = vendor?.kybStatus;
  const isBusinessAccount = vendor?.accountType === "business";

  const handleOpenKycModal = () => {
    setCurrentStep(1);
    setShowKybModal(true);
  };

  const handleOpenKybModal = () => {
    setCurrentStep(2);
    setShowKybModal(true);
  };

  const handleBusinessUpgradeSuccess = useCallback(() => {
    // Show success message confirming the upgrade (Requirement 13.4)
    toast.success(
      "Your account has been upgraded to a business account! Starting KYB verification...",
      toastConfigSuccess
    );

    // Auto-open KYB modal within 2 seconds (Requirements 13.1, 13.2)
    setTimeout(() => {
      try {
        setCurrentStep(2);
        setShowKybModal(true);
      } catch {
        // If modal fails to open, show toast with manual link (Requirement 13.3)
        toast.info(
          <span>
            Could not open KYB verification automatically.{" "}
            <button
              onClick={() => {
                setCurrentStep(2);
                setShowKybModal(true);
              }}
              className="underline text-blue-600 hover:text-blue-800"
            >
              Click here to start KYB verification
            </button>
          </span>,
          { ...toastConfigError, autoClose: false }
        );
      }
    }, 2000);
  }, [setCurrentStep]);

  const getVerificationBadge = (status: string | undefined | null) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Verified
        </span>
      );
    }
    if (status === "pending" || status === "requires_review") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending Review
        </span>
      );
    }
    return null;
  };

  // Notification preference descriptions
  const notifPrefItems = [
    { key: "newOrder", label: "New Order Received", description: "Get notified when a buyer places a new order for your products" },
    { key: "orderStatusChange", label: "Order Status Changes", description: "Get notified when an order status changes (processing, shipped, delivered, cancelled)" },
    { key: "payoutProcessed", label: "Payout Processed", description: "Get notified when a payout to your bank account has been processed" },
    { key: "lowStockAlert", label: "Low Stock Alerts", description: "Get notified when your product inventory drops below the low stock threshold" },
    { key: "disputeNotification", label: "Dispute Notifications", description: "Get notified when a buyer opens or updates a dispute on one of your orders" },
  ];

  // Initialize notification preferences from vendor profile
  const [notifPrefs, setNotifPrefs] = useState({
    newOrder: vendor?.notificationPreferences?.newOrder ?? true,
    orderStatusChange: vendor?.notificationPreferences?.orderStatusChange ?? true,
    payoutProcessed: vendor?.notificationPreferences?.payoutProcessed ?? true,
    lowStockAlert: vendor?.notificationPreferences?.lowStockAlert ?? true,
    disputeNotification: vendor?.notificationPreferences?.disputeNotification ?? true,
  });

  // Order settings
  const [orderSettings, setOrderSettings] = useState({
    autoAcceptOrders: vendor?.settings?.autoAcceptOrders ?? false,
    minOrderAmount: vendor?.settings?.minOrderAmount ?? 0,
  });
  const [savingOrderSettings, setSavingOrderSettings] = useState(false);

  // Confirmation dialog state
  const [showAutoAcceptDialog, setShowAutoAcceptDialog] = useState(false);
  const [showMinOrderDialog, setShowMinOrderDialog] = useState(false);
  const [pendingMinOrderAmount, setPendingMinOrderAmount] = useState<number | null>(null);

  const handleNotifPrefChange = async (key: string, value: boolean) => {
    const previousPrefs = { ...notifPrefs };
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/vendors/notification-preferences`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      if (response && response.ok !== undefined && !response.ok) {
        throw new Error("API returned error");
      }
    } catch {
      toast.error("Failed to update notification preference", toastConfigError);
      setNotifPrefs(previousPrefs);
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

  // Confirmation dialog handlers for auto-accept orders
  const handleAutoAcceptToggle = (checked: boolean) => {
    if (!checked && orderSettings.autoAcceptOrders) {
      // Disabling auto-accept: show confirmation dialog
      setShowAutoAcceptDialog(true);
    } else {
      // Enabling auto-accept: apply immediately (not destructive)
      setOrderSettings(prev => ({ ...prev, autoAcceptOrders: checked }));
    }
  };

  const handleConfirmDisableAutoAccept = () => {
    setOrderSettings(prev => ({ ...prev, autoAcceptOrders: false }));
    setShowAutoAcceptDialog(false);
  };

  const handleCancelDisableAutoAccept = () => {
    // Revert: keep autoAcceptOrders as true (no change, no API call)
    setShowAutoAcceptDialog(false);
  };

  // Confirmation dialog handlers for minimum order amount
  const handleMinOrderAmountChange = (value: number) => {
    setPendingMinOrderAmount(value);
    setShowMinOrderDialog(true);
  };

  const handleConfirmMinOrderAmount = () => {
    if (pendingMinOrderAmount !== null) {
      setOrderSettings(prev => ({ ...prev, minOrderAmount: pendingMinOrderAmount }));
    }
    setPendingMinOrderAmount(null);
    setShowMinOrderDialog(false);
  };

  const handleCancelMinOrderAmount = () => {
    // Revert: discard pending value (no change, no API call)
    setPendingMinOrderAmount(null);
    setShowMinOrderDialog(false);
  };

  return (
    <div className="flex justify-center items-center flex-col p-4 md:p-6">
      {/* Upgrade to Business Account Section */}
      <UpgradeToBusinessAccount onSuccess={handleBusinessUpgradeSuccess} />

      {/* Verification Status Section */}
      <div className="w-full max-w-2xl mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Verification Status</h3>
        <div className="space-y-4">
          {/* KYC Row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Identity Verification (KYC)</p>
              <p className="text-xs text-gray-500">Verify your identity to unlock full vendor features</p>
            </div>
            <div className="flex items-center gap-2">
              {getVerificationBadge(kycStatus)}
              {(kycStatus === "rejected" || !kycStatus) && (
                <button
                  onClick={handleOpenKycModal}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Submit Identity Verification (KYC)
                </button>
              )}
              {(kycStatus === "pending" || kycStatus === "requires_review") && (
                <button
                  disabled
                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm opacity-50 cursor-not-allowed"
                >
                  Submit Identity Verification (KYC)
                </button>
              )}
            </div>
          </div>

          {/* KYB Row - only for business accounts */}
          {isBusinessAccount && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Business Verification (KYB)</p>
                <p className="text-xs text-gray-500">Verify your business registration</p>
              </div>
              <div className="flex items-center gap-2">
                {getVerificationBadge(kybStatus)}
                {(kybStatus === "rejected" || !kybStatus) && (
                  <button
                    onClick={handleOpenKybModal}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Submit Business Verification (KYB)
                  </button>
                )}
                {(kybStatus === "pending" || kybStatus === "requires_review") && (
                  <button
                    disabled
                    className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm opacity-50 cursor-not-allowed"
                  >
                    Submit Business Verification (KYB)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
                onChange={(e) => handleAutoAcceptToggle(e.target.checked)}
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
              onChange={(e) => handleMinOrderAmountChange(parseFloat(e.target.value) || 0)}
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

      {/* Notification Preferences Section */}
      <div className="w-full max-w-2xl mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Notification Preferences</h3>
        <p className="text-xs text-gray-500 mb-4">Control which notifications you receive about your store activity</p>
        <div className="space-y-4">
          {notifPrefItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
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

      {/* KYB Modal */}
      <KybModal isOpen={showKybModal} onClose={() => setShowKybModal(false)} />

      {/* Confirmation Dialog: Disable Auto-Accept Orders */}
      <ConfirmationDialog
        isOpen={showAutoAcceptDialog}
        title="Disable Auto-Accept Orders"
        description="You are about to disable automatic order acceptance. This means you will need to manually review and accept each incoming order."
        consequences="Orders will not be processed until you manually accept them. This may lead to delays and potential order cancellations if not reviewed promptly."
        onConfirm={handleConfirmDisableAutoAccept}
        onCancel={handleCancelDisableAutoAccept}
      />

      {/* Confirmation Dialog: Change Minimum Order Amount */}
      <ConfirmationDialog
        isOpen={showMinOrderDialog}
        title="Change Minimum Order Amount"
        description={`You are about to change the minimum order amount to ${pendingMinOrderAmount !== null ? `$${pendingMinOrderAmount.toFixed(2)}` : ''}.`}
        consequences="This change may affect existing product listings. Orders below this amount will be rejected, which could impact your sales."
        onConfirm={handleConfirmMinOrderAmount}
        onCancel={handleCancelMinOrderAmount}
      />
    </div>
  );
};

export default page;
