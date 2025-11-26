"use client";

import { useLogoutUser } from "@/hooks/mutations";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "react-toastify";
import { toastConfigError } from "./config/toast.config";
import { useSocket } from "@/hooks/useSocket";

import Homepage from "./home/layout";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetAllStores } from "@/stores/resetStore";

export default function Home() {
  const { user } = useUserStore();
  const { mutate: logoutUser } = useLogoutUser();
  const socket = useSocket();

  useEffect(() => {
    if (socket && user)
      if (socket) socket.emit("authenticate", { userId: user._id });
  }, [socket, user]);
  const router = useRouter();
  useEffect(() => {
    router.push("/home");
  }, []);

  const handleLogoutClicked = () => {
    logoutUser(undefined, {
      onSuccess: async (data) => {
        resetAllStores();
      },
      onError: (error) => {
        toast.error(error.message, toastConfigError);
      },
    });
  };
  return (
    <div>
      <Homepage />
      {/* <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-y-4 bg-gray-100">
        {!user ? (
          <Link href="/sign-up">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-400">
              Sign Up
            </button>
          </Link>
        ) : (
          <button
            onClick={handleLogoutClicked}
            className="bg-red-500 text-white p-4 py-2 rounded-md cursor-pointer hover:bg-red-400"
          >
            Logout
          </button>
        )}
      </div> */}
    </div>
  );
}
