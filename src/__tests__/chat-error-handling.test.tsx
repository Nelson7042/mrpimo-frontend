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
  RefreshCw: ({ className }: any) => <span data-testid="refresh-icon" className={className} />,
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

// ── Import component under test ─────────────────────────────────────────────
import DisputeChatPaginated from "@/components/disputes/DisputeChatPaginated";

// ── Helpers ─────────────────────────────────────────────────────────────────

const mockMessages = Array.from({ length: 5 }, (_, i) => ({
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
// Chat Error Handling Tests
// Validates: Requirements 15.1, 15.2, 15.3, 15.4
// ═══════════════════════════════════════════════════════════════════════════════

describe("DisputeChatPaginated - Error Handling", () => {
  const defaultProps = {
    issueId: "issue-123",
    currentUserId: "user-abc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Requirement 15.1: Inline error notification below input on send failure ───

  describe("Req 15.1: Send failure inline error", () => {
    it("displays inline error notification below message input when send fails", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock send failure
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error: unable to send message" }),
      });

      // Type and send a message
      const input = screen.getByTestId("chat-input");
      fireEvent.change(input, { target: { value: "Hello world" } });

      const sendButton = screen.getByTestId("chat-send-button");
      await act(async () => {
        fireEvent.click(sendButton);
      });

      // Should show inline send error below input
      await waitFor(() => {
        const errorEl = screen.getByTestId("chat-send-error");
        expect(errorEl).toBeTruthy();
        expect(errorEl.textContent).toContain("Server error: unable to send message");
      });
    });

    it("clears send error when a subsequent send is attempted", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // First send fails
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Send failed" }),
      });

      const input = screen.getByTestId("chat-input");
      fireEvent.change(input, { target: { value: "Hello" } });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("chat-send-error")).toBeTruthy();
      });

      // Second send succeeds
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: {
            _id: "new-msg",
            userId: "user-abc",
            content: "Hello",
            createdAt: new Date().toISOString(),
          },
        }),
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId("chat-send-error")).toBeNull();
      });
    });
  });

  // ─── Requirement 15.2: Retain unsent message text on failure ───────────────

  describe("Req 15.2: Retain unsent message text", () => {
    it("retains message text in input field when send fails", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock send failure
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Network error" }),
      });

      // Type a message
      const input = screen.getByTestId("chat-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "My important message" } });

      // Send it (will fail)
      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Message text should still be in the input
      await waitFor(() => {
        expect(input.value).toBe("My important message");
      });
    });

    it("clears message text only on successful send", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock successful send
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: {
            _id: "new-msg",
            userId: "user-abc",
            content: "My message",
            createdAt: new Date().toISOString(),
          },
        }),
      });

      const input = screen.getByTestId("chat-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "My message" } });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Message text should be cleared on success
      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  // ─── Requirement 15.3: Rate limit handling (429 response) ──────────────────

  describe("Req 15.3: Rate limit handling", () => {
    it("displays retry-after countdown on 429 response", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock 429 response
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ retryAfter: 30 }),
      });

      const input = screen.getByTestId("chat-input");
      fireEvent.change(input, { target: { value: "Rate limited message" } });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Should show rate limit cooldown
      await waitFor(() => {
        const cooldownEl = screen.getByTestId("rate-limit-cooldown");
        expect(cooldownEl).toBeTruthy();
        expect(cooldownEl.textContent).toContain("30s");
      });
    });

    it("disables send button during rate limit cooldown", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock 429 response
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ retryAfter: 10 }),
      });

      const input = screen.getByTestId("chat-input");
      fireEvent.change(input, { target: { value: "Test message" } });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Send button should be disabled
      await waitFor(() => {
        const sendButton = screen.getByTestId("chat-send-button") as HTMLButtonElement;
        expect(sendButton.disabled).toBe(true);
      });
    });

    it("retains message text in input on 429 response", async () => {
      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock 429 response
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ retryAfter: 5 }),
      });

      const input = screen.getByTestId("chat-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Keep this text" } });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Message text should be retained
      await waitFor(() => {
        expect(input.value).toBe("Keep this text");
      });
    });

    it("re-enables send button after cooldown expires", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      // Initial load succeeds
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Mock 429 response with 2-second cooldown
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ retryAfter: 2 }),
      });

      const input = screen.getByTestId("chat-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Test" } });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-send-button"));
      });

      // Button should be disabled during cooldown
      await waitFor(() => {
        const sendButton = screen.getByTestId("chat-send-button") as HTMLButtonElement;
        expect(sendButton.disabled).toBe(true);
      });

      // Advance timers past the cooldown
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Button should be re-enabled (input still has text)
      await waitFor(() => {
        const sendButton = screen.getByTestId("chat-send-button") as HTMLButtonElement;
        expect(sendButton.disabled).toBe(false);
      });
    });
  });

  // ─── Requirement 15.4: Initial load failure with retry button ──────────────

  describe("Req 15.4: Initial load failure", () => {
    it("shows error state with retry button when initial message load fails", async () => {
      // Initial load fails
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Internal server error" }),
      });

      render(<DisputeChatPaginated {...defaultProps} />);

      // Should show error state with retry button
      await waitFor(() => {
        const errorEl = screen.getByTestId("chat-load-error");
        expect(errorEl).toBeTruthy();
        expect(errorEl.textContent).toContain("Internal server error");
      });

      expect(screen.getByTestId("chat-retry-button")).toBeTruthy();
    });

    it("retries fetch when retry button is clicked", async () => {
      // Initial load fails
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Connection failed" }),
      });

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("chat-load-error")).toBeTruthy();
      });

      // Mock successful retry
      mockFetchWithAuth.mockResolvedValueOnce(
        mockPaginatedResponse(mockMessages, 1, 5)
      );

      // Click retry button
      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-retry-button"));
      });

      // Should show the chat after successful retry
      await waitFor(() => {
        expect(screen.getByTestId("dispute-chat")).toBeTruthy();
      });

      // Error state should be gone
      expect(screen.queryByTestId("chat-load-error")).toBeNull();
    });

    it("shows error state again if retry also fails", async () => {
      // Initial load fails
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server down" }),
      });

      render(<DisputeChatPaginated {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId("chat-load-error")).toBeTruthy();
      });

      // Retry also fails
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ message: "Service unavailable" }),
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("chat-retry-button"));
      });

      // Should still show error state with updated message
      await waitFor(() => {
        const errorEl = screen.getByTestId("chat-load-error");
        expect(errorEl).toBeTruthy();
        expect(errorEl.textContent).toContain("Service unavailable");
      });
    });
  });
});
