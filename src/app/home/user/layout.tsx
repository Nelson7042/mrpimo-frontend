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
import AuthenticationModalVendor from "@/app/(auth)/authenticationModalVendor";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useVendorStore } from "@/stores/useVendorStore";
import KybModal from "@/components/KybModal";
import { useKybStore } from "@/stores/useKybStore";
import { useUserStore } from "@/stores/useUserStore";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const logoutMutation = useLogoutUser();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSell, setIsSell] = useState(false);
  const [isKybModalOpen, setIsKybModalOpen] = useState(false);
  const { setAuthType } = useAuthModalStore();
  const { vendor } = useVendorStore();
  const { user } = useUserStore();
  const { setFormData, resetForm } = useKybStore();

  const handleSellClick = () => {
    if (!vendor) {
      // Reset and populate KYB form with user data
      resetForm();
      if (user?.profile) {
        setFormData({
          firstName: user.profile.firstName || '',
          lastName: user.profile.lastName || '',
          phoneNumber: user.profile.phoneNumber || '',
          countryCode: user.country || '',
        });
      }
      setIsKybModalOpen(true);
    } else {
      router.push("/vendor/dashboard");
    }
  };
   const handleCloseVendorModal = () => {
    setIsSell(false);
    setAuthType("");
  };

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
    // Clear everything immediately, don't wait for API call
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tempUser');
      
      // Clear authentication cookies
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch (e) {
      console.warn('Failed to clear tokens:', e);
    }
    
    resetAllStores();
    closeLogoutModal();
    
    // Make logout API call but don't depend on it
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        // Always redirect regardless of API success/failure
        router.push("/home");
      },
    });
    
    toast.success("Logout Successful");
  };

  return (
    <div className="min-h-screen font-roboto bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          
          <Sidebar
            openLogoutModal={openLogoutModal}
            handleSellClick={handleSellClick}
          />

        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/10 z-40 lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`
          fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
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
          <Sidebar
            openLogoutModal={openLogoutModal}
            onNavigate={closeMobileSidebar}
              handleSellClick={handleSellClick}
          />
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

        <AuthenticationModalVendor isOpen={isSell} close={handleCloseVendorModal} />
        <KybModal isOpen={isKybModalOpen} onClose={() => setIsKybModalOpen(false)} />
      </div>
    </div>
  );
}
