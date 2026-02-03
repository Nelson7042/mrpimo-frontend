"use client";

import { useEffect } from "react";
import { refreshToken } from "@/utils/refreshToken";
import { useUserStore } from "@/stores/useUserStore";

export function TokenRefresher() {
  const { user } = useUserStore();
  
  useEffect(() => {
    if (!user) return;
    
    // Initial refresh if we have refreshToken but no accessToken
    const accessToken = localStorage.getItem('accessToken');
    const hasRefreshToken = localStorage.getItem('refreshToken') || document.cookie.includes('refreshToken=');
    
    if (!accessToken && hasRefreshToken) {
      refreshToken().catch(console.error);
    }
    
    const refreshInterval = setInterval(() => {
      refreshToken().catch(console.error);
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user]);
  
  return null;
}
