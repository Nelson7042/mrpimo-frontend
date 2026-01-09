
'use client';

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
  const loadingRef = useRef(false);

  // Load cart on initial mount for logged-in users
  useEffect(() => {
    if (isLoggedIn && !initialLoadRef.current && !loadingRef.current) {
      initialLoadRef.current = true;
      loadingRef.current = true;
      loadCart().finally(() => {
        loadingRef.current = false;
      }).catch(console.warn);
    }
  }, [isLoggedIn]); // Remove loadCart dependency

  // Handle user login/logout changes
  useEffect(() => {
    const userChanged = prevUserRef.current !== user;
    prevUserRef.current = user;

    if (isLoggedIn && userChanged && !syncedRef.current && !loadingRef.current) {
      syncedRef.current = true;
      loadingRef.current = true;
      syncCartOnLogin().finally(() => {
        loadingRef.current = false;
      }).catch(console.error);
    } else if (!isLoggedIn && userChanged && !loadingRef.current) {
      syncedRef.current = false;
      initialLoadRef.current = false;
      loadingRef.current = true;
      loadCart().finally(() => {
        loadingRef.current = false;
      }).catch(console.warn);
    }
  }, [user, isLoggedIn]); // Remove function dependencies

  return { isLoggedIn };
};