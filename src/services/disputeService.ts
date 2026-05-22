import { API_BASE_URL } from '@/utils/config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import axios from 'axios';

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

// ─── Buyer Methods ───

export const disputeService = {
  /**
   * Create a new dispute (buyer).
   */
  async createDispute(body: {
    orderId: string;
    reason: string;
    description?: string;
    evidenceUrls?: string[];
    returnOutcome: string;
  }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return handleApiResponse(response, 'Failed to create dispute');
  },

  /**
   * Get the authenticated buyer's disputes with optional status filter and pagination.
   */
  async getMyDisputes(params: { status?: string; priority?: string; reason?: string; page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.reason) searchParams.set('reason', params.reason);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = `${API_BASE_URL}/issues${query ? `?${query}` : ''}`;
    const response = await fetchWithAuth(url);
    return handleApiResponse(response, 'Failed to fetch disputes');
  },

  /**
   * Get full detail for a single dispute by ID.
   */
  async getDisputeDetail(issueId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/admin/${issueId}`);
    return handleApiResponse(response, 'Failed to fetch dispute detail');
  },

  /**
   * Add evidence (image/video URLs) to an existing dispute.
   */
  async addEvidence(issueId: string, evidenceUrls: string[]) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/${issueId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidenceUrls }),
    });
    return handleApiResponse(response, 'Failed to add evidence');
  },

  // ─── Vendor Methods ───

  /**
   * Get disputes related to the authenticated vendor's orders.
   */
  async getVendorDisputes(params: { status?: string; priority?: string; reason?: string; page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.reason) searchParams.set('reason', params.reason);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = `${API_BASE_URL}/issues/vendor${query ? `?${query}` : ''}`;
    const response = await fetchWithAuth(url);
    return handleApiResponse(response, 'Failed to fetch vendor disputes');
  },

  /**
   * Submit a vendor response to a dispute.
   */
  async submitVendorResponse(issueId: string, body: { responseText: string; evidenceUrls?: string[] }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/${issueId}/vendor-response`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return handleApiResponse(response, 'Failed to submit vendor response');
  },

  /**
   * Update an existing vendor response (edit text and/or evidence URLs).
   */
  async updateVendorResponse(issueId: string, body: { responseText?: string; evidenceUrls?: string[] }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/${issueId}/vendor-response`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return handleApiResponse(response, 'Failed to update vendor response');
  },

  /**
   * Get aggregate dispute metrics for the authenticated vendor.
   */
  async getVendorMetrics() {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/vendor/metrics`);
    return handleApiResponse(response, 'Failed to fetch vendor dispute metrics');
  },

  // ─── Admin Methods ───

  /**
   * Get all disputes platform-wide with filters and pagination (admin only).
   */
  async getAllDisputes(params: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.assignedTo) searchParams.set('assignedTo', params.assignedTo);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = `${API_BASE_URL}/issues/admin/all${query ? `?${query}` : ''}`;
    const response = await fetchWithAuth(url);
    return handleApiResponse(response, 'Failed to fetch all disputes');
  },

  /**
   * Get full detail for a single dispute by ID (admin endpoint with populated data).
   */
  async getAdminDisputeDetail(issueId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/admin/${issueId}`);
    return handleApiResponse(response, 'Failed to fetch dispute detail');
  },

  /**
   * Assign a dispute to an admin user.
   */
  async assignDispute(issueId: string, adminId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/admin/${issueId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ adminId }),
    });
    return handleApiResponse(response, 'Failed to assign dispute');
  },

  /**
   * Update the priority of a dispute.
   */
  async updatePriority(issueId: string, priority: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/admin/${issueId}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
    return handleApiResponse(response, 'Failed to update dispute priority');
  },

  /**
   * Resolve a dispute with a specific outcome.
   */
  async resolveDispute(issueId: string, body: {
    resolutionOutcome: string;
    resolutionDescription: string;
    partialRefundAmount?: number;
  }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/admin/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return handleApiResponse(response, 'Failed to resolve dispute');
  },

  /**
   * Get aggregate dispute metrics (admin only).
   */
  async getDisputeMetrics() {
    const response = await fetchWithAuth(`${API_BASE_URL}/issues/admin/metrics`);
    return handleApiResponse(response, 'Failed to fetch dispute metrics');
  },

  /**
   * Upload a single evidence file to Cloudinary via the backend.
   * Returns the uploaded file URL.
   */
  async uploadEvidenceFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('evidence', file);

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await axios.post(`${API_BASE_URL}/issues/upload`, formData, {
      timeout: 120000,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      withCredentials: true,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    if (response.data?.success && response.data?.url) {
      return { url: response.data.url };
    }
    if (response.data?.success && response.data?.imageUrl) {
      return { url: response.data.imageUrl };
    }
    throw new Error(response.data?.message || 'Failed to upload evidence file');
  },
};
