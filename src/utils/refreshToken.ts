import { API_BASE_URL } from "./config";

export const refreshToken = async (): Promise<boolean> => {
    console.log('🔄 [REFRESH] Attempting to refresh token');
    
    try {
      console.log('🔄 [REFRESH] Calling API:', `${API_BASE_URL}/auth/refresh`);
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include" // Include cookies in refresh request
      });
  
      console.log('🔄 [REFRESH] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ [REFRESH] Token refresh successful');
        return true;
      } else {
        // Refresh failed
        console.error('❌ [REFRESH] Token refresh failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ [REFRESH] Error during token refresh:', error);
      return false;
    }
  };