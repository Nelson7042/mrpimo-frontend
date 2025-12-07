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
      if (user) return;

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          if (data.vendor) setVendor(data.vendor);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  return { user };
};
