/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Feature: notification-routing-offers, Property 13: Vendor offers page displays all required offer information with actions
// Validates: Requirements 11.2, 11.3, 11.4

// ── Mock useVendorOffers ────────────────────────────────────────────────────
let mockOffersData: any[] | undefined = undefined;
let mockIsLoading = false;
const mockRefetch = vi.fn();

vi.mock("@/hooks/useOffers", () => ({
  useVendorOffers: () => ({
    data: mockOffersData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  }),
}));

// ── Mock useVendorStore ─────────────────────────────────────────────────────
vi.mock("@/stores/useVendorStore", () => ({
  useVendorStore: () => ({
    vendor: { _id: "vendor-123", userId: "user-vendor-123" },
  }),
}));

// ── Mock fetchWithAuth ──────────────────────────────────────────────────────
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  }),
}));

// ── Mock react-toastify ─────────────────────────────────────────────────────
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock config ─────────────────────────────────────────────────────────────
vi.mock("@/utils/config", () => ({
  API_BASE_URL: "http://localhost:3001/api",
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Loader2: (props: any) => <span data-testid="loader-icon" className={props.className} />,
  Tag: (props: any) => <span data-testid="tag-icon" />,
  Clock: (props: any) => <span data-testid="clock-icon" />,
  CheckCircle: (props: any) => <span data-testid="check-circle-icon" />,
  XCircle: (props: any) => <span data-testid="x-circle-icon" />,
  AlertCircle: (props: any) => <span data-testid="alert-circle-icon" />,
  Send: (props: any) => <span data-testid="send-icon" />,
}));

// ── Mock date-fns ───────────────────────────────────────────────────────────
vi.mock("date-fns", () => ({
  format: (date: Date, formatStr: string) => "Jan 15, 2025 at 2:30 PM",
}));

import VendorOffersPage from "../page";

// ── Test Data ───────────────────────────────────────────────────────────────
const mockGroupedOffers = [
  {
    productId: "prod-1",
    name: "Vintage Watch",
    slug: "vintage-watch",
    offers: [
      {
        _id: "offer-1",
        userId: {
          profile: { firstName: "John", lastName: "Doe" },
        },
        productId: "prod-1",
        vendorId: "vendor-123",
        variantId: "var-1",
        optionId: "opt-1",
        amount: 150.0,
        currency: "USD",
        status: "pending",
        type: "offer",
        expiresAt: "2025-02-15T00:00:00.000Z",
        createdAt: "2025-01-15T14:30:00.000Z",
      },
      {
        _id: "offer-2",
        userId: {
          profile: { firstName: "Jane", lastName: "Smith" },
        },
        productId: "prod-1",
        vendorId: "vendor-123",
        variantId: "var-2",
        optionId: "opt-2",
        amount: 200.0,
        currency: "USD",
        status: "accepted",
        type: "offer",
        createdAt: "2025-01-10T10:00:00.000Z",
      },
      {
        _id: "offer-3",
        userId: {
          profile: { firstName: "Bob", lastName: "Wilson" },
        },
        productId: "prod-1",
        vendorId: "vendor-123",
        variantId: "var-3",
        optionId: "opt-3",
        amount: 75.5,
        currency: "USD",
        status: "rejected",
        type: "offer",
        createdAt: "2025-01-08T09:00:00.000Z",
      },
      {
        _id: "offer-4",
        userId: "unknown-user-id",
        productId: "prod-1",
        vendorId: "vendor-123",
        variantId: "var-4",
        optionId: "opt-4",
        amount: 50.0,
        currency: "USD",
        status: "expired",
        type: "offer",
        createdAt: "2025-01-05T08:00:00.000Z",
      },
    ],
    counterOffers: [
      {
        _id: "counter-1",
        userId: {
          profile: { firstName: "John", lastName: "Doe" },
        },
        productId: "prod-1",
        vendorId: "vendor-123",
        variantId: "var-1",
        optionId: "opt-1",
        amount: 175.0,
        currency: "USD",
        status: "pending",
        type: "counter-offer",
        createdAt: "2025-01-16T10:00:00.000Z",
      },
    ],
  },
];

describe("Vendor Offers Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOffersData = undefined;
    mockIsLoading = false;
  });

  describe("Loading state", () => {
    it("renders loading spinner when data is loading", () => {
      mockIsLoading = true;
      render(<VendorOffersPage />);
      expect(screen.getByTestId("loader-icon")).toBeDefined();
    });

    it("does not render offers content while loading", () => {
      mockIsLoading = true;
      render(<VendorOffersPage />);
      expect(screen.queryByText("Offers")).toBeNull();
    });
  });

  describe("Empty state", () => {
    it("renders empty state when there are no offers", () => {
      mockOffersData = [];
      render(<VendorOffersPage />);
      expect(screen.getByText("No offers yet")).toBeDefined();
      expect(
        screen.getByText(
          "When buyers make offers on your products, they will appear here"
        )
      ).toBeDefined();
    });
  });

  describe("Populated offers", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("renders product name as group header", () => {
      render(<VendorOffersPage />);
      expect(screen.getByText("Vintage Watch")).toBeDefined();
    });

    it("renders buyer names for offers", () => {
      render(<VendorOffersPage />);
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Jane Smith")).toBeDefined();
      expect(screen.getByText("Bob Wilson")).toBeDefined();
    });

    it("renders 'Unknown Buyer' for string userId", () => {
      render(<VendorOffersPage />);
      expect(screen.getByText("Unknown Buyer")).toBeDefined();
    });

    it("renders offer amounts with currency", () => {
      render(<VendorOffersPage />);
      expect(screen.getByText(/\$150\.00/)).toBeDefined();
      expect(screen.getByText(/\$200\.00/)).toBeDefined();
      expect(screen.getByText(/\$75\.50/)).toBeDefined();
      expect(screen.getByText(/\$50\.00/)).toBeDefined();
    });

    it("renders status badges for all offer statuses", () => {
      render(<VendorOffersPage />);
      const pendingBadges = screen.getAllByText("pending");
      expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("accepted").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("rejected").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("expired").length).toBeGreaterThanOrEqual(1);
    });

    it("renders timestamps for offers", () => {
      render(<VendorOffersPage />);
      const timestamps = screen.getAllByText(/Jan 15, 2025 at 2:30 PM/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe("Action buttons for pending offers", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("renders Accept, Reject, and Counter Offer buttons for pending offers", () => {
      render(<VendorOffersPage />);
      expect(screen.getByRole("button", { name: /Accept/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Reject/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Counter Offer/i })).toBeDefined();
    });

    it("does not render action buttons for non-pending offers", () => {
      mockOffersData = [
        {
          productId: "prod-2",
          name: "Test Product",
          slug: "test-product",
          offers: [
            {
              _id: "offer-accepted-only",
              userId: { profile: { firstName: "Alice", lastName: "Brown" } },
              productId: "prod-2",
              vendorId: "vendor-123",
              variantId: "var-1",
              optionId: "opt-1",
              amount: 100.0,
              currency: "USD",
              status: "accepted",
              type: "offer",
              createdAt: "2025-01-15T14:30:00.000Z",
            },
          ],
          counterOffers: [],
        },
      ];
      render(<VendorOffersPage />);
      expect(screen.queryByText("Accept")).toBeNull();
      expect(screen.queryByText("Reject")).toBeNull();
      expect(screen.queryByText("Counter Offer")).toBeNull();
    });
  });

  describe("Counter offer input", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("shows counter offer input field when Counter Offer button is clicked", () => {
      render(<VendorOffersPage />);
      // Use getByRole to target the button specifically (not the section label)
      const counterOfferBtn = screen.getByRole("button", { name: /Counter Offer/i });
      fireEvent.click(counterOfferBtn);

      expect(screen.getByText("Counter offer amount:")).toBeDefined();
      expect(screen.getByPlaceholderText("Enter amount")).toBeDefined();
      expect(screen.getByText("Submit")).toBeDefined();
    });

    it("hides counter offer input when Counter Offer button is clicked again", () => {
      render(<VendorOffersPage />);
      const counterOfferBtn = screen.getByRole("button", { name: /Counter Offer/i });

      // Open
      fireEvent.click(counterOfferBtn);
      expect(screen.getByPlaceholderText("Enter amount")).toBeDefined();

      // Close (toggle)
      fireEvent.click(counterOfferBtn);
      expect(screen.queryByPlaceholderText("Enter amount")).toBeNull();
    });

    it("allows typing in the counter offer amount input", () => {
      render(<VendorOffersPage />);
      const counterOfferBtn = screen.getByRole("button", { name: /Counter Offer/i });
      fireEvent.click(counterOfferBtn);

      const input = screen.getByPlaceholderText("Enter amount") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "180" } });
      expect(input.value).toBe("180");
    });
  });

  describe("Counter offers section", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("renders counter offer entries with amount", () => {
      render(<VendorOffersPage />);
      expect(screen.getByText(/\$175\.00/)).toBeDefined();
    });

    it("renders 'Counter Offer' label for counter offer entries", () => {
      render(<VendorOffersPage />);
      // The counter offer section has a "Counter Offer" label (uppercase)
      const labels = screen.getAllByText("Counter Offer");
      // At least one is the section label (the other is the button)
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });
  });
});
