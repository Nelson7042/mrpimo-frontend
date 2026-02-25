/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Feature: notification-routing-offers, Property 12: Buyer offers page displays all required offer information
// Validates: Requirements 10.2, 10.3, 10.4

// ── Mock useUserOffers ──────────────────────────────────────────────────────
let mockOffersData: any[] | undefined = undefined;
let mockIsLoading = false;
const mockRefetch = vi.fn();

vi.mock("@/hooks/useOffers", () => ({
  useUserOffers: () => ({
    data: mockOffersData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  }),
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── Mock fetchWithAuth ──────────────────────────────────────────────────────
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }),
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
  ExternalLink: (props: any) => <span data-testid="external-link-icon" />,
}));

// ── Mock date-fns ───────────────────────────────────────────────────────────
vi.mock("date-fns", () => ({
  format: (date: Date, formatStr: string) => "Jan 15, 2025 at 2:30 PM",
}));

// ── Mock Breadcrumbs ────────────────────────────────────────────────────────
vi.mock("@/components/BraedCrumbs", () => ({
  Breadcrumbs: ({ items }: any) => (
    <nav data-testid="breadcrumbs">
      {items?.map((item: any, i: number) => (
        <span key={i}>{item.label}</span>
      ))}
    </nav>
  ),
  BreadcrumbItem: {},
}));

import OffersPage from "../page";

// ── Test Data ───────────────────────────────────────────────────────────────
const mockGroupedOffers = [
  {
    productId: "prod-1",
    name: "Vintage Watch",
    slug: "vintage-watch",
    offers: [
      {
        _id: "offer-1",
        userId: "user-1",
        productId: "prod-1",
        vendorId: "vendor-1",
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
        userId: "user-1",
        productId: "prod-1",
        vendorId: "vendor-1",
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
        userId: "user-1",
        productId: "prod-1",
        vendorId: "vendor-1",
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
        userId: "user-1",
        productId: "prod-1",
        vendorId: "vendor-1",
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
        userId: "vendor-1",
        productId: "prod-1",
        vendorId: "vendor-1",
        variantId: "var-1",
        optionId: "opt-1",
        amount: 175.0,
        currency: "USD",
        status: "pending",
        type: "counter-offer",
        createdAt: "2025-01-16T10:00:00.000Z",
      },
      {
        _id: "counter-2",
        userId: "vendor-1",
        productId: "prod-1",
        vendorId: "vendor-1",
        variantId: "var-3",
        optionId: "opt-3",
        amount: 90.0,
        currency: "USD",
        status: "rejected",
        type: "counter-offer",
        createdAt: "2025-01-09T11:00:00.000Z",
      },
    ],
  },
];

describe("Buyer Offers Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOffersData = undefined;
    mockIsLoading = false;
  });

  describe("Loading state", () => {
    it("renders loading spinner when data is loading", () => {
      mockIsLoading = true;
      render(<OffersPage />);
      expect(screen.getByTestId("loader-icon")).toBeDefined();
    });

    it("does not render offers content while loading", () => {
      mockIsLoading = true;
      render(<OffersPage />);
      expect(screen.queryByText("My Offers")).toBeNull();
    });
  });

  describe("Empty state", () => {
    it("renders empty state when there are no offers", () => {
      mockOffersData = [];
      render(<OffersPage />);
      expect(screen.getByText("No offers yet")).toBeDefined();
      expect(
        screen.getByText("Browse products and make offers to see them here")
      ).toBeDefined();
    });

    it("renders Browse Products button in empty state", () => {
      mockOffersData = [];
      render(<OffersPage />);
      const browseBtn = screen.getByText("Browse Products");
      expect(browseBtn).toBeDefined();
      fireEvent.click(browseBtn);
      expect(mockPush).toHaveBeenCalledWith("/home");
    });
  });

  describe("Populated offers", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("renders product name as group header", () => {
      render(<OffersPage />);
      expect(screen.getByText("Vintage Watch")).toBeDefined();
    });

    it("renders offer amounts with currency", () => {
      render(<OffersPage />);
      expect(screen.getByText(/\$150\.00/)).toBeDefined();
      expect(screen.getByText(/\$200\.00/)).toBeDefined();
      expect(screen.getByText(/\$75\.50/)).toBeDefined();
      expect(screen.getByText(/\$50\.00/)).toBeDefined();
    });

    it("renders status badges for all offer statuses", () => {
      render(<OffersPage />);
      // All four statuses should be displayed as capitalized text
      const pendingBadges = screen.getAllByText("pending");
      expect(pendingBadges.length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("accepted").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("rejected").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("expired").length).toBeGreaterThanOrEqual(1);
    });

    it("renders timestamps for offers", () => {
      render(<OffersPage />);
      // date-fns format is mocked to return a fixed string
      const timestamps = screen.getAllByText(/Jan 15, 2025 at 2:30 PM/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe("Counter-offer Accept/Reject buttons", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("renders Accept and Reject buttons for pending counter-offers", () => {
      render(<OffersPage />);
      // The pending counter-offer (counter-1) matches offer-1's variantId/optionId
      expect(screen.getByText("Accept")).toBeDefined();
      expect(screen.getByText("Reject")).toBeDefined();
    });

    it("displays counter-offer amount in the counter-offer section", () => {
      render(<OffersPage />);
      // Counter offer amount $175.00
      expect(screen.getByText(/\$175\.00/)).toBeDefined();
    });
  });

  describe("Go to Product link for accepted offers", () => {
    beforeEach(() => {
      mockOffersData = mockGroupedOffers;
    });

    it("renders 'Go to Product' button for accepted offers", () => {
      render(<OffersPage />);
      expect(screen.getByText("Go to Product")).toBeDefined();
    });

    it("navigates to product page when 'Go to Product' is clicked", () => {
      render(<OffersPage />);
      const goToProductBtn = screen.getByText("Go to Product");
      fireEvent.click(goToProductBtn);
      expect(mockPush).toHaveBeenCalledWith(
        "/home/product-details/vintage-watch"
      );
    });

    it("does not render 'Go to Product' for non-accepted offers", () => {
      // Use only pending offers
      mockOffersData = [
        {
          productId: "prod-2",
          name: "Test Product",
          slug: "test-product",
          offers: [
            {
              _id: "offer-only-pending",
              userId: "user-1",
              productId: "prod-2",
              vendorId: "vendor-1",
              variantId: "var-1",
              optionId: "opt-1",
              amount: 100.0,
              currency: "USD",
              status: "pending",
              type: "offer",
              createdAt: "2025-01-15T14:30:00.000Z",
            },
          ],
          counterOffers: [],
        },
      ];
      render(<OffersPage />);
      expect(screen.queryByText("Go to Product")).toBeNull();
    });
  });

  describe("Breadcrumbs", () => {
    it("renders breadcrumbs with 'My Offers' label", () => {
      mockOffersData = [];
      render(<OffersPage />);
      expect(screen.getByTestId("breadcrumbs")).toBeDefined();
      // "My Offers" appears in both breadcrumbs and the page heading
      const myOffersElements = screen.getAllByText("My Offers");
      expect(myOffersElements.length).toBeGreaterThanOrEqual(2);
    });
  });
});
