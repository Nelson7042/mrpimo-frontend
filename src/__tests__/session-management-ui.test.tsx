/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mock data ──────────────────────────────────────────────────────────────

const mockSessions = [
  {
    sessionId: "session-1",
    userId: "user-1",
    deviceType: "desktop",
    browser: "Chrome",
    ipAddress: "192.168.1.1",
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isCurrent: true,
  },
  {
    sessionId: "session-2",
    userId: "user-1",
    deviceType: "mobile",
    browser: "Safari",
    ipAddress: "10.0.0.5",
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isCurrent: false,
  },
  {
    sessionId: "session-3",
    userId: "user-1",
    deviceType: "tablet",
    browser: "Firefox",
    ipAddress: "172.16.0.10",
    lastActivity: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isCurrent: false,
  },
];

const mockLoginEvents = [
  {
    _id: "event-1",
    userId: "user-1",
    timestamp: new Date().toISOString(),
    deviceType: "desktop",
    browser: "Chrome",
    ipAddress: "192.168.1.1",
    location: { city: "Lagos", country: "Nigeria" },
    isNewDevice: false,
    isUnusualLocation: false,
    success: true,
  },
  {
    _id: "event-2",
    userId: "user-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    deviceType: "mobile",
    browser: "Safari",
    ipAddress: "10.0.0.5",
    location: { city: "London", country: "UK" },
    isNewDevice: true,
    isUnusualLocation: false,
    success: true,
  },
  {
    _id: "event-3",
    userId: "user-1",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    deviceType: "desktop",
    browser: "Firefox",
    ipAddress: "203.0.113.50",
    location: { city: "Tokyo", country: "Japan" },
    isNewDevice: false,
    isUnusualLocation: true,
    success: true,
  },
  {
    _id: "event-4",
    userId: "user-1",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    deviceType: "tablet",
    browser: "Edge",
    ipAddress: "198.51.100.1",
    location: { city: "Berlin", country: "Germany" },
    isNewDevice: true,
    isUnusualLocation: true,
    success: false,
  },
];

// ─── Mock settingsService ───────────────────────────────────────────────────

const mockGetActiveSessions = vi.fn();
const mockTerminateSession = vi.fn();
const mockGetLoginHistory = vi.fn();

vi.mock("@/services/settingsService", () => ({
  settingsService: {
    getActiveSessions: (...args: any[]) => mockGetActiveSessions(...args),
    terminateSession: (...args: any[]) => mockTerminateSession(...args),
    getLoginHistory: (...args: any[]) => mockGetLoginHistory(...args),
  },
}));

// ─── Mock react-hot-toast ───────────────────────────────────────────────────

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── Mock @tanstack/react-query with real-ish behavior ──────────────────────

let queryState: Record<string, any> = {};
const mockInvalidateQueries = vi.fn();
const mockCancelQueries = vi.fn().mockResolvedValue(undefined);
const mockSetQueryData = vi.fn();
const mockGetQueryData = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: any) => {
    const key = JSON.stringify(options.queryKey);
    return queryState[key] || { data: undefined, isLoading: true, isError: false, error: null, refetch: vi.fn() };
  },
  useMutation: (options: any) => {
    return {
      mutate: async (variables: any) => {
        try {
          if (options.onMutate) {
            await options.onMutate(variables);
          }
          await options.mutationFn(variables);
          if (options.onSuccess) {
            options.onSuccess();
          }
        } catch (err) {
          if (options.onError) {
            options.onError(err, variables, {});
          }
        } finally {
          if (options.onSettled) {
            options.onSettled();
          }
        }
      },
      isPending: false,
    };
  },
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    cancelQueries: mockCancelQueries,
    setQueryData: mockSetQueryData,
    getQueryData: mockGetQueryData,
  }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Mock lucide-react icons ────────────────────────────────────────────────

vi.mock("lucide-react", () => ({
  Monitor: () => <span data-testid="icon-monitor">Monitor</span>,
  Smartphone: () => <span data-testid="icon-smartphone">Smartphone</span>,
  Tablet: () => <span data-testid="icon-tablet">Tablet</span>,
  LogOut: () => <span data-testid="icon-logout">LogOut</span>,
  Loader2: () => <span data-testid="icon-loader">Loader</span>,
  RefreshCw: () => <span data-testid="icon-refresh">Refresh</span>,
  Shield: () => <span data-testid="icon-shield">Shield</span>,
  AlertCircle: () => <span data-testid="icon-alert-circle">AlertCircle</span>,
  AlertTriangle: () => <span data-testid="icon-alert-triangle">AlertTriangle</span>,
  History: () => <span data-testid="icon-history">History</span>,
  ChevronLeft: () => <span data-testid="icon-chevron-left">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="icon-chevron-right">ChevronRight</span>,
}));

// ─── Mock UI components ─────────────────────────────────────────────────────

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, onClick, ...props }: any) => (
    <button disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("SessionManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState = {};
  });

  describe("Requirement 7.3: Current session highlighting", () => {
    it("highlights the current session with a distinct visual style", async () => {
      queryState['["sessions"]'] = {
        data: mockSessions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      // The current session should display the "Current session" badge
      expect(screen.getByText("Current session")).toBeTruthy();

      // The current session card should exist
      const currentSessionEl = screen.getByTestId("session-session-1");
      expect(currentSessionEl).toBeTruthy();

      // Verify the current session has the green highlight class
      expect(currentSessionEl.className).toContain("border-green-300");
      expect(currentSessionEl.className).toContain("bg-green-50");
    });

    it("does not highlight non-current sessions with the current session style", async () => {
      queryState['["sessions"]'] = {
        data: mockSessions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      // Non-current sessions should have standard styling
      const otherSession = screen.getByTestId("session-session-2");
      expect(otherSession.className).toContain("border-gray-200");
      expect(otherSession.className).toContain("bg-white");
      expect(otherSession.className).not.toContain("border-green-300");
    });

    it("displays device type, browser, IP, and last activity for each session", async () => {
      queryState['["sessions"]'] = {
        data: mockSessions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      // Check that session info is displayed
      expect(screen.getByText("Chrome on desktop")).toBeTruthy();
      expect(screen.getByText("Safari on mobile")).toBeTruthy();
      expect(screen.getByText("Firefox on tablet")).toBeTruthy();

      // Check IP addresses
      expect(screen.getByText("IP: 192.168.1.1")).toBeTruthy();
      expect(screen.getByText("IP: 10.0.0.5")).toBeTruthy();
      expect(screen.getByText("IP: 172.16.0.10")).toBeTruthy();
    });
  });

  describe("Requirement 7.4: Prevent termination of current session", () => {
    it("disables the Log Out button for the current session", async () => {
      queryState['["sessions"]'] = {
        data: mockSessions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      // Find the button for the current session - it should be disabled
      const currentSessionButton = screen.getByLabelText("Cannot terminate current session");
      expect(currentSessionButton).toBeTruthy();
      expect(currentSessionButton.hasAttribute("disabled")).toBe(true);
    });

    it("enables the Log Out button for non-current sessions", async () => {
      queryState['["sessions"]'] = {
        data: mockSessions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      // Non-current session buttons should be enabled
      const safariButton = screen.getByLabelText("Log out session on Safari");
      expect(safariButton).toBeTruthy();
      expect(safariButton.hasAttribute("disabled")).toBe(false);

      const firefoxButton = screen.getByLabelText("Log out session on Firefox");
      expect(firefoxButton).toBeTruthy();
      expect(firefoxButton.hasAttribute("disabled")).toBe(false);
    });

    it("calls terminateSession when clicking Log Out on a non-current session", async () => {
      mockTerminateSession.mockResolvedValue(undefined);

      queryState['["sessions"]'] = {
        data: mockSessions,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      const safariButton = screen.getByLabelText("Log out session on Safari");
      fireEvent.click(safariButton);

      await waitFor(() => {
        expect(mockTerminateSession).toHaveBeenCalledWith("session-2");
      });
    });
  });

  describe("Loading and error states", () => {
    it("shows loading state while fetching sessions", async () => {
      queryState['["sessions"]'] = {
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      expect(screen.getByText("Loading sessions...")).toBeTruthy();
    });

    it("shows error state with retry button on failure", async () => {
      const mockRefetch = vi.fn();
      queryState['["sessions"]'] = {
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Network error"),
        refetch: mockRefetch,
      };

      const SessionManagement = (await import("@/components/settings/SessionManagement")).default;
      render(<SessionManagement />);

      expect(screen.getByText("Network error")).toBeTruthy();
      expect(screen.getByText("Retry")).toBeTruthy();
    });
  });
});

describe("LoginHistory Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState = {};
  });

  describe("Requirement 8.3: Reverse chronological order with pagination", () => {
    it("displays login events with all required information", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 25,
          page: 1,
          totalPages: 3,
          hasMore: true,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Check that events are displayed with device info
      expect(screen.getByText("Chrome on desktop")).toBeTruthy();
      expect(screen.getByText("Safari on mobile")).toBeTruthy();
      expect(screen.getByText("Firefox on desktop")).toBeTruthy();
      expect(screen.getByText("Edge on tablet")).toBeTruthy();

      // Check IP addresses
      expect(screen.getByText("IP: 192.168.1.1")).toBeTruthy();
      expect(screen.getByText("IP: 10.0.0.5")).toBeTruthy();

      // Check locations
      expect(screen.getByText("Lagos, Nigeria")).toBeTruthy();
      expect(screen.getByText("London, UK")).toBeTruthy();
      expect(screen.getByText("Tokyo, Japan")).toBeTruthy();
    });

    it("shows pagination controls when there are multiple pages", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 25,
          page: 1,
          totalPages: 3,
          hasMore: true,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Pagination info should be visible
      expect(screen.getByText("Page 1 of 3")).toBeTruthy();
      expect(screen.getByText(/Showing 1 to/)).toBeTruthy();
    });

    it("disables previous button on first page", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 25,
          page: 1,
          totalPages: 3,
          hasMore: true,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      const prevButton = screen.getByLabelText("Previous page");
      expect(prevButton.hasAttribute("disabled")).toBe(true);
    });

    it("does not show pagination when there is only one page", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents.slice(0, 2),
          total: 2,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Pagination controls should not be present
      expect(screen.queryByLabelText("Previous page")).toBeNull();
      expect(screen.queryByLabelText("Next page")).toBeNull();
    });
  });

  describe("Requirement 8.4: Anomaly indicators", () => {
    it("flags events with new device indicator", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 4,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Event 2 has isNewDevice=true only
      expect(screen.getByText("New device")).toBeTruthy();
    });

    it("flags events with unusual location indicator", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 4,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Event 3 has isUnusualLocation=true only
      expect(screen.getByText("Unusual location")).toBeTruthy();
    });

    it("flags events with both new device and unusual location", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 4,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Event 4 has both isNewDevice=true and isUnusualLocation=true
      expect(screen.getByText("New device & location")).toBeTruthy();
    });

    it("applies amber styling to anomalous events", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: mockLoginEvents,
          total: 4,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // Normal event should have standard styling
      const normalEvent = screen.getByTestId("login-event-event-1");
      expect(normalEvent.className).toContain("border-gray-200");
      expect(normalEvent.className).not.toContain("border-amber-300");

      // Anomalous event should have amber styling
      const anomalousEvent = screen.getByTestId("login-event-event-2");
      expect(anomalousEvent.className).toContain("border-amber-300");
      expect(anomalousEvent.className).toContain("bg-amber-50");
    });

    it("does not flag normal events with anomaly indicators", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: [mockLoginEvents[0]], // Only the normal event
          total: 1,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      // No anomaly indicators should be present
      expect(screen.queryAllByTestId("anomaly-indicator")).toHaveLength(0);
    });
  });

  describe("Success/failure status display", () => {
    it("shows success badge for successful logins", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: [mockLoginEvents[0]],
          total: 1,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      expect(screen.getByText("Success")).toBeTruthy();
    });

    it("shows failed badge for failed logins", async () => {
      queryState['["loginHistory",1]'] = {
        data: {
          events: [mockLoginEvents[3]], // Failed login
          total: 1,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };

      const LoginHistory = (await import("@/components/settings/LoginHistory")).default;
      render(<LoginHistory />);

      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });
});
