import { ProductType } from "@/types/product.type";
import { useCartStore } from "./cartStore";


// Hook for adding items to cart
export const useAddToCart = () => {
  const addToCart = useCartStore((state) => state.addToCart);
  
  return {
    addToCart: (
      product: ProductType, 
      quantity = 1,
      selectedVariant?: {
        variantId: string;
        optionId: string;
        variantName: string;
        optionValue: string;
        price: number;
        salesprice:number;
      }
    ) => {
      addToCart(product, quantity, selectedVariant);
    }
  };
};

export const useCartLength = () => {
  return useCartStore((state) => state.summary.totalItems);
};


// Hook for getting cart quantity (total quantity of all items)
export const useCartQuantity = () => {
  const cartQuantity = useCartStore((state) => state.summary.totalQuantity);
  
  return cartQuantity;
};

// Hook for removing items from cart
export const useRemoveFromCart = () => {
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  
  return {
    removeFromCart: (productId: string, variantKey?: string) => {
      removeFromCart(productId, variantKey);
    }
  };
};

// Hook for increasing item quantity
export const useIncreaseQuantity = () => {
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  
  return {
    increaseQuantity: (productId: string, variantKey?: string) => {
      increaseQuantity(productId, variantKey);
    }
  };
};

// Hook for decreasing item quantity
export const useDecreaseQuantity = () => {
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  
  return {
    decreaseQuantity: (productId: string, variantKey?: string) => {
      decreaseQuantity(productId, variantKey);
    }
  };
};

// Hook for updating item quantity directly
export const useUpdateQuantity = () => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  return {
    updateQuantity: (productId: string, quantity: number, variantKey?: string) => {
      updateQuantity(productId, quantity, variantKey);
    }
  };
};

// Hook for getting specific item quantity
export const useItemQuantity = (productId: string, variantKey?: string) => {
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  
  return getItemQuantity(productId, variantKey);
};

// Hook for checking if item is in cart
export const useIsInCart = (productId: string, variantKey?: string) => {
  const isInCart = useCartStore((state) => state.isInCart);
  
  return isInCart(productId, variantKey);
};

// Hook for getting cart items
export const useCartItems = () => {
  const items = useCartStore((state) => state.items);
  
  return items;
};

// Hook for getting cart summary
export const useCartSummary = () => {
  const summary = useCartStore((state) => state.summary);
  
  return summary;
};

// Hook for clearing cart
export const useClearCart = () => {
const clearCart: () => void = useCartStore((state) => state.clearCart);
  
  return {
    clearCart: () => {
      clearCart();
    }
  };
};

// Hook for getting a specific cart item
export const useCartItem = (productId: string, variantKey?: string) => {
  const getCartItem = useCartStore((state) => state.getCartItem);
  
  return getCartItem(productId, variantKey);
};

// Comprehensive cart hook that provides all cart functionality
export const useCart = () => {
  const store = useCartStore();
  
  return {
    // State
    items: store.items,
    summary: store.summary,
    
    // Actions
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    increaseQuantity: store.increaseQuantity,
    decreaseQuantity: store.decreaseQuantity,
    clearCart: store.clearCart,
    
    // Getters
    getCartLength: store.getCartLength,
    getCartQuantity: store.getCartQuantity,
    getItemQuantity: store.getItemQuantity,
    isInCart: store.isInCart,
    getCartItem: store.getCartItem,
  };
};


// God make it work