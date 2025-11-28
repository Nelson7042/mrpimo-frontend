"use client";
import { Icon } from "@iconify/react";
import { Store } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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
      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 font-normal"
      }`}
    >
      <Icon
        icon={isActive ? item.iconfilled : item.icon}
        className="w-5 h-5 mr-3"
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#29292938] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-3 border-b">
          <h1 className="text-xl font-semibold text-[#211F1F]">Mprimo</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-[80vh]">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <NavigationItem
                key={item.name}
                item={item}
                isActive={pathname === item.href}
                onClick={() => handleClick(item.href)}
              />
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="px-4 py-4 border-t space-y-1">
            <button
              onClick={() => router.push("/home")}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Store className="w-5 h-5 mr-3" />
              Buy Product
            </button>
            <button
              onClick={openLogoutModal}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon
                icon="solar:logout-2-linear"
                className="w-5 h-5 mr-3"
              />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
