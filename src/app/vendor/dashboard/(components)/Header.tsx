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
