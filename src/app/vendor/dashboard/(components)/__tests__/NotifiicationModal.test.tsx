/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Feature: notification-routing-offers, Property 5: NotificationModal renders navigation action based on redirectUrl validity
// Validates: Requirements 5.1, 5.2, 5.3

// ── Mock useNotifications ───────────────────────────────────────────────────
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
let mockNotifications: any[] = [];
let mockUnreadCount = 0;

vi.mock("@/contexts/NotificationContext", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
  }),
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── Mock next/image ─────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// ── Mock lucide-react ───────────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  X: () => <span data-testid="x-icon" />,
  Box: () => <span data-testid="box-icon" />,
  ShoppingBag: () => <span data-testid="shopping-bag-icon" />,
  MessageSquare: () => <span data-testid="message-square-icon" />,
  CheckCircle: () => <span data-testid="check-circle-icon" />,
  CreditCard: () => <span data-testid="credit-card-icon" />,
  Tag: () => <span data-testid="tag-icon" />,
  Wallet: () => <span data-testid="wallet-icon" />,
}));

import NotificationModal from "../NotifiicationModal";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  anchorEl: null,
};

function makeNotification(overrides: Record<string, any> = {}) {
  return {
    _id: "notif-1",
    type: "offer",
    title: "New Offer",
    message: "You received a new offer",
    createdAt: new Date().toISOString(),
    read: false,
    data: { redirectUrl: "/vendor/dashboard/offers" },
    ...overrides,
  };
}

describe("NotificationModal navigation action (Property 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications = [];
    mockUnreadCount = 0;
    defaultProps.onClose = vi.fn();
  });

  describe("View button rendering based on redirectUrl validity", () => {
    it("renders View button for notification with valid redirectUrl", () => {
      mockNotifications = [
        makeNotification({ data: { redirectUrl: "/vendor/dashboard/offers" } }),
      ];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      expect(viewButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("does NOT render View button when redirectUrl is '/'", () => {
      mockNotifications = [
        makeNotification({ _id: "n1", data: { redirectUrl: "/" } }),
      ];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /^view$/i })).toBeNull();
    });

    it("does NOT render View button when redirectUrl is missing", () => {
      mockNotifications = [
        makeNotification({ _id: "n2", data: {} }),
      ];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /^view$/i })).toBeNull();
    });

    it("does NOT render View button when data is missing entirely", () => {
      mockNotifications = [
        makeNotification({ _id: "n3", data: undefined }),
      ];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /^view$/i })).toBeNull();
    });

    it("does NOT render View button for message-type notifications (they have their own View)", () => {
      mockNotifications = [
        makeNotification({
          _id: "msg-1",
          type: "message",
          data: { redirectUrl: "/some/url" },
        }),
      ];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      // Message type has its own View button, but the navigation View button
      // should not render (the condition excludes type === "message")
      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      // Only the message-type View button should exist
      expect(viewButtons).toHaveLength(1);
    });
  });

  describe("View button click flow (mark read + close + navigate)", () => {
    it("calls markAsRead, onClose, and router.push when View button is clicked", () => {
      const notification = makeNotification({
        _id: "click-1",
        data: { redirectUrl: "/vendor/dashboard/offers" },
      });
      mockNotifications = [notification];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      const viewButton = screen.getByRole("button", { name: /view/i });
      fireEvent.click(viewButton);

      expect(mockMarkAsRead).toHaveBeenCalledWith("click-1");
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/vendor/dashboard/offers");
    });

    it("navigates to the correct redirectUrl for buyer-facing notifications", () => {
      const notification = makeNotification({
        _id: "click-2",
        data: { redirectUrl: "/home/user/offers" },
      });
      mockNotifications = [notification];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      const viewButton = screen.getByRole("button", { name: /view/i });
      fireEvent.click(viewButton);

      expect(mockMarkAsRead).toHaveBeenCalledWith("click-2");
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/home/user/offers");
    });
  });

  describe("Notification item click navigation", () => {
    it("navigates when clicking a notification item with valid redirectUrl", () => {
      const notification = makeNotification({
        _id: "item-1",
        data: { redirectUrl: "/vendor/dashboard/offers" },
      });
      mockNotifications = [notification];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      // Click the notification item container (not the View button)
      const notificationItem = screen.getByText("You received a new offer").closest("[class*='p-4']");
      expect(notificationItem).not.toBeNull();
      fireEvent.click(notificationItem!);

      expect(mockMarkAsRead).toHaveBeenCalledWith("item-1");
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/vendor/dashboard/offers");
    });

    it("does NOT navigate when clicking a notification item with '/' redirectUrl", () => {
      const notification = makeNotification({
        _id: "item-2",
        data: { redirectUrl: "/" },
      });
      mockNotifications = [notification];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      const notificationItem = screen.getByText("You received a new offer").closest("[class*='p-4']");
      fireEvent.click(notificationItem!);

      expect(mockMarkAsRead).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does NOT navigate when clicking a notification item with no redirectUrl", () => {
      const notification = makeNotification({
        _id: "item-3",
        data: {},
      });
      mockNotifications = [notification];
      mockUnreadCount = 1;

      render(<NotificationModal {...defaultProps} />);

      const notificationItem = screen.getByText("You received a new offer").closest("[class*='p-4']");
      fireEvent.click(notificationItem!);

      expect(mockMarkAsRead).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Empty state", () => {
    it("shows 'No notifications' when there are no notifications", () => {
      mockNotifications = [];
      render(<NotificationModal {...defaultProps} />);
      expect(screen.getByText("No notifications")).toBeDefined();
    });
  });
});
