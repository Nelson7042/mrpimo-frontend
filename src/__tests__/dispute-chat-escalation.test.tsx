/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Mock fetchWithAuth ──────────────────────────────────────────────────────
const mockFetchWithAuth = vi.fn();
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: (...args: any[]) => mockFetchWithAuth(...args),
}));

// ── Mock config ─────────────────────────────────────────────────────────────
vi.mock("@/utils/config", () => ({
  API_BASE_URL: "http://localhost:3000/api/v1",
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => <span data-testid="loader-icon" className={className} />,
  Send: ({ className }: any) => <span data-testid="send-icon" className={className} />,
  AlertTriangle: ({ className }: any) => <span data-testid="alert-icon" className={className} />,
}));

// ── Mock UI components ──────────────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, onClick, ...props }: any) => (
    <button disabled={disabled} onClick={onClick} data-testid={props["data-testid"]} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ disabled, value, onChange, onKeyDown, ...props }: any) => (
    <input
      disabled={disabled}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      data-testid={props["data-testid"]}
      placeholder={props.placeholder}
    />
  ),
}));

// ── Import components under test ────────────────────────────────────────────
import DisputeChatPaginated from "@/components/disputes/DisputeChatPaginated";
import DisputeEscalateButton, {
  isEligibleForEscalation,
} from "@/components/disputes/DisputeEscalateButton";

// ── Helpers ─────────────────────────────────────────────────────────────────

const mockMessages = Array.from({ length: 20 }, (_, i) => ({
  _id: `msg-${i}`,
  userId: i % 2 === 0 ? "user-abc" : "user-xyz",
  content: `Message ${i}`,
  createdAt: new Date(2025, 0, 15, 10, i).toISOString(),
}));

const mockPaginatedResponse = (
  messages: any[],
  page: number,
  total: number
) => ({
  ok: true,
  status: 200,
  json: async () => ({
    messages,
    metadata: {
      total,
      currentPage: page,
      hasMore: page * 20 < total,
    },
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// DisputeChatPaginated Tests
// Validates: Requirements 12.1, 12.2, 13.4
// ═══════════════════════════════════════════════════════════════════════════════

describe("DisputeChatPaginated", () => {
  const defaultProps = {
    issueId: "issue-123",
    currentUserId: "user-abc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 12.1
   * WHEN the dispute chat is opened, THE Dispute_System SHALL load the most recent 20 messages initially.
   */
  it("loads the most recent 20 messages initially", async () => {
    mockFetchWithAuth.mockResolvedValueOnce(
      mockPaginatedResponse(mockMessages, 1, 40)
    );

    render(<DisputeChatPaginated {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/issues/issue-123/chat?page=1&limit=20"
      );
    });

    // Messages should be rendered
    await waitFor(() => {
      expect(screen.getByText("Message 0")).toBeTruthy();
    });
  });

  /**
   * Validates: Requirement 12.1
   * Shows loading state while fetching initial messages.
   */
  it("shows loading state while fetching initial messages", () => {
    // Never-resolving promise to keep loading state
    mockFetchWithAuth.mockReturnValueOnce(new Promise(() => {}));

    render(<DisputeChatPaginated {...defaultProps} />);

    expect(screen.getByTestId("chat-loading")).toBeTruthy();
  });

  /**
   * Validates: Requirement 12.2
   * WHEN the user scrolls to the top of the chat, THE Dispute_System SHALL load the next page.
   */
  it("loads next page when user scrolls to top (infinite scroll)", async () => {
    const page1Messages = mockMessages.slice(0, 20);
    const page2Messages = Array.from({ length: 5 }, (_, i) => ({
      _id: `msg-older-${i}`,
      userId: "user-xyz",
      content: `Older message ${i}`,
      createdAt: new Date(2025, 0, 14, 10, i).toISOString(),
    }));

    mockFetchWithAuth
      .mockResolvedValueOnce(mockPaginatedResponse(page1Messages, 1, 25))
      .mockResolvedValueOnce(mockPaginatedResponse(page2Messages, 2, 25));

    render(<DisputeChatPaginated {...defaultProps} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Message 0")).toBeTruthy();
    });

    // Simulate scrolling to top
    const container = screen.getByTestId("chat-messages-container");
    Object.defineProperty(container, "scrollTop", { value: 0, writable: true });

    fireEvent.scroll(container);

    // Should fetch page 2
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/issues/issue-123/chat?page=2&limit=20"
      );
    });
  });

  /**
   * Validates: Requirement 13.4
   * WHEN the frontend receives a 429 response, THE Dispute_System SHALL display a cooldown message
   * and disable the send button until the cooldown expires.
   */
  it("shows cooldown message and disables send button on 429 rate limit", async () => {
    // Initial load
    mockFetchWithAuth.mockResolvedValueOnce(
      mockPaginatedResponse(mockMessages, 1, 20)
    );

    render(<DisputeChatPaginated {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("chat-input")).toBeTruthy();
    });

    // Mock 429 response for sending
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ message: "Rate limit exceeded", retryAfter: 30 }),
    });

    // Type and send a message
    const input = screen.getByTestId("chat-input");
    fireEvent.change(input, { target: { value: "Hello" } });

    const sendButton = screen.getByTestId("chat-send-button");
    fireEvent.click(sendButton);

    // Should show cooldown message
    await waitFor(() => {
      expect(screen.getByTestId("rate-limit-cooldown")).toBeTruthy();
    });

    // Send button should be disabled
    expect(screen.getByTestId("chat-send-button")).toHaveProperty(
      "disabled",
      true
    );

    // Input should be disabled
    expect(screen.getByTestId("chat-input")).toHaveProperty("disabled", true);
  });

  /**
   * Validates: Requirement 13.4
   * Cooldown timer decrements and re-enables send after expiry.
   */
  it("re-enables send button after cooldown expires", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Initial load
    mockFetchWithAuth.mockResolvedValueOnce(
      mockPaginatedResponse(mockMessages, 1, 20)
    );

    render(<DisputeChatPaginated {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("chat-input")).toBeTruthy();
    });

    // Mock 429 response with 2-second cooldown
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ message: "Rate limit exceeded", retryAfter: 2 }),
    });

    // Type and send
    const input = screen.getByTestId("chat-input");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByTestId("chat-send-button"));

    // Cooldown should be active
    await waitFor(() => {
      expect(screen.getByTestId("rate-limit-cooldown")).toBeTruthy();
    });

    // Advance timers to expire cooldown
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Cooldown message should be gone
    await waitFor(() => {
      expect(screen.queryByTestId("rate-limit-cooldown")).toBeNull();
    });

    vi.useRealTimers();
  });

  /**
   * Validates: Requirement 12.1
   * Shows empty state when no messages exist.
   */
  it("shows empty state when no messages exist", async () => {
    mockFetchWithAuth.mockResolvedValueOnce(
      mockPaginatedResponse([], 1, 0)
    );

    render(<DisputeChatPaginated {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("no-messages")).toBeTruthy();
    });

    expect(screen.getByText("No messages yet. Start the conversation.")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DisputeEscalateButton Tests
// Validates: Requirements 17.1, 17.2, 17.3, 17.4
// ═══════════════════════════════════════════════════════════════════════════════

describe("DisputeEscalateButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Set "now" to Jan 25, 2025 so disputes created on Jan 15 are > 7 days old
    vi.setSystemTime(new Date(2025, 0, 25, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Validates: Requirement 17.1
   * WHEN a dispute has been open for more than 7 days without resolution,
   * THE Dispute_System SHALL display an "Escalate" button.
   */
  it("shows Escalate button when dispute is open > 7 days and not escalated", () => {
    render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="open"
        escalatedAt={null}
      />
    );

    expect(screen.getByTestId("escalate-button")).toBeTruthy();
    expect(screen.getByText("Escalate")).toBeTruthy();
  });

  /**
   * Validates: Requirement 17.1
   * Button is NOT shown when dispute is less than 7 days old.
   */
  it("does not show Escalate button when dispute is less than 7 days old", () => {
    // Set "now" to Jan 20 — only 5 days after creation
    vi.setSystemTime(new Date(2025, 0, 20, 12, 0, 0));

    const { container } = render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="open"
        escalatedAt={null}
      />
    );

    expect(container.innerHTML).toBe("");
  });

  /**
   * Validates: Requirement 17.4
   * IF the dispute has already been escalated, THEN THE Dispute_System SHALL
   * display the escalation date and hide the escalate button.
   */
  it("shows escalation date and hides button when already escalated", () => {
    render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="open"
        escalatedAt="2025-01-23T14:30:00.000Z"
      />
    );

    // Should show escalation info
    expect(screen.getByTestId("escalation-info")).toBeTruthy();
    expect(screen.getByText(/Escalated on/)).toBeTruthy();

    // Should NOT show the escalate button
    expect(screen.queryByTestId("escalate-button")).toBeNull();
  });

  /**
   * Validates: Requirement 17.3
   * THE Dispute_System SHALL allow escalation only once per dispute.
   * After escalation, button is replaced with escalation date.
   */
  it("calls POST /issues/:issueId/escalate and shows date after success", async () => {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ escalatedAt: "2025-01-25T12:00:00.000Z" }),
    });

    render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="open"
        escalatedAt={null}
      />
    );

    // Click escalate
    fireEvent.click(screen.getByTestId("escalate-button"));

    // Should call the escalate endpoint
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/issues/issue-123/escalate",
        { method: "POST" }
      );
    });

    // Should now show escalation info instead of button
    await waitFor(() => {
      expect(screen.getByTestId("escalation-info")).toBeTruthy();
    });
    expect(screen.queryByTestId("escalate-button")).toBeNull();
  });

  /**
   * Validates: Requirement 17.1
   * Button is NOT shown when dispute status is "resolved" or "closed".
   */
  it("does not show Escalate button for resolved disputes", () => {
    const { container } = render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="resolved"
        escalatedAt={null}
      />
    );

    expect(container.innerHTML).toBe("");
  });

  it("does not show Escalate button for closed disputes", () => {
    const { container } = render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="closed"
        escalatedAt={null}
      />
    );

    expect(container.innerHTML).toBe("");
  });

  /**
   * Validates: Requirement 17.2
   * Shows error message when escalation fails.
   */
  it("shows error message when escalation API call fails", async () => {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Dispute must be open for at least 7 days before escalation" }),
    });

    render(
      <DisputeEscalateButton
        issueId="issue-123"
        disputeCreatedAt="2025-01-15T10:00:00.000Z"
        disputeStatus="open"
        escalatedAt={null}
      />
    );

    fireEvent.click(screen.getByTestId("escalate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("escalate-error")).toBeTruthy();
    });

    expect(
      screen.getByText("Dispute must be open for at least 7 days before escalation")
    ).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isEligibleForEscalation — pure logic tests
// Validates: Requirements 17.1, 17.3
// ═══════════════════════════════════════════════════════════════════════════════

describe("isEligibleForEscalation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 25, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when open > 7 days and not escalated", () => {
    expect(
      isEligibleForEscalation("2025-01-15T10:00:00.000Z", "open", null)
    ).toBe(true);
  });

  it("returns false when already escalated", () => {
    expect(
      isEligibleForEscalation(
        "2025-01-15T10:00:00.000Z",
        "open",
        "2025-01-23T10:00:00.000Z"
      )
    ).toBe(false);
  });

  it("returns false when open less than 7 days", () => {
    // Created on Jan 20, now is Jan 25 = 5 days
    expect(
      isEligibleForEscalation("2025-01-20T10:00:00.000Z", "open", null)
    ).toBe(false);
  });

  it("returns false when status is resolved", () => {
    expect(
      isEligibleForEscalation("2025-01-15T10:00:00.000Z", "resolved", null)
    ).toBe(false);
  });

  it("returns false when status is closed", () => {
    expect(
      isEligibleForEscalation("2025-01-15T10:00:00.000Z", "closed", null)
    ).toBe(false);
  });

  it("returns true for in-progress status open > 7 days", () => {
    expect(
      isEligibleForEscalation("2025-01-15T10:00:00.000Z", "in-progress", null)
    ).toBe(true);
  });
});
