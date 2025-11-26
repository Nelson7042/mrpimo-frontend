"use client";

import Image from "next/image";
import React, { useState, useRef } from "react";
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
    <header className="w-full flex justify-between px-2 md:px-3 lg:px-6 xl:px-10 py-4 bg-white z-10 shadow-sm">
      <h1 className="text-xl font-semibold text-[#211F1F]">Mprimo</h1>
      <div className="flex items-center gap-x-4">
        <button
          className="md:hidden text-gray-700"
          onClick={props.onOpenSidebar}
        >
          <FaBars size={20} />
        </button>

        <div
          className={`${
            showSearch ? "flex" : "hidden md:flex"
          } w-full gap-x-3 border border-gray-200 items-center px-4 py-2 font-[family-name:var(--font-poppins)]`}
        >
          <Search className="text-gray-300 font-light" size={16} />
          <input
            type="text"
            placeholder="Search"
            className="w-[90%] md:w-full lg:w-md outline-none text-[#323232]"
          />
        </div>
      </div>
      <div className="flex gap-x-4 md:gap-x-8 lg:gap-x-2 p-1 items-center">
        <button
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search
            className={`text-gray-700 ${!showSearch ? "block" : "hidden"}`}
            size={18}
          />
          <X
            className={`text-red-700 ${showSearch ? "block" : "hidden"}`}
            size={18}
            strokeWidth={4}
          />
        </button>
        {vendor?.kycStatus === "pending" && (
          <div className="text-xs font-[family-name:var(--font-alexandria)] bg-[#f1f1f1] text-[#5187f6] px-2 py-1 rounded-md">
            Unverified 
          </div>
        )}
        <NotificationBell />
        <div className="text-gray-600 hidden lg:block font-[family-name:var(--font-alexandria)]">
          {vendor?.businessInfo?.name}
        </div>
        <div className="h-8 w-8 overflow-hidden rounded-full">
          <Image
            src="/images/vendor-image.jpg"
            alt="vendor's image"
            className="object-cover h-full w-full"
            width={32}
            height={32}
            priority
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
