import { useEffect, useRef } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/useUserStore';

export const useCartSync = () => {
  const { user } = useUserStore();
  const isLoggedIn = !!user;
  const { syncCartOnLogin, loadCart } = useCartStore();
  const syncedRef = useRef(false);
  const prevUserRef = useRef(user);
  const initialLoadRef = useRef(false);

  // Load cart on initial mount for logged-in users
  useEffect(() => {
    if (isLoggedIn && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadCart().catch(console.warn);
    }
  }, [isLoggedIn, loadCart]);

  // Handle user login/logout changes
  useEffect(() => {
    const userChanged = prevUserRef.current !== user;
    prevUserRef.current = user;

    if (isLoggedIn && userChanged && !syncedRef.current) {
      syncedRef.current = true;
      syncCartOnLogin().catch(console.error);
    } else if (!isLoggedIn && userChanged) {
      syncedRef.current = false;
      initialLoadRef.current = false;
      loadCart().catch(console.warn);
    }
  }, [user, isLoggedIn, syncCartOnLogin, loadCart]);

  return { isLoggedIn };
};