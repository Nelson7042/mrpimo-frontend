import { useUserStore } from "@/stores/useUserStore";
import { API_BASE_URL } from "./config";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, tokenRefreshed: boolean = false) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(tokenRefreshed);
    }
  });
  failedQueue = [];
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<any> => {
  const store = useUserStore.getState();
  const user = store.user;

  // Block requests if no user in state (guest mode)
  if (!user) {
    return Promise.reject("Guest mode");
  }

  const getHeaders = () => {
    return options.body instanceof FormData
      ? { ...options.headers }
      : {
          ...options.headers,
          "Content-Type": "application/json",
        };
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: getHeaders(),
      credentials: "include",
    });

    // Handle token expiry
    if (response.status === 401 || response.status === 403) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => fetchWithAuth(url, options))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch( `${API_BASE_URL}/auth/refresh`, { 
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          processQueue(null, true);
          isRefreshing = false;
          return fetchWithAuth(url, options);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (refreshError) {
        // Graceful degradation: downgrade to guest
        processQueue(refreshError, false);
        isRefreshing = false;
        
        // Clear user state immediately (this stops Header notifications)
        store.resetStore();

        // Only redirect if on protected routes
        const protectedRoutes = ['/vendor', '/home/user', '/home/dashboard', '/account'];
        const currentPath = window.location.pathname;
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
        
        // if (isProtectedRoute && !currentPath.includes('/login')) {
        //   window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        // } else {
        //   console.log("Session expired. Downgrading to guest mode.");
        // }

        return Promise.reject("Session expired");
      }
    }

    return response;
  } catch (error) {
    return Promise.reject(error);
  }
};
  