import { API_BASE_URL } from './config';
import { fetchWithAuth } from './fetchWithAuth';

/**
 * Interface for API error with field-specific errors
 */
interface ApiError extends Error {
  fieldErrors?: Record<string, string>;
  code?: string;
}

/**
 * Helper function to extract error from response and throw with proper message
 */
async function handleApiResponse<T>(response: Response, defaultErrorMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || errorData.error || defaultErrorMessage) as ApiError;
    error.fieldErrors = errorData.errors || errorData.details;
    error.code = errorData.code;
    throw error;
  }
  return response.json();
}

export interface VendorAnalytics {
  dashboard: {
    salesTotal: {
      value: number;
      currency: string;
      percentageChange: number;
    };
    totalOrders: {
      value: number;
      percentageChange: number;
    };
    totalProducts: {
      value: number;
      percentageChange: number;
    };
    totalCustomers: {
      value: number;
      percentageChange: number;
    };
  };
  salesOverview: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface VendorOrder {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    productId: {
      _id: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  status: string;
  createdAt: string;
  shipping: {
    trackingNumber: string;
    status: string;
  };
}

export const vendorService = {
  async getAnalytics(vendorId: string, range = "7days") {
    const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/vendors/${vendorId}/analytics?range=${range}`);
    return handleApiResponse(response, 'Failed to fetch vendor analytics');
  },

  async getOrders(vendorId: string, page = 1, limit = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    
    const response = await fetchWithAuth(`${API_BASE_URL}/vendor/${vendorId}/orders?${params}`);
    return handleApiResponse(response, 'Failed to fetch vendor orders');
  },

  async updateOrderStatus(orderId: string, status: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleApiResponse(response, 'Failed to update order status');
  },

  async getProducts(vendorId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await fetchWithAuth(`${API_BASE_URL}/vendor/${vendorId}/products?${params}`);
    return handleApiResponse(response, 'Failed to fetch vendor products');
  },

  async createProduct(productData: any) {
    const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return handleApiResponse(response, 'Failed to create product');
  },

  async updateProduct(productId: string, productData: any) {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return handleApiResponse(response, 'Failed to update product');
  },

  async deleteProduct(productId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
    });
    return handleApiResponse(response, 'Failed to delete product');
  },

  async getPayouts(vendorId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await fetchWithAuth(`${API_BASE_URL}/vendor-payouts/${vendorId}?${params}`);
    return handleApiResponse(response, 'Failed to fetch vendor payouts');
  },

  async requestPayout(amount: number, method: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/vendor-payouts/request`, {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
    return handleApiResponse(response, 'Failed to request payout');
  }
};