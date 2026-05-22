import { API_BASE_URL } from '@/utils/config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

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

// ─── Types ───

export interface Session {
  sessionId: string;
  userId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface LoginEvent {
  _id: string;
  userId: string;
  timestamp: string;
  deviceType: string;
  browser: string;
  ipAddress: string;
  location?: { city: string; country: string };
  isNewDevice: boolean;
  isUnusualLocation: boolean;
  success: boolean;
}

export interface SecurityEvent {
  _id: string;
  userId: string;
  eventType: 'password_change' | 'email_change' | 'login_success' | 'login_failure' | 'session_terminated' | 'account_deletion_request' | 'account_deletion_cancelled';
  ipAddress: string;
  deviceType: string;
  browser: string;
  location?: { city: string; country: string };
  outcome: 'success' | 'failure';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  events: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ExportStatus {
  status: 'pending' | 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
  requestedAt?: string;
  completedAt?: string;
  expiresAt?: string;
}

// ─── Settings Service ───

export const settingsService = {
  /**
   * Get all active sessions for the authenticated user.
   */
  async getActiveSessions(): Promise<Session[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/sessions`);
    const data = await handleApiResponse<{ sessions: Session[] }>(response, 'Failed to fetch sessions');
    return data.sessions;
  },

  /**
   * Terminate a specific session by ID.
   */
  async terminateSession(sessionId: string): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    await handleApiResponse(response, 'Failed to terminate session');
  },

  /**
   * Get paginated login history for the authenticated user.
   */
  async getLoginHistory(page: number = 1): Promise<PaginatedResponse<LoginEvent>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/login-history?page=${page}`);
    return handleApiResponse<PaginatedResponse<LoginEvent>>(response, 'Failed to fetch login history');
  },

  /**
   * Send OTP to the provided phone number for verification.
   */
  async sendPhoneOTP(phoneNumber: string): Promise<{ success: boolean; expiresAt: string }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/phone/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    return handleApiResponse<{ success: boolean; expiresAt: string }>(response, 'Failed to send OTP');
  },

  /**
   * Verify the OTP code for phone number verification.
   */
  async verifyPhoneOTP(code: string): Promise<{ success: boolean; verified: boolean }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/phone/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return handleApiResponse<{ success: boolean; verified: boolean }>(response, 'Failed to verify OTP');
  },

  /**
   * Get paginated security events for the authenticated user.
   */
  async getSecurityEvents(page: number = 1): Promise<PaginatedResponse<SecurityEvent>> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/security-events?page=${page}`);
    return handleApiResponse<PaginatedResponse<SecurityEvent>>(response, 'Failed to fetch security events');
  },

  /**
   * Request account deletion with password confirmation.
   */
  async requestAccountDeletion(password: string): Promise<{ success: boolean; deletionDate: string }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/account/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleApiResponse<{ success: boolean; deletionDate: string }>(response, 'Failed to request account deletion');
  },

  /**
   * Cancel a pending account deletion.
   */
  async cancelAccountDeletion(): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/account/cancel-deletion`, {
      method: 'POST',
    });
    await handleApiResponse(response, 'Failed to cancel account deletion');
  },

  /**
   * Request a data export for the authenticated user.
   */
  async requestDataExport(): Promise<{ exportId: string; estimatedTime: number }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/data-export`, {
      method: 'POST',
    });
    return handleApiResponse<{ exportId: string; estimatedTime: number }>(response, 'Failed to request data export');
  },

  /**
   * Get the status of a specific data export.
   */
  async getExportStatus(exportId: string): Promise<ExportStatus> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/data-export/${exportId}`);
    return handleApiResponse<ExportStatus>(response, 'Failed to get export status');
  },

  /**
   * Check if the user can request a new data export.
   */
  async canRequestDataExport(): Promise<{ canExport: boolean }> {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/data-export/can-export`);
    return handleApiResponse<{ canExport: boolean }>(response, 'Failed to check export availability');
  },

  /**
   * Update notification frequency preference.
   */
  async updateNotificationFrequency(
    frequency: 'real-time' | 'daily_digest',
    digestTime?: string
  ): Promise<{ frequency: string; digestTime: string }> {
    const body: Record<string, string> = { frequency };
    if (digestTime) body.digestTime = digestTime;

    const response = await fetchWithAuth(`${API_BASE_URL}/users/notifications/frequency`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await handleApiResponse<{ data: { frequency: string; digestTime: string } }>(
      response,
      'Failed to update notification frequency'
    );
    return data.data;
  },
};
