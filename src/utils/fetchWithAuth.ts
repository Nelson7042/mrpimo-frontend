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

  // Allow /users/profile endpoint to bypass guest mode check (needed to fetch user on page load)
  const isProfileEndpoint = url.includes('/users/profile');

  // Block requests if no user in state (guest mode) - except for profile endpoint
  if (!user && !isProfileEndpoint) {
    return Promise.reject("Guest mode");
  }

  const getToken = () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
     
      return token;
    } catch (e) {
      console.warn('Failed to get token from localStorage:', e);
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
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', data.accessToken);
              }
            } catch (e) {
              console.warn('Failed to save new token:', e);
            }
          }
          
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
        
        // Clear tokens and user state
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (e) {
          console.warn('Failed to clear tokens:', e);
        }
        store.resetStore();

        return Promise.reject("Session expired");
      }
    }

    return response;
  } catch (error) {
    // Add more context to network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error when fetching:', url, error.message);
      return Promise.reject(`Network error: ${error.message}`);
    }
    return Promise.reject(error);
  }
};
  