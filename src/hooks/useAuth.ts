import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

export const useAuth = () => {
  const { user, setUser } = useUserStore();
  const { setVendor } = useVendorStore();

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        return;
      }
      
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`);
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          if (data.vendor) {
            setVendor(data.vendor);
          }
        }
      } catch (error) {
        // Silently handle guest mode and session expired
        if (error !== "Guest mode" && error !== "Session expired") {
          console.error('Auth check failed:', error);
        }
      }
    };

    fetchUser();
  }, [user, setUser, setVendor]);

  return { user };
};
