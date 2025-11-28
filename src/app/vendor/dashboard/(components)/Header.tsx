"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { FaBars } from "react-icons/fa";
import NotificationBell from "@/components/NotificationBell";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {
  onOpenSidebar?: () => void;
};

const Header = (props: Props) => {
  const [showSearch, setShowSearch] = useState(false);
  const { vendor } = useVendorStore();


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <button
          className="lg:hidden mr-3 p-2 rounded-md hover:bg-gray-100"
          onClick={props.onOpenSidebar}
        >
          <FaBars size={18} />
        </button>

        {/* Logo - visible on desktop */}
        {/* <div className="hidden lg:block mr-6">
          <h1 className="text-xl font-semibold text-[#211F1F]">Mprimo</h1>
        </div> */}

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4">
          <div
            className={`${
              showSearch ? "flex" : "hidden md:flex"
            } items-center border border-gray-200 rounded-lg px-3 py-2`}
          >
            <Search className="text-gray-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 outline-none text-sm"
            />
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
            <div className="hidden sm:block text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
              Unverified
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* Business name - desktop only */}
          <div className="hidden lg:block text-sm text-gray-600 max-w-32 truncate">
            {vendor?.businessInfo?.name}
          </div>

          {/* Profile avatar */}
          <div className="h-8 w-8 rounded-full overflow-hidden border">
            <Image
              src="/images/vendor-image.jpg"
              alt="Profile"
              className="h-full w-full object-cover"
              width={32}
              height={32}
              priority
            />
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="md:hidden border-t bg-white p-4">
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2">
            <Search className="text-gray-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 outline-none text-sm"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
