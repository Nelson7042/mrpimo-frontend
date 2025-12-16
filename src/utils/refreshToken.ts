import { API_BASE_URL } from "./config";

export const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include" // Include cookies in refresh request
      });
  
      if (response.ok) {
        return true;
      } else {
        // Refresh failed
        console.error("Token refresh failed");
        return false;
      }
    } catch (error) {
      console.error("Error during token refresh:", error);
      return false;
    }
  };