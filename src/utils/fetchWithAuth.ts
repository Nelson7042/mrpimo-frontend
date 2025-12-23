import { useUserStore } from "@/stores/useUserStore";
import { API_BASE_URL } from "./config";
import { softResetAllStores } from "@/stores/resetStore";


let isRefreshing = false;


export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const {user} = useUserStore.getState();
    
    // Get token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    const baseHeaders: Record<string, string> = options.body instanceof FormData 
      ? { ...(options.headers as Record<string, string>) }
      : {
          ...(options.headers as Record<string, string>),
          "Content-Type": "application/json",
        };
    
    // // Add Authorization header if token exists
    // if (token) {
    //   baseHeaders["Authorization"] = `Bearer ${token}`;
    // }
  
    let response: Response;
    try {
      response = await fetch(url, { 
        ...options, 
        headers: baseHeaders,
        credentials: "include"
      });
    } catch (error) {
      // Handle network errors (CORS, connection refused, etc.)
      console.error("Network error in fetchWithAuth:", error);
      throw new Error("Network error: Unable to connect to the server. Please check your internet connection.");
    }
  
    // If unauthorized (401) or forbidden (403), try refreshing token
    if ((response.status === 401 || response.status === 403) && !isRefreshing && user?._id) {
      isRefreshing = true;
      
      try {
        const refreshResponse = await fetch( `${API_BASE_URL}/auth/refresh`, { 
          method: "POST", 
          credentials: "include"
        });
  
        if (refreshResponse.ok) {
          isRefreshing = false;
          // Retry the original request with same header logic
          const retryToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const retryHeaders: Record<string, string> = options.body instanceof FormData 
            ? { ...(options.headers as Record<string, string>) }
            : {
                ...(options.headers as Record<string, string>),
                "Content-Type": "application/json",
              };
          
          if (retryToken) {
            retryHeaders["Authorization"] = `Bearer ${retryToken}`;
          }
          
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
          
          // if (isProtectedRoute && !window.location.pathname.includes('/login')) {
          //   window.location.href = "/home";
          //   softResetAllStores()
          // }
          return Promise.reject("Authentication failed. Please log in again.");
        }
      } catch (error) {
        isRefreshing = false;
        const protectedRoutes = ['/vendor', '/home/user', '/home/dashboard'];
        const isProtectedRoute = protectedRoutes.some(route => window.location.pathname.startsWith(route));
        
        // if (isProtectedRoute && !window.location.pathname.includes('/login')) {
        //   window.location.href = "/home";
        //   softResetAllStores()

        // }
        return Promise.reject("Authentication error. Please log in again.");
      }
    }
  
    return response;
  };
  