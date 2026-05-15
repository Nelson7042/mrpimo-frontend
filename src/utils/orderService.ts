import { API_BASE_URL } from './config';
import { fetchWithAuth } from './fetchWithAuth';

export interface Order {
  _id: string;
  userId: string;
  items: Array<{
    productId: {
      _id: string;
      name: string;
      images: string[];
      price: number;
    };
    quantity: number;
    price: number;
    variantId?: string;
  }>;
  
  status: 'pending' | 'pending_payment' | 'payment_failed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'refunded';
  shipping: {
    address: any;
    carrier: string;
    trackingNumber: string;
    status: string;
    estimatedDelivery: string;
  };
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  async getUserOrders(page = 1, limit = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/user?${params}`);
    const data = await response.json();
    return data
  },

  async getOrderById(orderId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order');
    }
    return data;
  },

  async trackOrder(trackingNumber: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/track/${trackingNumber}`);
    return response.json();
  },

  async cancelOrder(orderId: string, reason?: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },

  async requestRefund(orderId: string, reason: string, amount?: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/refunds/request`, {
      method: 'POST',
      body: JSON.stringify({ orderId, reason, amount }),
    });
    return response.json();
  }
};