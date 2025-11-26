import { fetchWithAuth } from './fetchWithAuth';

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
  async getAnalytics(vendorId: string) {
    const response = await fetchWithAuth(`http://localhost:5800/api/v1/vendor/${vendorId}/analytics`);
    return response.json();
  },

  async getOrders(vendorId: string, page = 1, limit = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    
    const response = await fetchWithAuth(`http://localhost:5800/api/v1/vendor/${vendorId}/orders?${params}`);
    return response.json();
  },

  async updateOrderStatus(orderId: string, status: string) {
    return fetchWithAuth(`http://localhost:5800/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getProducts(vendorId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return fetchWithAuth(`http://localhost:5800/api/v1/vendor/${vendorId}/products?${params}`);
  },

  async createProduct(productData: any) {
    return fetchWithAuth('http://localhost:5800/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(productId: string, productData: any) {
    return fetchWithAuth(`http://localhost:5800/api/v1/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(productId: string) {
    return fetchWithAuth(`http://localhost:5800/api/v1/products/${productId}`, {
      method: 'DELETE',
    });
  },

  async getPayouts(vendorId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return fetchWithAuth(`http://localhost:5800/api/v1/vendor-payouts/${vendorId}?${params}`);
  },

  async requestPayout(amount: number, method: string) {
    return fetchWithAuth('http://localhost:5800/api/v1/vendor-payouts/request', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  }
};