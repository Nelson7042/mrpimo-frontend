import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartSummary, ProductType } from "@/types/product.type";
import { cartService } from "@/utils/cartService";
import { useUserStore } from "./useUserStore";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import { toast } from "react-toastify";

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  error: string | null;

  // Actions
  addToCart: (
    product: ProductType,
    quantity?: number,
    selectedVariant?: {
      variantId: string;
      optionId: string;
      variantName: string;
      optionValue: string;
      price: number;
    }
  ) => Promise<void>;

  removeFromCart: (productId: string, variantKey?: string) => Promise<void>;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantKey?: string
  ) => Promise<void>;
  increaseQuantity: (productId: string, variantKey?: string) => Promise<void>;
  decreaseQuantity: (productId: string, variantKey?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  syncCartOnLogin: () => Promise<void>;

  // Getters
  getCartLength: () => number;
  getCartQuantity: () => number;
  getItemQuantity: (productId: string, variantKey?: string) => number;
  isInCart: (productId: string, variantKey?: string) => boolean;
  getCartItem: (productId: string, variantKey?: string) => CartItem | undefined;

  // Private methods
  calculateSummary: () => void;
  generateCartItemKey: (productId: string, variantKey?: string) => string;
}

const calculateCartSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((total, item) => {
    const price = item.selectedVariant?.price || 0;
    return total + price * item.quantity;
  }, 0);

  return {
    subtotal,
    total: subtotal, // yoo we will add taxes, shipping, discounts here
    totalItems: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      summary: {
        subtotal: 0,
        total: 0,
        totalItems: 0,
        totalQuantity: 0,
      },
      isLoading: false,
      error: null,

      generateCartItemKey: (productId: string, variantKey?: string) => {
        return variantKey ? `${productId}-${variantKey}` : productId;
      },

      calculateSummary: () => {
        const { items } = get();
        const summary = calculateCartSummary(items);
        set({ summary });
      },

      addToCart: async (product, quantity = 1, selectedVariant) => {
        const { items, calculateSummary, generateCartItemKey } = get();
        const isLoggedIn = !!useUserStore.getState().user;

        set({ isLoading: true, error: null });

        try {
          if (isLoggedIn) {
            // Add to backend
            await cartService.addToCart({
              productId: product._id!,
              quantity,
              price: selectedVariant?.price,
              variantId: selectedVariant?.variantId,
              optionId: selectedVariant?.optionId
            });
            toast.success("Product Added to Cart Successfully", toastConfigSuccess);
            
            // Reload cart from backend to get updated state
            await get().loadCart();
            console.log('Cart updated for logged in user');
          } else {
            // Add to local store
            const variantKey = selectedVariant
              ? `${selectedVariant.variantId}-${selectedVariant.optionId}`
              : undefined;

            const itemKey = generateCartItemKey(product._id!, variantKey);

            const existingItemIndex = items.findIndex((item) => {
              const existingVariantKey = item.selectedVariant
                ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
                : undefined;
              return (
                generateCartItemKey(item.product?._id ?? "", existingVariantKey) ===
                itemKey
              );
            });

            if (existingItemIndex > -1) {
              const updatedItems = [...items];
              updatedItems[existingItemIndex].quantity += quantity;
              set({ items: updatedItems });
            } else {
              const newItem: CartItem = {
                product,
                quantity,
                selectedVariant,
                addedAt: new Date().toISOString(),
              };
              set({ items: [...items, newItem] });
            }

            calculateSummary();
            console.log('Cart updated for guest user', get().summary);
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add to cart' });
              toast.error('Failed to add to cart', toastConfigError);

        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async (productId, variantKey) => {
        const isLoggedIn = !!useUserStore.getState().user;
        set({ isLoading: true, error: null });

        try {
          if (isLoggedIn) {
            await cartService.updateCartItem(productId, { productId, quantity: 0 });
            await get().loadCart();
          } else {
            const { items, calculateSummary, generateCartItemKey } = get();
            const itemKey = generateCartItemKey(productId, variantKey);

            const updatedItems = items.filter((item) => {
              const existingVariantKey = item.selectedVariant
                ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
                : undefined;
              return (
                generateCartItemKey(item.product._id ?? "", existingVariantKey) !==
                itemKey
              );
            });

            set({ items: updatedItems });
            calculateSummary();
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to remove from cart' });
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (productId, quantity, variantKey) => {
        if (quantity <= 0) {
          await get().removeFromCart(productId, variantKey);
          return;
        }

        const isLoggedIn = !!useUserStore.getState().user;
        set({ isLoading: true, error: null });

        try {
          if (isLoggedIn) {
            await cartService.updateCartItem(productId, { productId, quantity });
            await get().loadCart();
          } else {
            const { items, calculateSummary, generateCartItemKey } = get();
            const itemKey = generateCartItemKey(productId, variantKey);

            const updatedItems = items.map((item) => {
              const existingVariantKey = item.selectedVariant
                ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
                : undefined;

              if (
                generateCartItemKey(item.product._id ?? "", existingVariantKey) ===
                itemKey
              ) {
                return { ...item, quantity };
              }
              return item;
            });

            set({ items: updatedItems });
            calculateSummary();
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update quantity' });
        } finally {
          set({ isLoading: false });
        }
      },

      increaseQuantity: async (productId, variantKey) => {
        const { getItemQuantity, updateQuantity } = get();
        const currentQuantity = getItemQuantity(productId, variantKey);
        await updateQuantity(productId, currentQuantity + 1, variantKey);
      },

      decreaseQuantity: async (productId, variantKey) => {
        const { getItemQuantity, updateQuantity } = get();
        const currentQuantity = getItemQuantity(productId, variantKey);
        if (currentQuantity > 1) {
          await updateQuantity(productId, currentQuantity - 1, variantKey);
        } else {
          await get().removeFromCart(productId, variantKey);
        }
      },

      clearCart: async () => {
        const isLoggedIn = !!useUserStore.getState().user;
        set({ isLoading: true, error: null });

        try {
          if (isLoggedIn) {
            await cartService.clearCart();
          }
          set({
            items: [],
            summary: { subtotal: 0, total: 0, totalItems: 0, totalQuantity: 0 },
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to clear cart' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadCart: async () => {
        const isLoggedIn = !!useUserStore.getState().user;
        if (!isLoggedIn) {
          get().calculateSummary();
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await cartService.getCart();
          const cartItems = response.cart || [];
          
          const items: CartItem[] = cartItems.map((item: any) => ({
            product: {
              _id: item.productId,
              name: item.name,
              images: item.images || [],
              price: item.price
            },
            quantity: item.quantity,
            selectedVariant: item.variantId ? {
              variantId: item.variantId,
              optionId: item.optionId,
              variantName: '',
              optionValue: '',
              price: item.price
            } : undefined,
            addedAt: item.addedAt || new Date().toISOString(),
            priceInfo: item.priceInfo
          }));

          const summary = calculateCartSummary(items);
          set({ items, summary });
        } catch (error) {
          console.error('Failed to load cart:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load cart' });
        } finally {
          set({ isLoading: false });
        }
      },

      syncCartOnLogin: async () => {
        const { items } = get();
        
        set({ isLoading: true, error: null });

        try {
          if (items.length > 0) {
            // Merge local cart items with backend cart
            await cartService.mergeCart(items);
            // Clear local items after successful merge
            set({ items: [] });
          }
          // Load cart from backend (this will get the merged cart)
          await get().loadCart();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to sync cart' });
        } finally {
          set({ isLoading: false });
        }
      },

      getCartLength: () => {
        return get().summary.totalItems;
      },

      getCartQuantity: () => {
        return get().summary.totalQuantity;
      },

      getItemQuantity: (productId, variantKey) => {
        const { items, generateCartItemKey } = get();
        const itemKey = generateCartItemKey(productId, variantKey);

        const item = items.find((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;
          return (
            generateCartItemKey(item.product._id ?? "", existingVariantKey) ===
            itemKey
          );
        });

        return item?.quantity || 0;
      },

      isInCart: (productId, variantKey) => {
        return get().getItemQuantity(productId, variantKey) > 0;
      },

      getCartItem: (productId, variantKey) => {
        const { items, generateCartItemKey } = get();
        const itemKey = generateCartItemKey(productId, variantKey);

        return items.find((item) => {
          const existingVariantKey = item.selectedVariant
            ? `${item.selectedVariant.variantId}-${item.selectedVariant.optionId}`
            : undefined;
          return (
            generateCartItemKey(item.product._id ?? "", existingVariantKey) ===
            itemKey
          );
        });
      },
    }),
     {
      name: "mprimo-cart",
      partialize: (state) => ({
        items: state.items,
        summary: state.summary,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Cart rehydrated:', state.summary);
        }
      },
    }
  )
);
