import { fetchWithAuth } from './fetchWithAuth';

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
  price?:number;
  variantId?: string;
  optionId?: string;
}


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

const BASE_URL = 'http://localhost:5800/api/v1';

export const cartService = {
  async getCart(): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart/user`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  

  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateCartItem(productId: string, data: UpdateCartRequest): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart/${productId}`, {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async clearCart(): Promise<CartResponse> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart/clear`, {
      method: 'DELETE'
    });
    return response.json();
  },

  async getCartSummary(): Promise<{ success: boolean; data: { itemsCount: number; totalValue: number } }> {
    const response = await fetchWithAuth(`${BASE_URL}/products/cart-summary`);
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
    // Format cart items to match backend expectations
    const cart = items.map(item => ({
      productId: item.product._id,
      optionId: item.selectedVariant?.optionId,
      quantity: item.quantity,
      price: item.selectedVariant?.price || 0,
      name: item.product.name,
      images: item.product.images || []
    }));

    const response = await fetchWithAuth(`${BASE_URL}/products/cart/merge`, {
      method: 'POST',
      body: JSON.stringify({ cart })
    });
    return response.json();
  }
};