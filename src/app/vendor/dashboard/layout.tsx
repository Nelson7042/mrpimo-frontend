"use client";
import React, { useEffect, useState } from "react";
import Header from "./(components)/Header";
import Sidebar from "./(components)/Sidebar";
import { useUserStore } from "@/stores/useUserStore";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import LogoutModal from "@/components/users/LogOutPromptModal";
import { useLogoutUser } from "@/hooks/mutations";
import { toastConfigError } from "@/app/config/toast.config";
import { resetAllStores } from "@/stores/resetStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const { user } = useUserStore();
  const router = useRouter();
  const logoutMutation = useLogoutUser();

  useEffect(() => {
    // Check if user store has been initialized
    if (useUserStore.persist.hasHydrated()) {
      setIsLoading(false);
    } else {
      const unsubscribe = useUserStore.persist.onHydrate(() => {
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    // Only redirect if we're not loading
    if (!isLoading) {
      if (!user) {
        window.location.href = "/home";
      }
      //  else if (user.role === "personal" && !user.canMakeSales) {
      //   toast.error("You don't have permission to access this page. Please upgrade your account");
      //   router.push("/");
      // }
      // else if (user.role === "business" && user.canMakeSales) {
      //   // console.log("uesr", user)
      //   // toast.error("You don't have permission to access this page. Please upgrade your account");
      //   router.push("/vendor/dashboard");
      // }
    }
  }, [user, isLoading, router]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // After loading, check permissions
  if (!user) {
    return null;
  }

  if (user && user.role === "user" && !user.canMakeSales) {
    toast.error(
      "You don't have permission to access this page. Please upgrade your account"
    );
    router.push("/home");
  }

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        // useUserStore.getState().resetStore();
        resetAllStores();

        router.push("/home");
      },
      onError: (error) => {
        console.error("Logout failed:", error);
        toast.error(error.message, toastConfigError);
      },
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <NotificationProvider>
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            openLogoutModal={() => openLogoutModal()}
          />
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={closeLogoutModal}
          logout={handleLogout}
          isLoading={logoutMutation.isPending}
        />
      </NotificationProvider>
    </div>
  );
}
