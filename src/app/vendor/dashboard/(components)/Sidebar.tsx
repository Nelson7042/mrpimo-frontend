"use client";
import { Icon } from "@iconify/react";
import { Store } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

const navItems = [
  {
    name: "Dashboard",
    href: "/vendor/dashboard",
    icon: "si:home-line",
    iconfilled: "si:home-fill",
  },
  {
    name: "Products",
    href: "/vendor/dashboard/products",
    icon: "solar:box-linear",
    iconfilled: "solar:box-bold",
  },
  {
    name: "Orders",
    href: "/vendor/dashboard/orders",
    icon: "ant-design:shopping-outlined",
    iconfilled: "ant-design:shopping-filled",
  },
  {
    name: "Messages",
    href: "/vendor/dashboard/messages",
    icon: "iconamoon:comment-dots-light",
    iconfilled: "iconamoon:comment-dots-fill",
  },
  {
    name: "Advert",
    href: "/vendor/dashboard/advert",
    icon: "ph:megaphone-light",
    iconfilled: "ph:megaphone-fill",
  },
  {
    name: "Reviews",
    href: "/vendor/dashboard/reviews",
    icon: "mingcute:star-line",
    iconfilled: "mingcute:star-fill",
  },
  {
    name: "Wallets",
    href: "/vendor/dashboard/wallets",
    icon: "solar:wallet-linear",
    iconfilled: "solar:wallet-bold",
  },
  {
    name: "Settings",
    href: "/vendor/dashboard/settings",
    icon: "mingcute:settings-5-line",
    iconfilled: "mingcute:settings-5-fill",
  },
];

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  openLogoutModal: () => void;
};

const NavigationItem = ({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative py-[8px] w-full pl-[12px] flex items-center text-[14px] leading-[20px] md:leading-[24px] ${
        isActive
          ? "text-[#211F1F] font-medium rounded-[10px] bg-[#D3E1FE] border-b border-[#F6B76F]"
          : "text-[#667185] font-normal hover:bg-gray-100 rounded-[10px]"
      }`}
    >
      <Icon
        icon={isActive ? item.iconfilled : item.icon}
        width="20"
        height="20"
        className="mr-[12px]"
      />
      {item.name}
    </button>
  );
};

export default function Sidebar({
  isOpen = true,
  onClose,
  openLogoutModal,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (link: string) => {
    router.push(link);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`lg:block lg:relative ${
        isOpen
          ? "block z-[999999999] fixed inset-0 transition-opacity"
          : "hidden"
      }`}
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#29292980] transition-opacity lg:relative"
      ></div>

      {/* Close button */}
      <div className="absolute top-0 right-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4 lg:hidden">
        <button
          onClick={onClose}
          type="button"
          className="rounded-md text-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span className="sr-only">Close panel</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar content */}
      <div className="max-w-[260px] h-full bg-[#F1F4F9] w-[220px] md:w-[230px] p-[16px] md:p-[18px]">
        <div className="relative">
          <div className="relative h-[90vh] overflow-y-auto flex flex-col justify-between">
            <div>
                           {/* Main Navigation */}
              <div className="overflow-y-auto no-scrollbar flex-1">
                {navItems.map((item) => (
                  <NavigationItem
                    key={item.name}
                    item={item}
                    isActive={pathname === item.href}
                    onClick={() => handleClick(item.href)}
                  />
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t pt-3 mb-8">
              <button
                onClick={() => router.push("/home")}
                className="relative py-[8px] w-full pl-[12px] flex items-center text-[14px] text-[#667185] font-normal hover:bg-gray-100 rounded-[10px]"
              >
                <Store
                  width="20"
                  height="20"
                  className="mr-[12px]"
                />
                Buy Product
              </button>
              <button
                onClick={openLogoutModal}
                className="relative py-[8px] w-full pl-[12px] flex items-center text-[14px] text-[#667185] font-normal hover:bg-gray-100 rounded-[10px]"
              >
                <Icon
                  icon="solar:logout-2-linear"
                  width="20"
                  height="20"
                  className="mr-[12px]"
                />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
