import { useEffect } from 'react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { useUserStore } from '@/stores/useUserStore';
import { useWishlist } from '@/hooks/useWishlist';

export const useWishlistSync = () => {
  const { user } = useUserStore();
  const isLoggedIn = !!user;
  const { setItems } = useWishlistStore();
  const { wishlist } = useWishlist();

  useEffect(() => {
    if (isLoggedIn && wishlist) {
      // When user is logged in, sync wishlist from API
      setItems(wishlist);
    } else if (!isLoggedIn) {
      // When user logs out, clear wishlist
      setItems([]);
    }
  }, [isLoggedIn, wishlist, setItems]);
};