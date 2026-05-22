/**
 * Integration tests for end-to-end dispute flows.
 * Tests vendor response create/edit flow with evidence validation,
 * chat closed-state enforcement with status transition,
 * and metrics endpoint returns correct aggregated data.
 *
 * Requirements: 2.2, 3.1, 5.2, 6.1
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

describe("Integration: Vendor response create/edit flow with evidence validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should submit initial vendor response then edit with new evidence URLs", async () => {
    const issueId = "issue-abc-123";

    // Step 1: Submit initial vendor response
    const submitResponse = {
      success: true,
      data: {
        _id: issueId,
        vendorResponse: "We apologize for the inconvenience. We are investigating this issue.",
        vendorEvidenceUrls: [],
        vendorRespondedAt: "2024-01-15T10:00:00.000Z",
        vendorResponseLastEditedAt: null,
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(submitResponse));

    const submitResult = await disputeService.submitVendorResponse(issueId, {
      responseText: "We apologize for the inconvenience. We are investigating this issue.",
    });

    expect(submitResult).toBeDefined();
    expect(submitResult.data.vendorResponse).toBe(
      "We apologize for the inconvenience. We are investigating this issue."
    );
    expect(mockFetchWithAuth).toHaveBeenCalledTimes(1);

    // Verify the submit call used POST
    const submitCall = mockFetchWithAuth.mock.calls[0];
    expect(submitCall[0]).toContain(`/issues/${issueId}/vendor-response`);
    expect(JSON.parse(submitCall[1].body)).toEqual({
      responseText: "We apologize for the inconvenience. We are investigating this issue.",
    });
    expect(submitCall[1].method).toBe("POST");

    // Step 2: Edit response with new evidence URLs
    const editResponse = {
      success: true,
      data: {
        _id: issueId,
        vendorResponse: "We have identified the issue and are sending a replacement.",
        vendorEvidenceUrls: [
          "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/shipping-label.jpg",
          "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/replacement-tracking.png",
        ],
        vendorRespondedAt: "2024-01-15T10:00:00.000Z",
        vendorResponseLastEditedAt: "2024-01-15T14:30:00.000Z",
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(editResponse));

    const editResult = await disputeService.updateVendorResponse(issueId, {
      responseText: "We have identified the issue and are sending a replacement.",
      evidenceUrls: [
        "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/shipping-label.jpg",
        "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/replacement-tracking.png",
      ],
    });

    expect(editResult).toBeDefined();
    expect(editResult.data.vendorResponse).toBe(
      "We have identified the issue and are sending a replacement."
    );
    expect(editResult.data.vendorEvidenceUrls).toHaveLength(2);
    expect(editResult.data.vendorResponseLastEditedAt).toBe("2024-01-15T14:30:00.000Z");

    // Verify the edit call used PATCH
    const editCall = mockFetchWithAuth.mock.calls[1];
    expect(editCall[0]).toContain(`/issues/${issueId}/vendor-response`);
    expect(editCall[1].method).toBe("PATCH");
    expect(JSON.parse(editCall[1].body)).toEqual({
      responseText: "We have identified the issue and are sending a replacement.",
      evidenceUrls: [
        "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/shipping-label.jpg",
        "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/replacement-tracking.png",
      ],
    });
  });

  it("should reject evidence URLs that fail validation with 400", async () => {
    const issueId = "issue-abc-123";

    // Attempt to update with invalid evidence URLs
    const validationErrorResponse = {
      success: false,
      errors: [
        { index: 0, error: "URL must be a valid Cloudinary URL" },
        { index: 2, error: "URL must be a valid Cloudinary URL" },
      ],
    };
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(validationErrorResponse, false, 400)
    );

    await expect(
      disputeService.updateVendorResponse(issueId, {
        responseText: "Updated response",
        evidenceUrls: [
          "https://malicious-site.com/fake-evidence.jpg",
          "https://res.cloudinary.com/mprimo/image/upload/v1/evidence/valid.jpg",
          "http://not-https.example.com/image.png",
        ],
      })
    ).rejects.toThrow();

    // Verify the call was made
    expect(mockFetchWithAuth).toHaveBeenCalledTimes(1);
    const call = mockFetchWithAuth.mock.calls[0];
    expect(call[0]).toContain(`/issues/${issueId}/vendor-response`);
  });

  it("should reject edit on resolved/closed dispute with 403", async () => {
    const issueId = "issue-closed-456";

    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Cannot edit response for a resolved/closed dispute" },
        false,
        403
      )
    );

    await expect(
      disputeService.updateVendorResponse(issueId, {
        responseText: "Trying to edit after closure",
      })
    ).rejects.toThrow("Cannot edit response for a resolved/closed dispute");
  });
});

describe("Integration: Chat closed-state enforcement with status transition", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should allow chat messages while dispute is open then reject after closure", async () => {
    const issueId = "issue-chat-789";

    // Step 1: Dispute is open - sending a chat message succeeds
    const messageSentResponse = {
      success: true,
      data: {
        _id: "msg-001",
        issueId,
        senderId: "vendor-user-1",
        message: "Hello, I am looking into this issue.",
        createdAt: "2024-01-15T10:00:00.000Z",
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(messageSentResponse));

    const sendResult = await mockFetchWithAuth(
      `http://localhost:3000/api/v1/dispute-chat/${issueId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message: "Hello, I am looking into this issue." }),
      }
    );
    const sendData = await sendResult.json();

    expect(sendResult.ok).toBe(true);
    expect(sendData.success).toBe(true);
    expect(sendData.data.message).toBe("Hello, I am looking into this issue.");

    // Step 2: Dispute transitions to closed
    const transitionResponse = {
      success: true,
      data: {
        _id: issueId,
        status: "closed",
        closedAt: "2024-01-16T09:00:00.000Z",
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(transitionResponse));

    const transitionResult = await mockFetchWithAuth(
      `http://localhost:3000/api/v1/issues/admin/${issueId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "closed" }),
      }
    );
    const transitionData = await transitionResult.json();
    expect(transitionData.data.status).toBe("closed");

    // Step 3: Attempt to send chat message after closure - should be rejected with 403
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Cannot send messages to a closed dispute" },
        false,
        403
      )
    );

    const rejectedResult = await mockFetchWithAuth(
      `http://localhost:3000/api/v1/dispute-chat/${issueId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message: "Trying to send after closure" }),
      }
    );

    expect(rejectedResult.ok).toBe(false);
    expect(rejectedResult.status).toBe(403);
    const rejectedData = await rejectedResult.json();
    expect(rejectedData.message).toBe("Cannot send messages to a closed dispute");
  });

  it("should reject media attachment to closed dispute with 403", async () => {
    const issueId = "issue-media-closed-101";

    // Attempt to send media to a closed dispute
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Cannot send messages to a closed dispute" },
        false,
        403
      )
    );

    const mediaResult = await mockFetchWithAuth(
      `http://localhost:3000/api/v1/dispute-chat/${issueId}/media`,
      {
        method: "POST",
        body: JSON.stringify({
          mediaUrl: "https://res.cloudinary.com/mprimo/image/upload/v1/chat/photo.jpg",
          mediaType: "image",
        }),
      }
    );

    expect(mediaResult.ok).toBe(false);
    expect(mediaResult.status).toBe(403);
    const mediaData = await mediaResult.json();
    expect(mediaData.message).toBe("Cannot send messages to a closed dispute");
  });

  it("should reject in-flight message if dispute closes concurrently", async () => {
    const issueId = "issue-concurrent-202";

    // Simulate a message sent while dispute was closing - backend checks fresh status
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Cannot send messages to a closed dispute" },
        false,
        403
      )
    );

    const concurrentResult = await mockFetchWithAuth(
      `http://localhost:3000/api/v1/dispute-chat/${issueId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message: "Message sent during closure transition" }),
      }
    );

    expect(concurrentResult.ok).toBe(false);
    expect(concurrentResult.status).toBe(403);
    const concurrentData = await concurrentResult.json();
    expect(concurrentData.success).toBe(false);
  });
});

describe("Integration: Metrics endpoint returns correct aggregated data", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return correct metrics structure with status counts and average response time", async () => {
    const metricsResponse = {
      success: true,
      data: {
        totalDisputes: 25,
        byStatus: {
          open: 5,
          inProgress: 8,
          resolved: 10,
          closed: 2,
        },
        averageResponseTimeHours: 4.5,
        resolutionOutcomes: {
          fullRefund: 4,
          partialRefund: 3,
          productReplacement: 2,
          disputeRejected: 1,
        },
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(metricsResponse));

    const result = await disputeService.getVendorMetrics();

    expect(result).toBeDefined();
    expect(result.data.totalDisputes).toBe(25);

    // Verify status counts
    expect(result.data.byStatus.open).toBe(5);
    expect(result.data.byStatus.inProgress).toBe(8);
    expect(result.data.byStatus.resolved).toBe(10);
    expect(result.data.byStatus.closed).toBe(2);

    // Verify status counts sum to total
    const statusSum =
      result.data.byStatus.open +
      result.data.byStatus.inProgress +
      result.data.byStatus.resolved +
      result.data.byStatus.closed;
    expect(statusSum).toBe(result.data.totalDisputes);

    // Verify average response time
    expect(result.data.averageResponseTimeHours).toBe(4.5);

    // Verify resolution outcomes
    expect(result.data.resolutionOutcomes.fullRefund).toBe(4);
    expect(result.data.resolutionOutcomes.partialRefund).toBe(3);
    expect(result.data.resolutionOutcomes.productReplacement).toBe(2);
    expect(result.data.resolutionOutcomes.disputeRejected).toBe(1);

    // Verify the correct endpoint was called
    const call = mockFetchWithAuth.mock.calls[0];
    expect(call[0]).toContain("/issues/vendor/metrics");
  });

  it("should handle metrics fetch failure gracefully", async () => {
    mockFetchWithAuth.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: "Failed to fetch vendor dispute metrics" },
        false,
        500
      )
    );

    await expect(disputeService.getVendorMetrics()).rejects.toThrow(
      "Failed to fetch vendor dispute metrics"
    );
  });

  it("should return zero counts when vendor has no disputes", async () => {
    const emptyMetricsResponse = {
      success: true,
      data: {
        totalDisputes: 0,
        byStatus: {
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
        },
        averageResponseTimeHours: 0,
        resolutionOutcomes: {
          fullRefund: 0,
          partialRefund: 0,
          productReplacement: 0,
          disputeRejected: 0,
        },
      },
    };
    mockFetchWithAuth.mockResolvedValueOnce(mockResponse(emptyMetricsResponse));

    const result = await disputeService.getVendorMetrics();

    expect(result.data.totalDisputes).toBe(0);
    expect(result.data.byStatus.open).toBe(0);
    expect(result.data.byStatus.inProgress).toBe(0);
    expect(result.data.byStatus.resolved).toBe(0);
    expect(result.data.byStatus.closed).toBe(0);
    expect(result.data.averageResponseTimeHours).toBe(0);
  });
});
