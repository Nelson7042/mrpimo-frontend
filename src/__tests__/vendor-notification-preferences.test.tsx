/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Mock stores ─────────────────────────────────────────────────────────────
const mockVendor = {
  _id: "vendor1",
  accountType: "personal" as const,
  kycStatus: "verified" as const,
  status: "active" as const,
  notificationPreferences: {
    newOrder: true,
    orderStatusChange: false,
    payoutProcessed: true,
    lowStockAlert: false,
    disputeNotification: true,
  },
  settings: {
    autoAcceptOrders: false,
    minOrderAmount: 0,
    shippingMethods: [],
  },
  analytics: {
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
    productCount: 0,
    spentAdsCredit: 0,
    collectionProducts: 0,
    activeCollectionProducts: 0,
    payoutRequests: 0,
    adsCreated: 0,
    bulkUploadsUsed: 0,
    analyticsViews: 0,
    totalFulfilledOrders: 0,
  },
  verificationDocuments: [],
  stripeVerificationStatus: "unverified",
  wallet: { balance: 0, pending: 0 },
  subscription: { currentPlan: "free", isTrial: false, startDate: new Date(), status: "active" as const },
};

const mockUser = {
  _id: "user1",
  email: "vendor@test.com",
  twoFactorAuth: { enabled: false },
};

vi.mock("@/stores/useVendorStore", () => ({
  useVendorStore: () => ({ vendor: mockVendor }),
}));

vi.mock("@/stores/useUserStore", () => ({
  useUserStore: Object.assign(
    () => ({ user: mockUser, setUser: vi.fn() }),
    { getState: () => ({ user: mockUser, setUser: vi.fn(), resetStore: vi.fn() }) }
  ),
}));

vi.mock("@/stores/useKybStore", () => ({
  useKybStore: () => ({ setCurrentStep: vi.fn() }),
}));

// ── Mock fetchWithAuth ──────────────────────────────────────────────────────
const mockFetchWithAuth = vi.fn();
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: (...args: any[]) => mockFetchWithAuth(...args),
}));

// ── Mock toast ──────────────────────────────────────────────────────────────
const mockToastError = vi.fn();
vi.mock("react-toastify", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

vi.mock("@/app/config/toast.config", () => ({
  toastConfigError: {},
  toastConfigSuccess: {},
}));

// ── Mock child components ───────────────────────────────────────────────────
vi.mock("../app/vendor/dashboard/settings/components/TwoFactorSetup", () => ({
  default: () => <div data-testid="two-factor-setup" />,
}));
vi.mock("../app/vendor/dashboard/settings/components/DisableTwoFactor", () => ({
  default: () => <div data-testid="disable-two-factor" />,
}));
vi.mock("../app/vendor/dashboard/settings/components/PushNotification", () => ({
  default: () => <div data-testid="push-notification" />,
}));
vi.mock("../app/vendor/dashboard/settings/components/VendorPickupLocation", () => ({
  default: () => <div data-testid="vendor-pickup-location" />,
}));
vi.mock("../app/vendor/dashboard/settings/components/UpgradeToBusinessAccount", () => ({
  default: () => <div data-testid="upgrade-business" />,
}));
vi.mock("@/components/KybModal", () => ({
  default: () => <div data-testid="kyb-modal" />,
}));

// ── Import component under test ─────────────────────────────────────────────
import SettingsPage from "../app/vendor/dashboard/settings/page";

describe("Vendor Notification Preferences (Task 13.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithAuth.mockResolvedValue({ ok: true });
  });

  it("displays all 5 notification preference toggles", () => {
    render(<SettingsPage />);

    expect(screen.getByText("New Order Received")).toBeDefined();
    expect(screen.getByText("Order Status Changes")).toBeDefined();
    expect(screen.getByText("Payout Processed")).toBeDefined();
    expect(screen.getByText("Low Stock Alerts")).toBeDefined();
    expect(screen.getByText("Dispute Notifications")).toBeDefined();
  });

  it("displays descriptions for each notification preference", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Get notified when a buyer places a new order for your products")).toBeDefined();
    expect(screen.getByText(/when an order status changes/)).toBeDefined();
    expect(screen.getByText(/when a payout to your bank account/)).toBeDefined();
    expect(screen.getByText(/when your product inventory drops/)).toBeDefined();
    expect(screen.getByText(/when a buyer opens or updates a dispute/)).toBeDefined();
  });

  it("initializes toggles from vendor profile preferences", () => {
    render(<SettingsPage />);

    // Find all checkboxes in the notification preferences section
    const checkboxes = screen.getAllByRole("checkbox");
    // The notification preferences checkboxes are after the auto-accept orders checkbox
    // Find them by their associated labels
    const newOrderToggle = screen.getByText("New Order Received").closest("div")?.parentElement?.querySelector("input[type='checkbox']");
    const orderStatusToggle = screen.getByText("Order Status Changes").closest("div")?.parentElement?.querySelector("input[type='checkbox']");
    const payoutToggle = screen.getByText("Payout Processed").closest("div")?.parentElement?.querySelector("input[type='checkbox']");
    const lowStockToggle = screen.getByText("Low Stock Alerts").closest("div")?.parentElement?.querySelector("input[type='checkbox']");
    const disputeToggle = screen.getByText("Dispute Notifications").closest("div")?.parentElement?.querySelector("input[type='checkbox']");

    expect((newOrderToggle as HTMLInputElement)?.checked).toBe(true);
    expect((orderStatusToggle as HTMLInputElement)?.checked).toBe(false);
    expect((payoutToggle as HTMLInputElement)?.checked).toBe(true);
    expect((lowStockToggle as HTMLInputElement)?.checked).toBe(false);
    expect((disputeToggle as HTMLInputElement)?.checked).toBe(true);
  });

  it("sends PATCH request on toggle change", async () => {
    render(<SettingsPage />);

    const orderStatusToggle = screen.getByText("Order Status Changes").closest("div")?.parentElement?.querySelector("input[type='checkbox']");
    fireEvent.click(orderStatusToggle!);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining("/vendors/notification-preferences"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ orderStatusChange: true }),
        })
      );
    });
  });

  it("reverts toggle and shows error toast on API failure", async () => {
    mockFetchWithAuth.mockRejectedValueOnce(new Error("Network error"));

    render(<SettingsPage />);

    // orderStatusChange starts as false (from vendor profile)
    const orderStatusToggle = screen.getByText("Order Status Changes").closest("div")?.parentElement?.querySelector("input[type='checkbox']") as HTMLInputElement;
    expect(orderStatusToggle.checked).toBe(false);

    fireEvent.click(orderStatusToggle);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to update notification preference",
        expect.anything()
      );
      // Toggle should revert to false
      expect(orderStatusToggle.checked).toBe(false);
    });
  });
});
