"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Wallet,
  Heart,
  Star,
  Settings,
  LogOut,
  MessageCircleMore,
  AlertTriangle,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Notification1, Shop } from "iconsax-react";
import { useVendorStore } from "@/stores/useVendorStore";

// Define the base path for your user section
const BASE_PATH = "/home/user";

const navigation = [
  { name: "Overview", href: "", icon: LayoutDashboard }, // Empty string for base path
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Offers", href: "/offers", icon: Tag },
  { name: "My Bids", href: "/bids", icon: Gavel },
  { name: "Messages", href: "/messages", icon: MessageCircleMore },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "My Disputes", href: "/disputes", icon: AlertTriangle },
  { name: "Wishlists", href: "/wishlist", icon: Heart },
  { name: "Notifications", href: "/notifications", icon: Notification1 },
  // { name: "Needs Reviews", href: "/reviews", icon: Star },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  openLogoutModal,
  onNavigate,
  handleSellClick,
}: {
  openLogoutModal: () => void;
  onNavigate?: () => void;
  handleSellClick: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (link: string) => {
    router.push(link);
    onNavigate?.(); // Close mobile sidebar if callback provided
  };

  return (
    <div className="w-64 bg-white border-r h-full  border-gray-200 p-4 space-y-2 relative">
      {navigation.map((item) => {
        // Construct full path
        const fullPath = BASE_PATH + item.href;
        // Overview (empty href) should only match exact path, others match sub-paths too
        const isActive = item.href === ""
          ? pathname === fullPath
          : pathname === fullPath || pathname.startsWith(fullPath + "/");

        return (
          <Button
            variant="ghost"
            key={item.name}
            onClick={() => handleClick(fullPath)}
            className={cn(
              "w-full justify-start text-left font-normal hover:cursor-pointer",
              isActive
                ? "bg-blue-100 text-blue-700 border-l-4 border-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon
              size={16}
              color={isActive ? "#dbeafe" : "#2e2e2e"}
              variant="Outline"
              className="mr-3 h-4 w-4"
            />
            {item.name}
          </Button>
        );
      })}
      <Button
        variant="ghost"
        onClick={() => {
          handleSellClick();
          // onNavigate?.(); // Close mobile sidebar if callback provided
        }}
        className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100 mt-8 z-50"
      >
        <Shop color="black" className="mr-3 h-4 w-4" />
        Sell
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          openLogoutModal();
          onNavigate?.(); // Close mobile sidebar if callback provided
        }}
        className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100  z-50"
      >
        <LogOut className="mr-3 h-4 w-4" />
        Logout{" "}
      </Button>
    </div>
  );
}
