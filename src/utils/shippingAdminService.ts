import { API_BASE_URL } from './config';
import { fetchWithAuth } from './fetchWithAuth';

/**
 * Helper function to extract error from response and throw with proper message
 */
async function handleApiResponse<T>(response: Response, defaultErrorMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || errorData.error || defaultErrorMessage);
    throw error;
  }
  return response.json();
}

export interface ShippingOrderItem {
  productName: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  fulfillmentMethod: string;
  handoffStatus: 'pending' | 'vendor_claimed' | 'confirmed' | 'rejected';
}

export interface ShippingShipment {
  _id: string;
  vendorId: string;
  vendorName: string;
  items: ShippingOrderItem[];
  shipping: {
    status: string;
    fulfillmentMethod?: string;
    waybill?: string;
    tempCode?: string;
    trackingNumber?: string;
  };
  fulfillmentDeadline?: string;
}

export interface ShippingOrder {
  _id: string;
  orderNumber?: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: string;
  shipments: ShippingShipment[];
  createdAt: string;
  totalAmount?: number;
  currency?: string;
  metadata?: {
    isBidCheckout?: boolean;
    bidId?: string;
    auctionEndTime?: string;
  };
}

export interface ShippingOrdersResponse {
  orders: ShippingOrder[];
  summary: {
    pendingHandoff: number;
    awaitingConfirmation: number;
    inTransit: number;
  };
  total: number;
  page: number;
  limit: number;
}

export interface ShippingOrdersFilters {
  startDate?: string;
  endDate?: string;
  vendor?: string;
  shipmentStatus?: string;
  fulfillmentMethod?: string;
  page?: number;
  limit?: number;
}

export interface ConfirmHandoffParams {
  orderId: string;
  shipmentId: string;
  itemIndex: number;
  notes?: string;
}

export interface RejectHandoffParams {
  orderId: string;
  shipmentId: string;
  itemIndex: number;
  notes?: string;
}

export interface MarkDeliveredParams {
  orderId: string;
  shipmentId: string;
  notes?: string;
}

export interface OverrideStatusParams {
  orderId: string;
  shipmentId: string;
  status: string;
  notes?: string;
}

export interface HandoffActionResponse {
  message: string;
  handoffStatus: string;
}

export interface MarkDeliveredResponse {
  message: string;
  status: string;
}

export interface OverrideStatusResponse {
  message: string;
  previousStatus: string;
  newStatus: string;
}

export interface AuditLogEntry {
  action: string;
  performedBy: string;
  metadata: {
    shipmentId: string;
    itemIndex?: number;
    previousStatus: string;
    newStatus: string;
    notes?: string;
  };
  timestamp: string;
}

export const shippingAdminService = {
  async getOrders(filters: ShippingOrdersFilters = {}): Promise<ShippingOrdersResponse> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.shipmentStatus) params.append('shipmentStatus', filters.shipmentStatus);
    if (filters.fulfillmentMethod) params.append('fulfillmentMethod', filters.fulfillmentMethod);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin/shipping/orders${queryString ? `?${queryString}` : ''}`;

    const response = await fetchWithAuth(url);
    return handleApiResponse<ShippingOrdersResponse>(response, 'Failed to fetch shipping orders');
  },

  async confirmHandoff(params: ConfirmHandoffParams): Promise<HandoffActionResponse> {
    const { orderId, shipmentId, itemIndex, notes } = params;
    const url = `${API_BASE_URL}/admin/shipping/orders/${orderId}/shipments/${shipmentId}/items/${itemIndex}/confirm-handoff`;

    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return handleApiResponse<HandoffActionResponse>(response, 'Failed to confirm handoff');
  },

  async rejectHandoff(params: RejectHandoffParams): Promise<HandoffActionResponse> {
    const { orderId, shipmentId, itemIndex, notes } = params;
    const url = `${API_BASE_URL}/admin/shipping/orders/${orderId}/shipments/${shipmentId}/items/${itemIndex}/reject-handoff`;

    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return handleApiResponse<HandoffActionResponse>(response, 'Failed to reject handoff');
  },

  async markDelivered(params: MarkDeliveredParams): Promise<MarkDeliveredResponse> {
    const { orderId, shipmentId, notes } = params;
    const url = `${API_BASE_URL}/admin/shipping/orders/${orderId}/shipments/${shipmentId}/mark-delivered`;

    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return handleApiResponse<MarkDeliveredResponse>(response, 'Failed to mark as delivered');
  },

  async overrideStatus(params: OverrideStatusParams): Promise<OverrideStatusResponse> {
    const { orderId, shipmentId, status, notes } = params;
    const url = `${API_BASE_URL}/admin/shipping/orders/${orderId}/shipments/${shipmentId}/override-status`;

    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    return handleApiResponse<OverrideStatusResponse>(response, 'Failed to override status');
  },

  async getAuditLog(orderId: string, shipmentId: string): Promise<AuditLogEntry[]> {
    const url = `${API_BASE_URL}/admin/shipping/orders/${orderId}/shipments/${shipmentId}/audit-log`;

    const response = await fetchWithAuth(url);
    return handleApiResponse<AuditLogEntry[]>(response, 'Failed to fetch audit log');
  },
};
