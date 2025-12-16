"use client";

import Header from "@/components/Home/Header";
import { Sidebar } from "@/components/SideBar";
import LogoutModal from "@/components/users/LogOutPromptModal";
import { useLogoutUser } from "@/hooks/mutations";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { toast } from "react-toastify";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetAllStores } from "@/stores/resetStore";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const logoutMutation = useLogoutUser();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);


  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Logout Successfull");
        resetAllStores()
        closeLogoutModal();
        router.push("/home");
      },
    });
  };

  return (
    <div className="min-h-screen font-roboto bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar openLogoutModal={openLogoutModal} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/10 z-40 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileSidebar}
              className="p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar openLogoutModal={openLogoutModal} onNavigate={closeMobileSidebar} />
        </div>

        <div className="flex-1">
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileSidebar}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <main className="p-4 md:p-6">{children}</main>
        </div>

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={closeLogoutModal}
          logout={handleLogout}
          isLoading={logoutMutation.isPending}
        />
      </div>
    </div>
  );
}
