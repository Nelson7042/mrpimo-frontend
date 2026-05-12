import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

export const useAuth = () => {
  const { user, setUser, _hasHydrated } = useUserStore();
  const { setVendor } = useVendorStore();
  const [isAuthLoading, setIsAuthLoading] = useState(!_hasHydrated);

  useEffect(() => {
    // Wait for store hydration before deciding to fetch
    if (!_hasHydrated) {
      setIsAuthLoading(true);
      return;
    }

    const fetchUser = async () => {
      // If user already exists (from hydration), we're done
      if (user) {
        setIsAuthLoading(false);
        return;
      }

      // Check if tokens exist — if not, user is truly a guest
      const hasTokens = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
      if (!hasTokens) {
        setIsAuthLoading(false);
        return;
      }
      
      // Tokens exist but user is null — fetch profile to restore session
      try {
        setIsAuthLoading(true);
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
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchUser();
  }, [user, _hasHydrated, setUser, setVendor]);

  return { user, isAuthLoading };
};
