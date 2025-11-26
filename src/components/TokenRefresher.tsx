"use client";

import { useEffect } from "react";
import { refreshToken } from "@/utils/refreshToken";
import { useUserStore } from "@/stores/useUserStore";

export function TokenRefresher() {
  const { user } = useUserStore();
  
  useEffect(() => {
    // Only set up refresh interval if user is logged in
    if (!user) return;
    
    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }, 14 * 60 * 1000); // 14 minutes in milliseconds

    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [user]);
  
  // This component doesn't render anything
  return null;
}
