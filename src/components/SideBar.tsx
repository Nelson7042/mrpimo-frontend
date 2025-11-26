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
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

// Define the base path for your user section
const BASE_PATH = "/home/user";

const navigation = [
  { name: "Overview", href: "", icon: LayoutDashboard }, // Empty string for base path
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Messages", href: "/messages", icon: MessageCircleMore },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "Wishlists", href: "/wishlist", icon: Heart },
  { name: "Notifications", href: "/notifications", icon: Bell, hasNotificationBadge: true },
  { name: "Needs Reviews", href: "/reviews", icon: Star },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ openLogoutModal }: { openLogoutModal: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: notificationsData, error } = useNotifications();
  
  const unreadCount = error ? 0 : (notificationsData?.notifications?.filter((n: any) => !n.isRead)?.length || 0);
  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString();

  const handleClick = (link: string) => {
    router.push(link);
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
              "w-full justify-start text-left font-normal hover:cursor-pointer relative",
              isActive
                ? "bg-blue-100 text-blue-700 border-l-4 border-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-blue-700" : "text-gray-700")} />
            {item.name}
            {item.hasNotificationBadge && unreadCount > 0 && (
              <span className="absolute -top-1 left-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {displayCount}
              </span>
            )}
          </Button>
        );
      })}
      <Button
        variant="ghost"
        onClick={() => openLogoutModal()}
        className="w-full justify-start text-left font-normal text-gray-700 hover:bg-gray-100 mt-8 z-50 mb-8"
      >
        <LogOut className="mr-3 h-4 w-4" />
        Logout{" "}
      </Button>
    </div>
  );
}
