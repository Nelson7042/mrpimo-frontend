import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartSummary, ProductType } from "@/types/product.type";
import { cartService } from "@/utils/cartService";
import { useUserStore } from "./useUserStore";
import { toastConfigError, toastConfigSuccess } from "@/app/config/toast.config";
import { toast } from "react-toastify";
import { getDisplayPrice } from "@/utils/priceUtils";

const KEY_SEPARATOR = "::";

interface CartState {
  items: CartItem[];
  summary: CartSummary;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
    currencySymbol: string;
  } | null;
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
    // FIX: Use displayPrice directly (already converted by backend)
    // Do NOT multiply by exchange rate - that causes double conversion
    const price = getDisplayPrice(item);
    const itemTotal = Math.round((price * item.quantity) * 100) / 100;
    return total + itemTotal;
  }, 0);

  // Count unique items (not quantities)
  const totalItems = items.length;
  // Sum all quantities
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100, 
    totalItems,
    totalQuantity,
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
      totals: null,
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
          console.error(error)
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
            
            // Update state immediately for better UX
            const { items, generateCartItemKey } = get();
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
            get().calculateSummary();
            
            // Then sync with backend
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
            
            // Reload cart to get updated totals/currency but don't trigger re-renders
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
          // If backend call fails, reload cart to revert optimistic update
          if (isLoggedIn) {
            await get().loadCart();
          }
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
          const { items } = get();
          const summary = calculateCartSummary(items);
          set({ summary, totals: null });
          return;
        }

        try {
          const response = await cartService.getCart();
          
          if (response.success && response.cart) {
            const cartItems: CartItem[] = response.cart.map((item: any) => ({
              product: {
                _id: item.productId,
                name: item.name,
                images: item.images,
              },
              quantity: item.quantity,
              selectedVariant: item.variantId && item.optionId ? {
                variantId: item.variantId,
                optionId: item.optionId,
                variantName: item.variantDetails?.variantName || item.variantName || '',
                optionValue: item.variantDetails?.optionValue || item.optionValue || '',
                price: item.price
              } : undefined,
              addedAt: item.addedAt,
              priceInfo: item.priceInfo
            }));
            
            set({ items: cartItems });
            get().calculateSummary();
            
            // Store totals from backend if available
            if (response.totals) {
              set({
                totals: {
                  subtotal: response.totals.subtotal,
                  tax: 0,
                  shipping: 0,
                  total: response.totals.subtotal,
                  currency: response.totals.currency,
                  currencySymbol: response.totals.currencySymbol
                }
              });
            }
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load cart' });
        }
      },

      syncCartOnLogin: async () => {
        const { items } = get();
        
        set({ isLoading: true, error: null });

        try {
          if (items.length > 0) {
            // Merge local cart items with backend cart
            // mergeCart sends originalPrice/originalCurrency (not stale priceInfo)
            // so backend can recalculate displayPrice with current exchange rates
            await cartService.mergeCart(items);
            // Clear local items after successful merge to remove any stale offline priceInfo
            // This ensures we don't accidentally use outdated price conversions
            set({ items: [] });
          }
          // Load cart from backend - this fetches fresh priceInfo calculated by backend
          // After this call, all items will have backend-calculated priceInfo.displayPrice
          // which is the single source of truth for price display (Property 9)
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