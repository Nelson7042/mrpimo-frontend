// client/src/components/NotificationBell.tsx
import React, { useRef, useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Bell, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationModal from "@/app/vendor/dashboard/(components)/NotifiicationModal";

const NotificationBell: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const notificationBellRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const router = useRouter();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setShowDropdown(false);

    if (notification.data?.url) {
      router.push(notification.data.url);
    }
  };

  return (
    <div className="relative flex bg-white size-8 justify-center items-center rounded-full border border-gray-200 shadow-md">
      <button
        className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
        ref={notificationBellRef}
      >
        {unreadCount > 0 ? (
          <div className="relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-3 flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          </div>
        ) : (
          <BellOff size={18} className="text-gray-400"/>
        )}
      </button>

      {showDropdown && (
        <NotificationModal
          isOpen={showDropdown}
          onClose={() => setShowDropdown(false)}
          anchorEl={notificationBellRef.current}
        />
      )}
    </div>
  );
};

export default NotificationBell;
