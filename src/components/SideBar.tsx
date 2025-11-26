"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Heart,
  Star,
  Settings,
  LogOut,
  MessageCircleMore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Notification1 } from "iconsax-react";

// Define the base path for your user section
const BASE_PATH = "/home/user";

const navigation = [
  { name: "Overview", href: "", icon: LayoutDashboard }, // Empty string for base path
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Messages", href: "/messages", icon: MessageCircleMore },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Wishlists", href: "/wishlist", icon: Heart },
  { name: "Notifications", href: "/notifications", icon: Notification1 },
  { name: "Needs Reviews", href: "/reviews", icon: Star },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ 
  openLogoutModal, 
  onNavigate 
}: { 
  openLogoutModal: () => void;
  onNavigate?: () => void;
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
        const isActive = pathname === fullPath;

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
            <item.icon size={16} color={isActive ? "#dbeafe" : "#2e2e2e"} variant="Outline" className="mr-3 h-4 w-4" />
            {item.name}
          </Button>
        );
      })}
      <Button
        variant="ghost"
        onClick={() => {
          openLogoutModal();
          onNavigate?.(); // Close mobile sidebar if callback provided
        }}
        className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100 mt-8 z-50"
      >
        <LogOut className="mr-3 h-4 w-4" />
        Logout{" "}
      </Button>
    </div>
  );
}
