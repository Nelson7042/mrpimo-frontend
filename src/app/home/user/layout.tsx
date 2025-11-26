"use client";

import Header from "@/components/Home/Header";
import { Sidebar } from "@/components/SideBar";
import LogoutModal from "@/components/users/LogOutPromptModal";
import { useLogoutUser } from "@/hooks/mutations";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { toast } from "react-toastify";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const logoutMutation = useLogoutUser();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  console.log("logoutMutation.isPending", logoutMutation.isPending)

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Logout Successfull");
        closeLogoutModal();
        router.push("/home");
      },
    });
  };
  return (
    <div className="min-h-screen font-roboto bg-gray-50">
      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar openLogoutModal={openLogoutModal} />
        </div>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
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
