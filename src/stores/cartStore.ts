import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartSummary, ProductType } from "@/types/product.type";
import { cartService } from "@/utils/cartService";
import { useUserStore } from "./useUserStore";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import { toast } from "react-toastify";

const KEY_SEPARATOR = "::";

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

  addBulkToCart: (items: Array<{
    productId: string;
    quantity: number;
    price: number;
    variantId: string;
    optionId: string;
  }>) => Promise<{ successful: any[]; failed: any[] }>;

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
  generateCartItemKey: (productId: string, variantId?: string, optionId?: string) => string;
}

const calculateCartSummary = (items: CartItem[]): CartSummary => {
  const subtotal = items.reduce((total, item) => {
    const price = item.priceInfo?.displayPrice || item.selectedVariant?.price || 0;
    return total + price * item.quantity;
  }, 0);

  return {
    subtotal,
    total: subtotal, 
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

      generateCartItemKey: (productId: string, variantId?: string, optionId?: string) => {
        return variantId && optionId ? `${productId}${KEY_SEPARATOR}${variantId}${KEY_SEPARATOR}${optionId}` : productId;
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
          // Check available quantity from backend for logged-in users
          if (isLoggedIn && selectedVariant && selectedVariant.optionId) {
            const quantityCheck = await cartService.getOptionQuantity(
              product._id!,
              selectedVariant.variantId,
              selectedVariant.optionId
            );

            if (!quantityCheck.success || !quantityCheck.data) {
              throw new Error('Failed to verify product availability');
            }

            const variantKey = `${selectedVariant.variantId}${KEY_SEPARATOR}${selectedVariant.optionId}`;
            const currentQty = get().getItemQuantity(product._id!, variantKey);
            const newTotalQty = currentQty + quantity;

            if (newTotalQty > quantityCheck.data.quantity) {
              throw new Error(`Only ${quantityCheck.data.quantity} items available`);
            }

            // Add to backend
            await cartService.addToCart({
              productId: product._id!,
              quantity,
              price: selectedVariant?.price,
              variantId: selectedVariant?.variantId,
              optionId: selectedVariant?.optionId,
              name: product.name,
              images: product.images || [],
              variantName: selectedVariant?.variantName,
              optionValue: selectedVariant?.optionValue,
              priceInfo: (product as any).priceInfo
            });
            toast.success("Product Added to Cart Successfully", toastConfigSuccess);
            
            // Reload cart from backend to get updated state
            await get().loadCart();
          } else {
            // Check available quantity from backend for offline users
            if (!selectedVariant || !selectedVariant.optionId) {
              throw new Error('Product variant is required');
            }

            const quantityCheck = await cartService.getOptionQuantity(
              product._id!,
              selectedVariant.variantId,
              selectedVariant.optionId
            );

            if (!quantityCheck.success || !quantityCheck.data) {
              throw new Error('Failed to verify product availability');
            }

            const itemKey = generateCartItemKey(product._id!, selectedVariant.variantId, selectedVariant.optionId);

            const existingItemIndex = items.findIndex((item) => {
              return (
                generateCartItemKey(
                  item.product?._id ?? "",
                  item.selectedVariant?.variantId,
                  item.selectedVariant?.optionId
                ) === itemKey
              );
            });

            const currentQty = existingItemIndex > -1 ? items[existingItemIndex].quantity : 0;
            const newTotalQty = currentQty + quantity;

            if (newTotalQty > quantityCheck.data.quantity) {
              throw new Error(`Only ${quantityCheck.data.quantity} items available`);
            }

            if (existingItemIndex > -1) {
              const updatedItems = [...items];
              updatedItems[existingItemIndex].quantity = newTotalQty;
              set({ items: updatedItems });
            } else {
              const newItem: CartItem = {
                product,
                quantity,
                selectedVariant,
                addedAt: new Date().toISOString(),
                priceInfo: (product as any).priceInfo
              };
              set({ items: [...items, newItem] });
            }

            calculateSummary();
            toast.success("Product Added to Cart Successfully", toastConfigSuccess);
          }
        } catch (error) {
          console.log(error)
          set({ error: error instanceof Error ? error.message : 'Failed to add to cart' });
          toast.error(error instanceof Error ? error.message : 'Failed to add to cart', toastConfigError);

        } finally {
          set({ isLoading: false });
        }
      },

      addBulkToCart: async (items) => {
        const isLoggedIn = !!useUserStore.getState().user;
        
        if (!isLoggedIn) {
          throw new Error('Must be logged in to add multiple items');
        }

        set({ isLoading: true, error: null });

        try {
          const response = await cartService.addBulkToCart(items);
          
          if (response.results.totalSuccessful > 0) {
            toast.success(`${response.results.totalSuccessful} item(s) added to cart`, toastConfigSuccess);
            await get().loadCart();
          }
          
          if (response.results.totalFailed > 0) {
            toast.error(`${response.results.totalFailed} item(s) failed to add`, toastConfigError);
          }

          return {
            successful: response.results.successful,
            failed: response.results.failed
          };
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add items to cart' });
          toast.error('Failed to add items to cart', toastConfigError);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async (productId, variantKey) => {
        const isLoggedIn = !!useUserStore.getState().user;
        set({ isLoading: true, error: null });

        try {
          if (isLoggedIn) {
            if (variantKey) {
              const parts = variantKey.split(KEY_SEPARATOR);
              const [variantId, optionId] = parts.length >= 2 ? [parts[0], parts[1]] : [undefined, undefined];
              if (variantId && optionId) {
                await cartService.deleteCartItem(productId, variantId, optionId);
              }
            }
            await get().loadCart();
          } else {
            const { items, calculateSummary, generateCartItemKey } = get();
            const parts = variantKey ? variantKey.split(KEY_SEPARATOR) : [];
            const [variantId, optionId] = parts.length >= 2 ? [parts[0], parts[1]] : [undefined, undefined];
            const itemKey = generateCartItemKey(productId, variantId, optionId);

            const updatedItems = items.filter((item) => {
              return (
                generateCartItemKey(
                  item.product._id ?? "",
                  item.selectedVariant?.variantId,
                  item.selectedVariant?.optionId
                ) !== itemKey
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
          // Check backend stock availability
          if (variantKey) {
            const parts = variantKey.split(KEY_SEPARATOR);
            const [variantId, optionId] = parts.length >= 2 ? [parts[0], parts[1]] : [undefined, undefined];
            if (!variantId || !optionId) {
              throw new Error('Invalid variant key');
            }
            const result = await cartService.getOptionQuantity(productId, variantId, optionId);
            if (result.success && result.data) {
              if (quantity > result.data.quantity) {
                toast.error(`Only ${result.data.quantity} items available`, toastConfigError);
                throw new Error(`Only ${result.data.quantity} items available`);
              }
            }
          }

          if (isLoggedIn) {
            // Get current item to extract variant details
            const currentItem = get().getCartItem(productId, variantKey);
            if (!currentItem || !currentItem.selectedVariant) {
              throw new Error('Item not found in cart');
            }
            
            // Use addToCart with the new quantity (backend will update existing item)
            await cartService.addToCart({
              productId,
              quantity,
              price: currentItem.selectedVariant.price,
              variantId: currentItem.selectedVariant.variantId,
              optionId: currentItem.selectedVariant.optionId,
              name: currentItem.product.name,
              images: currentItem.product.images || [],
              variantName: currentItem.selectedVariant.variantName,
              optionValue: currentItem.selectedVariant.optionValue,
              priceInfo: currentItem.priceInfo
            });
            await get().loadCart();
          } else {
            const { items, calculateSummary, generateCartItemKey } = get();
            const parts = variantKey ? variantKey.split(KEY_SEPARATOR) : [];
            const [variantId, optionId] = parts.length >= 2 ? [parts[0], parts[1]] : [undefined, undefined];
            const itemKey = generateCartItemKey(productId, variantId, optionId);

            const updatedItems = items.map((item) => {
              if (
                generateCartItemKey(
                  item.product._id ?? "",
                  item.selectedVariant?.variantId,
                  item.selectedVariant?.optionId
                ) === itemKey
              ) {
                return { ...item, quantity };
              }
              return item;
            });

            set({ items: updatedItems });
            calculateSummary();
          }
        } catch (error: any) {
          set({ error: error instanceof Error ? error.message : 'Failed to update quantity' });
          if (!error.message?.includes('items available')) {
            toast.error('Failed to update quantity', toastConfigError);
          }
        } finally {
          set({ isLoading: false });
        }
      },

      increaseQuantity: async (productId, variantKey) => {
        const { updateQuantity } = get();
        const currentQuantity = get().getItemQuantity(productId, variantKey);
        await updateQuantity(productId, currentQuantity + 1, variantKey);
      },

      decreaseQuantity: async (productId, variantKey) => {
        const { updateQuantity } = get();
        const currentQuantity = get().getItemQuantity(productId, variantKey);
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
          } else {
            cartService.clearOfflineCart();
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
          // For logged-out users, recalculate summary from persisted items
          const { items } = get();
          const summary = calculateCartSummary(items);
          set({ summary });
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
              price: item.price,
              variants: item.variants
            },
            quantity: item.quantity,
            selectedVariant: item.variantId ? {
              variantId: item.variantId,
              optionId: item.optionId,
              variantName: item.variantDetails?.variantName || '',
              optionValue: item.variantDetails?.optionValue || '',
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
        const parts = variantKey ? variantKey.split(KEY_SEPARATOR) : [];
        const [variantId, optionId] = parts.length >= 2 ? [parts[0], parts[1]] : [undefined, undefined];
        const itemKey = generateCartItemKey(productId, variantId, optionId);

        const item = items.find((item) => {
          return (
            generateCartItemKey(
              item.product._id ?? "",
              item.selectedVariant?.variantId,
              item.selectedVariant?.optionId
            ) === itemKey
          );
        });

        return item?.quantity || 0;
      },

      isInCart: (productId, variantKey) => {
        return get().getItemQuantity(productId, variantKey) > 0;
      },

      getCartItem: (productId, variantKey) => {
        const { items, generateCartItemKey } = get();
        const parts = variantKey ? variantKey.split(KEY_SEPARATOR) : [];
        const [variantId, optionId] = parts.length >= 2 ? [parts[0], parts[1]] : [undefined, undefined];
        const itemKey = generateCartItemKey(productId, variantId, optionId);

        return items.find((item) => {
          return (
            generateCartItemKey(
              item.product._id ?? "",
              item.selectedVariant?.variantId,
              item.selectedVariant?.optionId
            ) === itemKey
          );
        });
      },
    }),
     {
      name: "mprimo-cart",
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
