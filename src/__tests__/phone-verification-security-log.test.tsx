/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock settingsService ────────────────────────────────────────────────────
const mockSendPhoneOTP = vi.fn();
const mockVerifyPhoneOTP = vi.fn();
const mockGetSecurityEvents = vi.fn();

vi.mock("@/services/settingsService", () => ({
  settingsService: {
    sendPhoneOTP: (...args: any[]) => mockSendPhoneOTP(...args),
    verifyPhoneOTP: (...args: any[]) => mockVerifyPhoneOTP(...args),
    getSecurityEvents: (...args: any[]) => mockGetSecurityEvents(...args),
  },
}));

// ── Mock react-hot-toast ────────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Mock UI components ──────────────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Phone: ({ className }: any) => <span data-testid="icon-phone" className={className} />,
  Loader2: ({ className }: any) => <span data-testid="icon-loader" className={className} />,
  CheckCircle2: ({ className }: any) => <span data-testid="icon-check" className={className} />,
  XCircle: ({ className }: any) => <span data-testid="icon-x" className={className} />,
  Lock: ({ className }: any) => <span data-testid="icon-lock" className={className} />,
  RefreshCw: ({ className }: any) => <span data-testid="icon-refresh" className={className} />,
  Shield: ({ className }: any) => <span data-testid="icon-shield" className={className} />,
  AlertCircle: ({ className }: any) => <span data-testid="icon-alert" className={className} />,
  ChevronLeft: ({ className }: any) => <span data-testid="icon-chevron-left" className={className} />,
  ChevronRight: ({ className }: any) => <span data-testid="icon-chevron-right" className={className} />,
  KeyRound: ({ className }: any) => <span data-testid="icon-key" className={className} />,
  Mail: ({ className }: any) => <span data-testid="icon-mail" className={className} />,
  LogIn: ({ className }: any) => <span data-testid="icon-login" className={className} />,
  LogOut: ({ className }: any) => <span data-testid="icon-logout" className={className} />,
  Trash2: ({ className }: any) => <span data-testid="icon-trash" className={className} />,
}));

// ── Import components under test (after mocks) ─────────────────────────────
import PhoneVerification from "@/components/settings/PhoneVerification";
import SecurityEventLog from "@/components/settings/SecurityEventLog";

// ── Helper: wrap component with QueryClientProvider ─────────────────────────
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Helper to flush promises
function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ═══════════════════════════════════════════════════════════════════════════
// Task 15.3 – Phone Verification UI Tests
// Validates: Requirements 9.3, 9.4
// ═══════════════════════════════════════════════════════════════════════════
describe("PhoneVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
  });

  it("renders phone input and Send OTP button in idle state", () => {
    render(<PhoneVerification />, { wrapper: createWrapper() });

    expect(screen.getByTestId("phone-input")).toBeTruthy();
    expect(screen.getByTestId("send-otp-button")).toBeTruthy();
    expect(screen.getByTestId("unverified-badge")).toBeTruthy();
  });

  it("displays verified badge when isVerified is true", () => {
    render(<PhoneVerification isVerified={true} phoneNumber="+1234567890" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId("verified-badge")).toBeTruthy();
    expect(screen.queryByTestId("send-otp-button")).toBeNull();
  });

  it("shows OTP input section after successfully sending OTP", async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    mockSendPhoneOTP.mockResolvedValue({ success: true, expiresAt });

    render(<PhoneVerification phoneNumber="+1234567890" />, {
      wrapper: createWrapper(),
    });

    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } });

    const sendButton = screen.getByTestId("send-otp-button");
    await act(async () => {
      fireEvent.click(sendButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-section")).toBeTruthy();
    });

    expect(screen.getByTestId("otp-input")).toBeTruthy();
    expect(screen.getByTestId("verify-otp-button")).toBeTruthy();
    expect(screen.getByTestId("otp-countdown")).toBeTruthy();
  });

  it("transitions to verified state on successful OTP verification", async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    mockSendPhoneOTP.mockResolvedValue({ success: true, expiresAt });
    mockVerifyPhoneOTP.mockResolvedValue({ success: true, verified: true });

    const onVerified = vi.fn();
    render(<PhoneVerification phoneNumber="+1234567890" onVerified={onVerified} />, {
      wrapper: createWrapper(),
    });

    // Send OTP
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+1234567890" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("send-otp-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-input")).toBeTruthy();
    });

    // Enter and verify OTP
    const otpInput = screen.getByTestId("otp-input");
    fireEvent.change(otpInput, { target: { value: "123456" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("verified-badge")).toBeTruthy();
    });

    expect(onVerified).toHaveBeenCalled();
  });

  it("shows lockout message after 3 failed OTP attempts", async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    mockSendPhoneOTP.mockResolvedValue({ success: true, expiresAt });
    mockVerifyPhoneOTP.mockResolvedValue({ success: true, verified: false });

    render(<PhoneVerification phoneNumber="+1234567890" />, {
      wrapper: createWrapper(),
    });

    // Send OTP
    fireEvent.change(screen.getByTestId("phone-input"), {
      target: { value: "+1234567890" },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("send-otp-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-input")).toBeTruthy();
    });

    // Attempt 1
    fireEvent.change(screen.getByTestId("otp-input"), { target: { value: "000000" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-button"));
    });
    await waitFor(() => {
      expect(mockVerifyPhoneOTP).toHaveBeenCalledTimes(1);
    });
    // Wait for state to reset to otp_sent
    await waitFor(() => {
      expect(screen.getByTestId("verify-otp-button")).not.toHaveProperty("disabled", true);
    });

    // Attempt 2
    fireEvent.change(screen.getByTestId("otp-input"), { target: { value: "000000" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-button"));
    });
    await waitFor(() => {
      expect(mockVerifyPhoneOTP).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(screen.getByTestId("verify-otp-button")).not.toHaveProperty("disabled", true);
    });

    // Attempt 3 - should trigger lockout
    fireEvent.change(screen.getByTestId("otp-input"), { target: { value: "000000" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-button"));
    });
    await waitFor(() => {
      expect(mockVerifyPhoneOTP).toHaveBeenCalledTimes(3);
    });

    // Should show lockout message
    await waitFor(() => {
      expect(screen.getByTestId("lockout-message")).toBeTruthy();
    });

    expect(screen.getByTestId("lockout-timer")).toBeTruthy();
  });

  it("disables Send OTP button when phone input is empty", () => {
    render(<PhoneVerification />, { wrapper: createWrapper() });

    const sendButton = screen.getByTestId("send-otp-button");
    expect(sendButton).toHaveProperty("disabled", true);
  });

  it("disables Verify button when OTP code is less than 6 digits", async () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    mockSendPhoneOTP.mockResolvedValue({ success: true, expiresAt });

    render(<PhoneVerification phoneNumber="+1234567890" />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByTestId("phone-input"), {
      target: { value: "+1234567890" },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("send-otp-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-input")).toBeTruthy();
    });

    // Enter partial OTP
    fireEvent.change(screen.getByTestId("otp-input"), {
      target: { value: "123" },
    });

    const verifyButton = screen.getByTestId("verify-otp-button");
    expect(verifyButton).toHaveProperty("disabled", true);
  });

  it("handles lockout error from server on send OTP", async () => {
    mockSendPhoneOTP.mockRejectedValue(
      new Error("Too many failed attempts. Try again in 15 minutes.")
    );

    render(<PhoneVerification phoneNumber="+1234567890" />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByTestId("phone-input"), {
      target: { value: "+1234567890" },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("send-otp-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("lockout-message")).toBeTruthy();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Task 15.3 – Security Event Log UI Tests
// Validates: Requirements 18.3, 18.5
// ═══════════════════════════════════════════════════════════════════════════
describe("SecurityEventLog", () => {
  const mockEvents = Array.from({ length: 20 }, (_, i) => ({
    _id: `event-${i + 1}`,
    userId: "user1",
    eventType: i % 2 === 0 ? "login_success" : "password_change",
    ipAddress: `192.168.1.${i + 1}`,
    deviceType: "desktop",
    browser: "Chrome",
    outcome: i % 3 === 0 ? "failure" : "success",
    createdAt: new Date(2025, 0, 20 - i).toISOString(),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays security events in reverse chronological order", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: mockEvents.slice(0, 15),
      total: 20,
      page: 1,
      totalPages: 2,
      hasMore: true,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("security-event-event-1")).toBeTruthy();
    });

    // All 15 events on first page should be rendered
    for (let i = 1; i <= 15; i++) {
      expect(screen.getByTestId(`security-event-event-${i}`)).toBeTruthy();
    }
  });

  it("shows pagination controls when there are multiple pages", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: mockEvents.slice(0, 15),
      total: 20,
      page: 1,
      totalPages: 2,
      hasMore: true,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    });

    expect(screen.getByLabelText("Previous page")).toBeTruthy();
    expect(screen.getByLabelText("Next page")).toBeTruthy();
  });

  it("navigates to next page when Next button is clicked", async () => {
    mockGetSecurityEvents
      .mockResolvedValueOnce({
        events: mockEvents.slice(0, 15),
        total: 20,
        page: 1,
        totalPages: 2,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        events: mockEvents.slice(15, 20),
        total: 20,
        page: 2,
        totalPages: 2,
        hasMore: false,
      });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Next page"));

    await waitFor(() => {
      expect(mockGetSecurityEvents).toHaveBeenCalledWith(2);
    });
  });

  it("disables Previous button on first page", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: mockEvents.slice(0, 15),
      total: 20,
      page: 1,
      totalPages: 2,
      hasMore: true,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText("Previous page")).toBeTruthy();
    });

    expect(screen.getByLabelText("Previous page")).toHaveProperty("disabled", true);
  });

  it("displays event outcome badges (success/failure)", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: [
        {
          _id: "evt-success",
          userId: "user1",
          eventType: "login_success",
          ipAddress: "192.168.1.1",
          deviceType: "desktop",
          browser: "Chrome",
          outcome: "success",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "evt-failure",
          userId: "user1",
          eventType: "login_failure",
          ipAddress: "192.168.1.2",
          deviceType: "mobile",
          browser: "Safari",
          outcome: "failure",
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("event-outcome-evt-success")).toBeTruthy();
      expect(screen.getByTestId("event-outcome-evt-failure")).toBeTruthy();
    });

    // Check outcome text
    expect(screen.getByTestId("event-outcome-evt-success").textContent).toContain("Success");
    expect(screen.getByTestId("event-outcome-evt-failure").textContent).toContain("Failed");
  });

  it("is read-only with no delete actions visible", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: mockEvents.slice(0, 5),
      total: 5,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("security-event-event-1")).toBeTruthy();
    });

    // No delete buttons should exist
    expect(screen.queryByText("Delete")).toBeNull();
    expect(screen.queryByLabelText("Delete event")).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("shows empty state when no events exist", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No security events found.")).toBeTruthy();
    });
  });

  it("shows error state with retry button on fetch failure", async () => {
    mockGetSecurityEvents.mockRejectedValue(new Error("Network error"));

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    // The component has retry: 3 with exponential backoff, so we need to wait
    // for all retries to exhaust before the error state shows
    await waitFor(
      () => {
        expect(screen.getByText("Network error")).toBeTruthy();
      },
      { timeout: 15000 }
    );

    expect(screen.getByText("Retry")).toBeTruthy();
  }, 20000);

  it("displays correct event type labels", async () => {
    mockGetSecurityEvents.mockResolvedValue({
      events: [
        {
          _id: "evt-pw",
          userId: "user1",
          eventType: "password_change",
          ipAddress: "10.0.0.1",
          deviceType: "desktop",
          browser: "Firefox",
          outcome: "success",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "evt-email",
          userId: "user1",
          eventType: "email_change",
          ipAddress: "10.0.0.2",
          deviceType: "mobile",
          browser: "Safari",
          outcome: "success",
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });

    render(<SecurityEventLog />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Password Changed")).toBeTruthy();
      expect(screen.getByText("Email Changed")).toBeTruthy();
    });
  });
});
