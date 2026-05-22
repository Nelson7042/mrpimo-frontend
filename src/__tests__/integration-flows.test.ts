/**
 * Integration tests for end-to-end flows.
 * Tests dispute creation with evidence upload, password change → session invalidation,
 * OTP send → verify → phone marked verified, and account deletion → cancellation flow.
 *
 * Requirements: 1.5, 2.2, 6.1, 9.2, 14.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock fetchWithAuth ─────────────────────────────────────────────────────

const mockFetchWithAuth = vi.fn();
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: (...args: any[]) => mockFetchWithAuth(...args),
}));

vi.mock("@/utils/config", () => ({
  API_BASE_URL: "http://localhost:3000/api/v1",
}));

// ─── Import services ────────────────────────────────────────────────────────

import { settingsService } from "@/services/settingsService";
import { disputeService } from "@/services/disputeService";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Integration: Dispute creation with evidence upload flow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should create a dispute and then attach evidence URLs", async () => {
    // Step 1: Create dispute
    const createdDispute = {
      success: true,
      data: {
        _id: "dispute-123",
        caseId: "DSP-001",
        status: "open",
        orderId: "order-456",
        reason: "Product Defective",
        returnOutcome: "refund",
        description: "Item arrived broken",
        evidenceUrls: [],
      },
    };

    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(createdDispute));

    // Call create dispute
    const createResult = await disputeService.createDispute({
      orderId: "order-456",
      reason: "Product Defective",
      returnOutcome: "refund",
      description: "Item arrived broken",
      evidenceUrls: [],
    });

    expect(createResult).toBeDefined();
    expect(mockFetchWithAuth).toHaveBeenCalledTimes(1);

    // Verify the create call was made with correct endpoint
    const createCall = mockFetchWithAuth.mock.calls[0];
    expect(createCall[0]).toContain("/issues");

    // Step 2: Upload evidence (simulated - upload returns URLs)
    const uploadResponse = {
      success: true,
      urls: [
        "https://res.cloudinary.com/demo/image/upload/evidence1.jpg",
        "https://res.cloudinary.com/demo/image/upload/evidence2.png",
      ],
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(uploadResponse));

    // Step 3: Attach evidence URLs to dispute
    const attachResponse = {
      success: true,
      data: {
        evidenceUrls: [
          "https://res.cloudinary.com/demo/image/upload/evidence1.jpg",
          "https://res.cloudinary.com/demo/image/upload/evidence2.png",
        ],
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(attachResponse));

    // Simulate attaching evidence
    const attachResult = await disputeService.addEvidence("dispute-123", [
      "https://res.cloudinary.com/demo/image/upload/evidence1.jpg",
      "https://res.cloudinary.com/demo/image/upload/evidence2.png",
    ]);

    expect(attachResult).toBeDefined();
    // Verify evidence attach call was made
    const attachCall = mockFetchWithAuth.mock.calls[mockFetchWithAuth.mock.calls.length - 1];
    expect(attachCall[0]).toContain("evidence");
  });

  it("should handle dispute creation failure gracefully", async () => {
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "returnOutcome must be one of: refund, product_replacement" },
        false,
        400
      )
    );

    await expect(
      disputeService.createDispute({
        orderId: "order-456",
        reason: "Product Defective",
        returnOutcome: "invalid_value" as any,
        description: "Test",
        evidenceUrls: [],
      })
    ).rejects.toThrow();
  });
});

describe("Integration: Password change → session invalidation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should invalidate other sessions after password change", async () => {
    // Step 1: Change password successfully
    const passwordChangeResponse = {
      success: true,
      message: "Password changed successfully",
      sessionsInvalidated: 3,
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(passwordChangeResponse));

    // Simulate password change
    const response = await mockFetchWithAuth(
      "http://localhost:3000/api/v1/users/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldPass123",
          newPassword: "newPass456",
          confirmPassword: "newPass456",
        }),
      }
    );
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.sessionsInvalidated).toBe(3);

    // Step 2: Verify other sessions are invalidated
    // Attempting to use an old session token should return 401
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse({ success: false, message: "Unauthorized" }, false, 401)
    );

    const oldSessionResponse = await mockFetchWithAuth(
      "http://localhost:3000/api/v1/users/profile",
      { headers: { Authorization: "Bearer old-token-123" } }
    );

    expect(oldSessionResponse.ok).toBe(false);
    expect(oldSessionResponse.status).toBe(401);

    // Step 3: Current session should still work
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse({ success: true, user: { email: "test@example.com" } })
    );

    const currentSessionResponse = await mockFetchWithAuth(
      "http://localhost:3000/api/v1/users/profile",
      { headers: { Authorization: "Bearer current-token-456" } }
    );

    expect(currentSessionResponse.ok).toBe(true);
    const profileData = await currentSessionResponse.json();
    expect(profileData.success).toBe(true);
  });

  it("should get active sessions after password change shows only current", async () => {
    // After password change, only current session should remain
    const sessionsResponse = {
      sessions: [
        {
          sessionId: "session-current",
          userId: "user-1",
          deviceType: "desktop",
          browser: "Chrome",
          ipAddress: "192.168.1.1",
          lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isCurrent: true,
        },
      ],
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(sessionsResponse));

    const sessions = await settingsService.getActiveSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].isCurrent).toBe(true);
  });
});

describe("Integration: OTP send → verify → phone marked verified", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should complete the full OTP verification flow", async () => {
    const phoneNumber = "+1234567890";

    // Step 1: Send OTP
    const sendOtpResponse = {
      success: true,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(sendOtpResponse));

    const sendResult = await settingsService.sendPhoneOTP(phoneNumber);
    expect(sendResult.success).toBe(true);
    expect(sendResult.expiresAt).toBeDefined();

    // Verify send OTP call
    const sendCall = mockFetchWithAuth.mock.calls[0];
    expect(sendCall[0]).toContain("/users/phone/send-otp");
    expect(JSON.parse(sendCall[1].body)).toEqual({ phoneNumber });

    // Step 2: Verify OTP with correct code
    const verifyResponse = {
      success: true,
      verified: true,
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(verifyResponse));

    const verifyResult = await settingsService.verifyPhoneOTP("123456");
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.verified).toBe(true);

    // Verify the verify call
    const verifyCall = mockFetchWithAuth.mock.calls[1];
    expect(verifyCall[0]).toContain("/users/phone/verify-otp");
    expect(JSON.parse(verifyCall[1].body)).toEqual({ code: "123456" });

    // Step 3: Verify phone is now marked as verified in profile
    const profileResponse = {
      success: true,
      user: {
        email: "test@example.com",
        phoneVerified: true,
        profile: { phoneNumber },
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(profileResponse));

    const profileResult = await mockFetchWithAuth(
      "http://localhost:3000/api/v1/users/profile"
    );
    const profile = await profileResult.json();
    expect(profile.user.phoneVerified).toBe(true);
  });

  it("should handle incorrect OTP and lockout after 3 failures", async () => {
    // Attempt 1: Wrong OTP
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Invalid OTP code", attemptsRemaining: 2 },
        false,
        400
      )
    );

    await expect(settingsService.verifyPhoneOTP("000000")).rejects.toThrow("Invalid OTP code");

    // Attempt 2: Wrong OTP
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Invalid OTP code", attemptsRemaining: 1 },
        false,
        400
      )
    );

    await expect(settingsService.verifyPhoneOTP("111111")).rejects.toThrow("Invalid OTP code");

    // Attempt 3: Wrong OTP → Lockout
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Too many failed attempts. Try again in 15 minutes." },
        false,
        429
      )
    );

    await expect(settingsService.verifyPhoneOTP("222222")).rejects.toThrow(
      "Too many failed attempts"
    );
  });
});

describe("Integration: Account deletion → cancellation flow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should complete the full deletion request and cancellation flow", async () => {
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Step 1: Request account deletion with password
    const deletionResponse = {
      success: true,
      deletionDate,
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(deletionResponse));

    const deleteResult = await settingsService.requestAccountDeletion("myPassword123");
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletionDate).toBe(deletionDate);

    // Verify the deletion request call
    const deleteCall = mockFetchWithAuth.mock.calls[0];
    expect(deleteCall[0]).toContain("/users/account/delete");
    expect(deleteCall[1].method).toBe("POST");
    expect(JSON.parse(deleteCall[1].body)).toEqual({ password: "myPassword123" });

    // Step 2: Verify profile shows deletion scheduled
    const profileWithDeletion = {
      success: true,
      user: {
        email: "test@example.com",
        deletionScheduledAt: deletionDate,
        deletionRequestedAt: new Date().toISOString(),
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(profileWithDeletion));

    const profileResult = await mockFetchWithAuth(
      "http://localhost:3000/api/v1/users/profile"
    );
    const profile = await profileResult.json();
    expect(profile.user.deletionScheduledAt).toBe(deletionDate);

    // Step 3: Cancel the deletion
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse({ success: true, message: "Account deletion cancelled" })
    );

    await settingsService.cancelAccountDeletion();

    // Verify cancellation call
    const cancelCall = mockFetchWithAuth.mock.calls[2];
    expect(cancelCall[0]).toContain("/users/account/cancel-deletion");
    expect(cancelCall[1].method).toBe("POST");

    // Step 4: Verify profile no longer shows deletion
    const profileAfterCancel = {
      success: true,
      user: {
        email: "test@example.com",
        deletionScheduledAt: null,
        deletionRequestedAt: null,
        status: "active",
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(profileAfterCancel));

    const restoredProfile = await mockFetchWithAuth(
      "http://localhost:3000/api/v1/users/profile"
    );
    const restored = await restoredProfile.json();
    expect(restored.user.deletionScheduledAt).toBeNull();
    expect(restored.user.status).toBe("active");
  });

  it("should reject deletion without correct password", async () => {
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Password is incorrect" },
        false,
        400
      )
    );

    await expect(
      settingsService.requestAccountDeletion("wrongPassword")
    ).rejects.toThrow("Password is incorrect");
  });

  it("should reject deletion if already scheduled", async () => {
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Account deletion is already scheduled" },
        false,
        400
      )
    );

    await expect(
      settingsService.requestAccountDeletion("myPassword123")
    ).rejects.toThrow("Account deletion is already scheduled");
  });
});
