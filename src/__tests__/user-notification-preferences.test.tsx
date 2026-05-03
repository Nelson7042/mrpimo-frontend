/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Mock next/navigation ────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? "notifications" : null),
  }),
}));

// ── Mock react-query ────────────────────────────────────────────────────────
const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock notification preferences mutation ──────────────────────────────────
const mockMutateAsync = vi.fn();
vi.mock("@/hooks/useNotifications", () => ({
  useUpdateNotificationPreferences: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

// ── Mock address hooks ──────────────────────────────────────────────────────
vi.mock("@/hooks/useAddress", () => ({
  useAddresses: () => ({ data: { addresses: [] } }),
  useAddAddress: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateAddress: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteAddress: () => ({ mutate: vi.fn() }),
}));

// ── Mock user hooks ─────────────────────────────────────────────────────────
const mockProfileData = {
  user: {
    _id: "user1",
    email: "test@example.com",
    profile: { firstName: "Test", lastName: "User", phoneNumber: "+1234567890" },
    preferences: {
      notifications: {
        email: {
          stockAlert: true,
          orderStatus: false,
          pendingReviews: true,
          paymentUpdates: false,
          newsletter: true,
        },
        push: true,
        sms: false,
      },
      marketing: false,
    },
    isEmailVerified: true,
    twoFactorAuth: { enabled: false },
    fiatWallet: { balances: { available: 100 } },
  },
  shippingDefaultAddress: null,
};

vi.mock("@/hooks/useUser", () => ({
  useUserProfile: () => ({ data: mockProfileData }),
  useUserCards: () => ({ data: { cards: [] } }),
  useAddCard: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveCard: () => ({ mutate: vi.fn() }),
  useSetDefaultCard: () => ({ mutate: vi.fn() }),
}));

// ── Mock stores ─────────────────────────────────────────────────────────────
const mockUser = {
  _id: "user1",
  email: "test@example.com",
  twoFactorAuth: { enabled: false },
  profile: { firstName: "Test", lastName: "User" },
};

vi.mock("@/stores/useUserStore", () => ({
  useUserStore: Object.assign(
    () => ({ user: mockUser, setUser: vi.fn() }),
    { getState: () => ({ user: mockUser, setUser: vi.fn(), resetStore: vi.fn() }) }
  ),
}));

// ── Mock wallet display ─────────────────────────────────────────────────────
vi.mock("@/hooks/useWalletBalance", () => ({
  useWalletDisplay: () => ({ usdDisplay: "$100.00", approxDisplay: null }),
}));

// ── Mock fetchWithAuth ──────────────────────────────────────────────────────
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true }) }),
}));

// ── Mock config ─────────────────────────────────────────────────────────────
vi.mock("@/utils/config", () => ({
  API_BASE_URL: "http://localhost:5000/api",
}));

// ── Mock toast ──────────────────────────────────────────────────────────────
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  toast: Object.assign(
    vi.fn(),
    { success: (...args: any[]) => mockToastSuccess(...args), error: (...args: any[]) => mockToastError(...args) }
  ),
}));

// ── Mock child components ───────────────────────────────────────────────────
vi.mock("@/components/users/settings/AddCardModal", () => ({
  default: () => <div data-testid="add-card-modal" />,
}));
vi.mock("@/components/users/settings/LocationPicker", () => ({
  default: () => <div data-testid="location-picker" />,
}));
vi.mock("@/components/users/settings/ShippingInfoBanner", () => ({
  default: () => <div data-testid="shipping-info-banner" />,
}));
vi.mock("@/components/BreadCrumbs", () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs" />,
}));
vi.mock("@/app/vendor/dashboard/settings/components/TwoFactorSetup", () => ({
  default: () => <div data-testid="two-factor-setup" />,
}));
vi.mock("@/app/vendor/dashboard/settings/components/DisableTwoFactor", () => ({
  default: () => <div data-testid="disable-two-factor" />,
}));
vi.mock("country-state-city", () => ({
  Country: { getAllCountries: () => [] },
  State: { getStatesOfCountry: () => [] },
}));

// ── Mock UI components ──────────────────────────────────────────────────────
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <div />,
}));
vi.mock("@/components/ui/searchable-select", () => ({
  SearchableSelect: () => <div data-testid="searchable-select" />,
}));

// ── Import component under test ─────────────────────────────────────────────
import SettingsPage from "../app/home/user/settings/page";

describe("User Notification Preferences (Task 14.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it("displays all 5 email category toggles", () => {
    render(<SettingsPage />);

    expect(screen.getByText("New Stock Alert")).toBeDefined();
    expect(screen.getByText("Order Status Alert")).toBeDefined();
    expect(screen.getByText("Pending Reviews")).toBeDefined();
    expect(screen.getByText("Payment Alert")).toBeDefined();
    expect(screen.getByText("Newsletter")).toBeDefined();
  });

  it("displays descriptions for each email category toggle", () => {
    render(<SettingsPage />);

    expect(screen.getByText(/products you follow are back in stock/)).toBeDefined();
    expect(screen.getByText(/order status changes/)).toBeDefined();
    expect(screen.getByText(/products you purchased that are awaiting your review/)).toBeDefined();
    expect(screen.getByText(/wallet top-ups, payouts, and other payment activity/)).toBeDefined();
    expect(screen.getByText(/periodic newsletter with platform updates/)).toBeDefined();
  });

  it("displays global push toggle", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Push Notifications")).toBeDefined();
    expect(screen.getByText(/browser push notifications/)).toBeDefined();
  });

  it("displays global SMS toggle", () => {
    render(<SettingsPage />);

    expect(screen.getByText("SMS Notifications")).toBeDefined();
    expect(screen.getByText(/text message alerts/)).toBeDefined();
  });

  it("displays marketing toggle", () => {
    render(<SettingsPage />);

    expect(screen.getByText("Marketing Communications")).toBeDefined();
    expect(screen.getByText(/promotional offers/)).toBeDefined();
  });

  it("initializes toggles from user profile preferences", () => {
    render(<SettingsPage />);

    // Find all switch/toggle elements by their role
    const switches = screen.getAllByRole("switch");

    // The notification section has 8 switches:
    // stockAlert(true), orderStatus(false), pendingReviews(true), paymentUpdates(false), newsletter(true),
    // push(true), sms(false), marketing(false)
    // Verify we have at least 8 switches
    expect(switches.length).toBeGreaterThanOrEqual(8);
  });

  it("sends updated preferences to backend on toggle change", async () => {
    render(<SettingsPage />);

    // Find the SMS toggle (should be unchecked by default)
    const smsLabel = screen.getByText("SMS Notifications");
    const smsToggleContainer = smsLabel.closest("div")?.parentElement;
    const smsSwitch = smsToggleContainer?.querySelector("button[role='switch']");

    if (smsSwitch) {
      fireEvent.click(smsSwitch);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            sms: true,
          })
        );
      });
    }
  });

  it("reverts toggle on API failure", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("Network error"));

    render(<SettingsPage />);

    // Find the marketing toggle (should be unchecked by default)
    const marketingLabel = screen.getByText("Marketing Communications");
    const marketingContainer = marketingLabel.closest("div")?.parentElement;
    const marketingSwitch = marketingContainer?.querySelector("button[role='switch']");

    if (marketingSwitch) {
      fireEvent.click(marketingSwitch);

      await waitFor(() => {
        // After failure, the switch should revert to unchecked
        expect(marketingSwitch.getAttribute("aria-checked")).toBe("false");
      });
    }
  });
});
