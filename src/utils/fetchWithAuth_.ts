import { useUserStore } from "@/stores/useUserStore";
import { API_BASE_URL } from "./config";
import { toast } from "react-toastify";

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

  const getToken = () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        toast.error('No token found in storage', { position: 'top-center', autoClose: 2000 });
      }
      return token;
    } catch (e) {
      toast.error('Storage access blocked', { position: 'top-center', autoClose: 2000 });
      return null;
    }
  };

  const getHeaders = (token: string | null) => {
    const baseHeaders = options.body instanceof FormData
      ? { ...options.headers }
      : {
          ...options.headers,
          "Content-Type": "application/json",
        };
    
    return token ? { ...baseHeaders, 'Authorization': `Bearer ${token}` } : baseHeaders;
  };

  try {
    const token = getToken();
    
    const response = await fetch(url, {
      ...options,
      headers: getHeaders(token),
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
        const refreshToken = getToken();
        
        if (!refreshToken) {
          toast.error('No refresh token', { position: 'top-center', autoClose: 2000 });
          throw new Error("No refresh token available");
        }
        
        const refreshResponse = await fetch( `${API_BASE_URL}/auth/refresh`, { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          
          if (data.accessToken) {
            try {
              localStorage.setItem('accessToken', data.accessToken);
              toast.success('Session refreshed', { position: 'top-center', autoClose: 1000 });
            } catch (e) {
              toast.error('Cannot save token', { position: 'top-center', autoClose: 2000 });
            }
          }
          
          processQueue(null, true);
          isRefreshing = false;
          return fetchWithAuth(url, options);
        } else {
          toast.error(`Refresh failed: ${refreshResponse.status}`, { position: 'top-center', autoClose: 2000 });
          throw new Error("Refresh failed");
        }
      } catch (refreshError) {
        toast.error('Session expired', { position: 'top-center', autoClose: 2000 });
        // Graceful degradation: downgrade to guest
        processQueue(refreshError, false);
        isRefreshing = false;
        
        // Clear tokens and user state
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } catch (e) {
          console.warn('Failed to clear tokens:', e);
        }
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
    toast.error(`Network error: ${error}`, { position: 'top-center', autoClose: 2000 });
    return Promise.reject(error);
  }
};
  