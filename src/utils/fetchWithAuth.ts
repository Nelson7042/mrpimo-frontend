import { useUserStore } from "@/stores/useUserStore";

let isRefreshing = false;

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const {user} = useUserStore.getState();
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    const headers = options.body instanceof FormData 
      ? { ...options.headers }
      : {
          ...options.headers,
          "Content-Type": "application/json",
        };
  
    const response = await fetch(url, { 
      ...options, 
      headers,
      credentials: "include"
    });
  
    // If unauthorized (401) or forbidden (403), try refreshing token
    if ((response.status === 401 || response.status === 403) && !isRefreshing && user?._id) {
      isRefreshing = true;
      
      try {
        const refreshResponse = await fetch("http://localhost:5800/api/v1/auth/refresh", { 
          method: "POST", 
          credentials: "include"
        });
  
        if (refreshResponse.ok) {
          isRefreshing = false;
          // Retry the original request with same header logic
          const retryHeaders = options.body instanceof FormData 
            ? { ...options.headers }
            : {
                ...options.headers,
                "Content-Type": "application/json",
              };
          return fetch(url, { 
            ...options, 
            headers: retryHeaders,
            credentials: "include" 
          });
        } else {
          isRefreshing = false;
          // Only redirect if we're on a protected route
          const protectedRoutes = ['/vendor', '/home/user', '/home/dashboard'];
          const isProtectedRoute = protectedRoutes.some(route => window.location.pathname.startsWith(route));
          
          if (isProtectedRoute && !window.location.pathname.includes('/login')) {
            window.location.href = "/login";
          }
          return Promise.reject("Authentication failed. Please log in again.");
        }
      } catch (error) {
        isRefreshing = false;
        const protectedRoutes = ['/vendor', '/home/user', '/home/dashboard'];
        const isProtectedRoute = protectedRoutes.some(route => window.location.pathname.startsWith(route));
        
        if (isProtectedRoute && !window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
        return Promise.reject("Authentication error. Please log in again.");
      }
    }
  
    return response;
  };
  