import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductType } from "@/types/product.type";
import { Wishlist, WishlistItem } from "@/types/wishlist.type";

interface WishlistState {
  items: Wishlist[];
  isLoading: boolean;

  // Actions
  setItems: (items: Wishlist[]) => void;
  addItem: (item: Wishlist) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  setLoading: (loading: boolean) => void;

  // Getters
  getWishlistLength: () => number;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      setItems: (items) => set({ items }),

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (existingItem) => existingItem.productId._id === item.productId._id
        );
        if (!existingItem) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        const updatedItems = items.filter(
          (item) => item.productId._id !== productId
        );
        set({ items: updatedItems });
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      getWishlistLength: () => {
        return get().items.length;
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(
          (item) => String(item.productId) === String(productId)
        );
      },
    }),
    {
      name: "mprimo-wishlist",
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) =>
          localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
