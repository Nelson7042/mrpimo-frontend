/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Feature: notification-routing-offers, Property 6: DetailNotificationModal renders Go to button based on redirectUrl validity
// Validates: Requirements 6.1, 6.2

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── Mock lucide-react ───────────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  X: (props: any) => <span data-testid="x-icon" {...props} />,
}));

// ── Mock @/components/ui/button ─────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

import NotificationModal from "../NotificationModal";

function makeNotification(overrides: Record<string, any> = {}) {
  return {
    _id: "notif-1",
    userId: "user-1",
    type: "offer",
    title: "Offer Accepted",
    message: "Your offer has been accepted",
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { redirectUrl: "/home/user/offers" },
    ...overrides,
  };
}

describe("DetailNotificationModal Go to button (Property 6)", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
  });

  it("renders 'Go to' button when notification has a valid redirectUrl", () => {
    render(
      <NotificationModal
        notification={makeNotification({ data: { redirectUrl: "/home/user/offers" } })}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("button", { name: /go to/i })).toBeDefined();
  });

  it("does NOT render 'Go to' button when redirectUrl is '/'", () => {
    render(
      <NotificationModal
        notification={makeNotification({ data: { redirectUrl: "/" } })}
        onClose={onClose}
      />
    );

    expect(screen.queryByRole("button", { name: /go to/i })).toBeNull();
  });

  it("does NOT render 'Go to' button when redirectUrl is missing", () => {
    render(
      <NotificationModal
        notification={makeNotification({ data: {} })}
        onClose={onClose}
      />
    );

    expect(screen.queryByRole("button", { name: /go to/i })).toBeNull();
  });

  it("does NOT render 'Go to' button when data is missing entirely", () => {
    render(
      <NotificationModal
        notification={makeNotification({ data: undefined })}
        onClose={onClose}
      />
    );

    expect(screen.queryByRole("button", { name: /go to/i })).toBeNull();
  });

  it("always renders 'Close' button regardless of redirectUrl", () => {
    const cases = [
      { data: { redirectUrl: "/home/user/offers" } },
      { data: { redirectUrl: "/" } },
      { data: {} },
      { data: undefined },
    ];

    cases.forEach((overrides, i) => {
      const { unmount } = render(
        <NotificationModal
          notification={makeNotification({ _id: `close-${i}`, ...overrides })}
          onClose={onClose}
        />
      );

      expect(screen.getByRole("button", { name: /close/i })).toBeDefined();
      unmount();
    });
  });

  it("calls onClose and router.push with correct URL when 'Go to' is clicked", () => {
    const redirectUrl = "/vendor/dashboard/offers";
    render(
      <NotificationModal
        notification={makeNotification({ data: { redirectUrl } })}
        onClose={onClose}
      />
    );

    const goToButton = screen.getByRole("button", { name: /go to/i });
    fireEvent.click(goToButton);

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(redirectUrl);
  });

  it("calls onClose when 'Close' button is clicked", () => {
    render(
      <NotificationModal
        notification={makeNotification()}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
