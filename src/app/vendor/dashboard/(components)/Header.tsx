"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, LogOut, LayoutDashboard, Wallet, Store } from "lucide-react";
import { FaBars } from "react-icons/fa";
import NotificationBell from "@/components/NotificationBell";
import { useVendorStore } from "@/stores/useVendorStore";
import { useRouter } from "next/navigation";
import { useLogoutUser } from "@/hooks/mutations";
import { resetAllStores } from "@/stores/resetStore";
import { useWalletBalance } from "@/hooks/useWallet";
import { useWalletDisplay } from "@/hooks/useWalletBalance";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "react-toastify";

type Props = {
  onOpenSidebar?: () => void;
};

// Helper function to get initials from business name
const getInitials = (name: string | undefined): string => {
  if (!name) return "V";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Helper function to generate a consistent color based on name
const getAvatarColor = (name: string | undefined): string => {
  if (!name) return "bg-blue-600";
  const colors = [
    "bg-blue-600",
    "bg-green-600",
    "bg-purple-600",
    "bg-orange-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-indigo-600",
    "bg-red-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Header = (props: Props) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const { vendor } = useVendorStore();
  const { user } = useUserStore();
  const router = useRouter();
  const logoutMutation = useLogoutUser();
  const { data: walletData } = useWalletBalance();
  const { usdDisplay: balanceUSD, approxDisplay: balanceApprox } = useWalletDisplay(
    walletData?.wallet?.balances?.available,
    user?.preferences?.currency
  );

  const businessName = vendor?.businessInfo?.name;
  const initials = getInitials(businessName);
  const avatarColor = getAvatarColor(businessName);

  // Close profile modal on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileModalRef.current && !profileModalRef.current.contains(e.target as Node)) {
        setShowProfileModal(false);
      }
    };
    if (showProfileModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileModal]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        resetAllStores();
        toast.success("Logout Successful");
        window.location.href = "/home";
      },
      onError: () => {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        resetAllStores();
        window.location.href = "/home";
      },
    });
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary font-roboto">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Mobile menu button */}
        <button
          className="lg:hidden mr-3 p-2 rounded-md hover:bg-gray-100"
          onClick={props.onOpenSidebar}
        >
          <FaBars size={18} />
        </button>

       

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4">
          <div
            className={`${
              showSearch ? "flex" : "hidden md:flex"
            } mx-auto bg-white py-[2px] md:py-[3px] rounded-[8px]`}
          >
            <button className="border-r px-2 md:px-3">
              <Search className="w-5 h-5" color="black" />
            </button>
            <input
              type="text"
              placeholder="Search..."
              className="font-roboto flex-1 border-0 px-2 md:px-3 outline-0 text-[#121212] text-sm"
            />
            <button className="py-[8px] px-3 text-xs bg-primary text-white rounded-[8px] mr-1 hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setShowSearch(!showSearch)}
          >
            {!showSearch ? (
              <Search className="text-gray-700" size={18} />
            ) : (
              <X className="text-gray-700" size={18} />
            )}
          </button>

          {/* KYC Status */}
          {vendor?.kycStatus === "pending" && (
            <div className="font-roboto hidden sm:block text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
              Unverified
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* Business name - desktop only */}
          <div className="font-roboto hidden lg:block text-xs text-gray-200 max-w-32 truncate">
            {vendor?.businessInfo?.name}
          </div>

          {/* Profile avatar with dropdown */}
          <div className="relative" ref={profileModalRef}>
            <button
              onClick={() => setShowProfileModal((prev) => !prev)}
              className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor} hover:opacity-90 transition-opacity border-2 border-white/20`}
            >
              {initials}
            </button>

            {showProfileModal && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Business Info */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {businessName || "My Business"}
                  </p>
                  <p className="text-xs text-gray-500">Vendor Account</p>
                </div>

                {/* Wallet Balance */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Wallet Balance</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${balanceUSD}
                  </p>
                  {balanceApprox && <p className="text-xs text-gray-500">{balanceApprox}</p>}
                </div>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    router.push("/vendor/dashboard");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    router.push("/vendor/dashboard/wallets");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  My Wallet
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    router.push("/vendor/dashboard/settings");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Store className="w-4 h-4" />
                  Store Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    router.push("/home");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100"
                >
                  <Store className="w-4 h-4" />
                  Go to Store
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="md:hidden border-t bg-white p-4">
          <div className="flex bg-white py-[2px] rounded-[8px] border border-gray-200">
            <button className="border-r px-2 md:px-3">
              <Search className="w-5 h-5" color="black" />
            </button>
            <input
              type="text"
              placeholder="Search..."
              className="font-roboto flex-1 border-0 px-2 outline-0 text-[#121212] text-sm"
              autoFocus
            />
            <button className="py-[8px] px-3 text-xs bg-primary text-white rounded-[8px] mr-1 hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
