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

  // Check if user has tokens in localStorage (handles store hydration delay)
  const hasTokens = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  // Block requests if no user in state AND no tokens (true guest mode) - except for profile endpoint
  if (!user && !hasTokens && !isProfileEndpoint) {
    return Promise.reject("Guest mode");
  }

  const getAccessToken = () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      // If no token found, user is logged out
      if (!token) {
        return null;
      }
      
      // Also check if we have a cookie-based token (for OAuth flows)
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
        if (accessTokenCookie) {
          const cookieToken = accessTokenCookie.split('=')[1];
          // Store in localStorage for future requests
          localStorage.setItem('accessToken', cookieToken);
          return cookieToken;
        }
      }
      
      return token;
    } catch (e) {
      console.warn('Failed to get access token from localStorage:', e);
      return null;
    }
  };

  const getRefreshToken = () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      
      if (!token && typeof window !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
        if (refreshTokenCookie) {
          const cookieToken = refreshTokenCookie.split('=')[1];
          localStorage.setItem('refreshToken', cookieToken);
          return cookieToken;
        }
      }
      
      return token;
    } catch (e) {
      console.warn('Failed to get refresh token from localStorage:', e);
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
    const accessToken = getAccessToken();
    
    // If no token available, reject immediately (user is logged out)
    if (!accessToken && !isProfileEndpoint) {
      return Promise.reject("No authentication token available");
    }
    
    const response = await fetch(url, {
      ...options,
      headers: getHeaders(accessToken),
      credentials: "include",
    });

    // Handle token expiry (401 Unauthorized) or specific 403 for expired token
    if (response.status === 401 || response.status === 403) {
      // Check if this is actually a token expiry issue vs a permission issue
      const responseClone = response.clone();
      let errorData: any = {};
      try {
        errorData = await responseClone.json();
      } catch {
        // If we can't parse JSON, treat as potential token issue
      }
      
      // Only attempt refresh for actual token issues, not permission denials
      const isTokenExpiry = 
        response.status === 401 || 
        errorData.message === "Access Token Expired" ||
        errorData.message === "Unauthorized - No token provided" ||
        errorData.message === "Invalid Token";
      
      // If it's a permission issue (not token expiry), return the response as-is
      if (!isTokenExpiry) {
        return response;
      }
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => fetchWithAuth(url, options))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
          },
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          
          // Save new access token from response body
          if (data.accessToken) {
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', data.accessToken);
              }
            } catch (e) {
              console.warn('Failed to save new access token:', e);
            }
          }

          // Save new refresh token if provided (backend might rotate refresh tokens)
          if (data.refreshToken) {
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('refreshToken', data.refreshToken);
              }
            } catch (e) {
              console.warn('Failed to save new refresh token:', e);
            }
          }
          
          // Process queued requests
          processQueue(null, true);
          isRefreshing = false;
          
          // Retry the original request with new token
          return fetchWithAuth(url, options);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError, false);
        isRefreshing = false;
        
        // Clear tokens and user state
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // Clear authentication cookies
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
