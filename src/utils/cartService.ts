import { API_BASE_URL } from './config';
import { fetchWithAuth } from './fetchWithAuth';

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
  price?: number;
  variantId?: string;
  optionId?: string;
  name?: string;
  images?: string[];
  variantName?: string;
  optionValue?: string;
  priceInfo?: {
    currencySymbol: string;
    displayCurrency: string;
    displayPrice: number;
    exchangeRate: number;
    originalPrice: number;
    originalCurrency: string;
  };
}

export interface OfflineCartItem {
  productId: string;
  optionId: string;
  quantity: number;
  price: number;
  name: string;
  images: string[];
  variantId?: string;
  variantName?: string;
  optionValue?: string;
  addedAt: string;
  priceInfo?: {
    currencySymbol: string;
    displayCurrency: string;
    displayPrice: number;
    exchangeRate: number;
    originalPrice: number;
    originalCurrency: string;
  };
}

const OFFLINE_CART_KEY = 'mprimo-offline-cart';

const offlineCartStorage = {
  get(): OfflineCartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(OFFLINE_CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  
  set(items: OfflineCartItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OFFLINE_CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save offline cart:', error);
    }
  },
  
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OFFLINE_CART_KEY);
  }
};


export interface UpdateCartRequest {
  productId: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart?: any[];
  data?: {
    items: any[];
    summary: {
      itemsCount: number;
      totalValue: number;
    };
  };
}

// const BASE_URL = 'http://localhost:5800/api/v1';

export const cartService = {
  async getCart(): Promise<CartResponse> {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart/user`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  

  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/products/cart`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add to cart');
      }
      
      return response.json();
    } catch (error) {
      // Save to offline storage if request fails
      if (data.optionId && data.name && data.price) {
        const offlineItem: OfflineCartItem = {
          productId: data.productId,
          optionId: data.optionId,
          quantity: data.quantity || 1,
          price: data.price,
          name: data.name,
          images: data.images || [],
          variantId: data.variantId,
          variantName: data.variantName,
          optionValue: data.optionValue,
          addedAt: new Date().toISOString(),
          priceInfo: data.priceInfo
        };
        
        const offlineCart = offlineCartStorage.get();
        const existingIndex = offlineCart.findIndex(
          item => item.productId === data.productId && item.optionId === data.optionId
        );
        
        if (existingIndex > -1) {
          offlineCart[existingIndex].quantity += data.quantity || 1;
        } else {
          offlineCart.push(offlineItem);
        }
        
        offlineCartStorage.set(offlineCart);
      }
      
      throw error;
    }
  },

  async updateCartItem(productId: string, data: UpdateCartRequest): Promise<CartResponse> {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async clearCart(): Promise<CartResponse> {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart/clear`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async getCartSummary(): Promise<{ success: boolean; data: { itemsCount: number; totalValue: number } }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart-summary`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cart summary: ${response.status}`);
    }
    return response.json();
  },

  async syncCart(items: any[]): Promise<CartResponse> {
    // Sync multiple items to backend when user logs in
    for (const item of items) {
      await this.addToCart({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.selectedVariant?.price,
        variantId: item.selectedVariant?.variantId,
        optionId: item.selectedVariant?.optionId
      });
    }
    
    return this.getCart();
  },

  async mergeCart(items: any[]): Promise<CartResponse> {
    // Get offline cart items
    const offlineItems = offlineCartStorage.get();
    
    // Format cart items to match backend expectations
    const cart = items.map(item => ({
      productId: item.product._id,
      optionId: item.selectedVariant?.optionId,
      quantity: item.quantity,
      price: item.selectedVariant?.price || 0,
      name: item.product.name,
      images: item.product.images || [],
      priceInfo: item.priceInfo
    }));
    
    // Add offline items to cart
    const allItems = [...cart, ...offlineItems];

    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart/merge`, {
      method: 'POST',
      body: JSON.stringify({ cart: allItems })
    });
    
    // Clear offline cart after successful merge
    if (response.ok) {
      offlineCartStorage.clear();
    }
    
    return response.json();
  },
  
  getOfflineCart(): OfflineCartItem[] {
    return offlineCartStorage.get();
  },
  
  clearOfflineCart(): void {
    offlineCartStorage.clear();
  },

  async getOptionQuantity(productId: string, variantId: string, optionId: string): Promise<{ success: boolean; data?: { quantity: number } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/cart/${productId}/quantity?variantId=${variantId}&optionId=${optionId}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch option quantity: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('getOptionQuantity error:', error);
      // Return a default response to prevent crashes
      return { success: false };
    }
  },

  async deleteCartItem(productId: string, variantId: string, optionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart/${productId}/${variantId}/${optionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete cart item');
    }
    return response.json();
  },

  async addBulkToCart(items: Array<{ productId: string; quantity: number; price: number; variantId: string; optionId: string }>): Promise<any> {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/cart/bulk`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    if (!response.ok) {
      throw new Error('Failed to add items to cart');
    }
    return response.json();
  }
};