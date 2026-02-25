/**
 * @vitest-environment jsdom
 */
import React from "react";
// Ensure React is available globally for components using the automatic JSX runtime
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Mock data ───────────────────────────────────────────────────────────────
const mockDisputes = [
  {
    _id: "dispute1",
    caseId: "CASE-1234567890-0001",
    orderId: { _id: "order1" },
    reason: "Product Defective",
    status: "open",
    priority: "medium",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    _id: "dispute2",
    caseId: "CASE-1234567890-0002",
    orderId: { _id: "order2" },
    reason: "Wrong Item Received",
    status: "resolved",
    priority: "high",
    createdAt: "2025-01-14T10:00:00.000Z",
  },
];

// ── Mock disputeService ─────────────────────────────────────────────────────
const mockGetMyDisputes = vi.fn();

vi.mock("@/services/disputeService", () => ({
  disputeService: {
    getMyDisputes: (...args: any[]) => mockGetMyDisputes(...args),
  },
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── Mock UI components ──────────────────────────────────────────────────────
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/BraedCrumbs", () => ({
  Breadcrumbs: ({ items, className }: any) => (
    <nav data-testid="breadcrumbs" className={className}>Breadcrumbs</nav>
  ),
  BreadcrumbItem: {},
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => <span data-testid="loader2" className={className} />,
  AlertTriangle: ({ className }: any) => <span data-testid="alert-triangle" className={className} />,
  ChevronLeft: ({ className }: any) => <span data-testid="chevron-left" className={className} />,
  ChevronRight: ({ className }: any) => <span data-testid="chevron-right" className={className} />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import BuyerDisputesPage from "@/app/home/user/disputes/page";

// ═══════════════════════════════════════════════════════════════════════════
// Task 14.1 – Buyer disputes list page tests
// ═══════════════════════════════════════════════════════════════════════════
describe("BuyerDisputesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMyDisputes.mockResolvedValue({
      issues: mockDisputes,
      pagination: { pages: 1 },
    });
  });

  /**
   * Validates: Requirement 8.2
   * THE Buyer_Dashboard SHALL display each dispute's caseId, order reference,
   * reason, status, priority, and creation date.
   */
  it("renders the correct column headers", async () => {
    render(<BuyerDisputesPage />);

    await waitFor(() => {
      expect(screen.getByText("Case ID")).toBeTruthy();
    });

    expect(screen.getByText("Order")).toBeTruthy();
    expect(screen.getByText("Reason")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Priority")).toBeTruthy();
    expect(screen.getByText("Created")).toBeTruthy();
  });

  /**
   * Validates: Requirement 8.2
   * Dispute data is rendered in the correct columns (mobile + desktop views).
   */
  it("renders dispute data in the table rows", async () => {
    render(<BuyerDisputesPage />);

    await waitFor(() => {
      // Each dispute renders in both mobile card and desktop row
      expect(screen.getAllByText("CASE-1234567890-0001")).toHaveLength(2);
    });

    // Case IDs (2 each: mobile + desktop)
    expect(screen.getAllByText("CASE-1234567890-0002")).toHaveLength(2);

    // Reasons (2 each: mobile + desktop)
    expect(screen.getAllByText("Product Defective")).toHaveLength(2);
    expect(screen.getAllByText("Wrong Item Received")).toHaveLength(2);

    // Status badges (2 each: mobile + desktop)
    expect(screen.getAllByText("open")).toHaveLength(2);
    expect(screen.getAllByText("resolved")).toHaveLength(2);

    // Priority badges (2 each: mobile + desktop)
    expect(screen.getAllByText("medium")).toHaveLength(2);
    expect(screen.getAllByText("high")).toHaveLength(2);

    // Dates (2 each: mobile + desktop)
    expect(screen.getAllByText("Jan 15, 2025")).toHaveLength(2);
    expect(screen.getAllByText("Jan 14, 2025")).toHaveLength(2);
  });

  /**
   * Validates: Requirement 8.3
   * THE Buyer_Dashboard SHALL allow filtering disputes by status.
   */
  it("renders status filter tabs", async () => {
    render(<BuyerDisputesPage />);

    await waitFor(() => {
      expect(screen.getByText("All")).toBeTruthy();
    });

    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("In-progress")).toBeTruthy();
    expect(screen.getByText("Resolved")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
  });

  /**
   * Validates: Requirement 8.3
   * Clicking a status tab calls getMyDisputes with the correct status filter.
   */
  it("calls getMyDisputes with status filter when tab is clicked", async () => {
    render(<BuyerDisputesPage />);

    // Wait for initial load (called with "all" tab, no status param)
    await waitFor(() => {
      expect(mockGetMyDisputes).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    mockGetMyDisputes.mockClear();

    // Click "Open" tab
    fireEvent.click(screen.getByText("Open"));

    await waitFor(() => {
      expect(mockGetMyDisputes).toHaveBeenCalledWith({
        status: "open",
        page: 1,
        limit: 10,
      });
    });
  });

  /**
   * Validates: Requirement 8.2
   * Shows "No disputes found" when the list is empty.
   */
  it('shows "No disputes found" when the list is empty', async () => {
    mockGetMyDisputes.mockResolvedValue({
      issues: [],
      pagination: { pages: 1 },
    });

    render(<BuyerDisputesPage />);

    await waitFor(() => {
      expect(screen.getByText("No disputes found")).toBeTruthy();
    });
  });
});
