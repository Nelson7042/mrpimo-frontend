export const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:5800/api/v1/auth/refresh", {
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