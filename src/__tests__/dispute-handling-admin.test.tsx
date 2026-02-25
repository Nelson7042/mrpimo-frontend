/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ── Mock data helper ────────────────────────────────────────────────────────
const createMockDispute = (overrides: any = {}) => ({
  _id: "test-issue-id",
  caseId: "CASE-1234567890-0001",
  orderId: {
    _id: "order1",
    shipments: [
      { vendorId: { businessInfo: { name: "Test Vendor" } } },
    ],
  },
  userId: {
    _id: "buyer1",
    email: "buyer@test.com",
    profile: { firstName: "John", lastName: "Doe" },
  },
  assignedTo: {
    _id: "admin1",
    email: "admin@test.com",
    profile: { firstName: "Admin", lastName: "User" },
  },
  reason: "Product Defective",
  description: "The product arrived broken",
  status: "open",
  priority: "medium",
  evidenceUrls: [],
  vendorEvidenceUrls: [],
  vendorResponse: null,
  resolutionOutcome: null,
  resolution: null,
  createdAt: "2025-01-15T10:00:00.000Z",
  ...overrides,
});

// ── Mock disputeService ─────────────────────────────────────────────────────
const mockGetAdminDisputeDetail = vi.fn();

vi.mock("@/services/disputeService", () => ({
  disputeService: {
    getAdminDisputeDetail: (...args: any[]) => mockGetAdminDisputeDetail(...args),
    assignDispute: vi.fn(),
    updatePriority: vi.fn(),
    resolveDispute: vi.fn(),
  },
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ issueId: "test-issue-id" }),
  useRouter: () => ({ push: mockPush }),
}));

// ── Mock fetchWithAuth (for DisputeChat + refund) ───────────────────────────
vi.mock("@/utils/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { messages: [] } }),
  }),
}));

// ── Mock config ─────────────────────────────────────────────────────────────
vi.mock("@/utils/config", () => ({
  API_BASE_URL: "http://localhost:3000",
}));

// ── Mock react-hot-toast ────────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Mock UI components ──────────────────────────────────────────────────────
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, type, disabled, className, variant, size, ...rest }: any) => (
    <button onClick={onClick} type={type} disabled={disabled} className={className} {...rest}>
      {children}
    </button>
  ),
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => <span data-testid="loader2" className={className} />,
  ArrowLeft: ({ className }: any) => <span data-testid="arrow-left" className={className} />,
  Send: ({ className }: any) => <span data-testid="send" className={className} />,
  Image: ({ className }: any) => <span data-testid="image-icon" className={className} />,
  MessageSquare: ({ className }: any) => <span data-testid="message-square" className={className} />,
  FileText: ({ className }: any) => <span data-testid="file-text" className={className} />,
  DollarSign: ({ className }: any) => <span data-testid="dollar-sign" className={className} />,
  AlertTriangle: ({ className }: any) => <span data-testid="alert-triangle" className={className} />,
  UserCheck: ({ className }: any) => <span data-testid="user-check" className={className} />,
  Shield: ({ className }: any) => <span data-testid="shield" className={className} />,
  CheckCircle: ({ className }: any) => <span data-testid="check-circle" className={className} />,
  Package: ({ className }: any) => <span data-testid="package" className={className} />,
  User: ({ className }: any) => <span data-testid="user" className={className} />,
  Store: ({ className }: any) => <span data-testid="store" className={className} />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import AdminDisputeDetailPage from "@/app/admin/disputes/[issueId]/page";

// ═══════════════════════════════════════════════════════════════════════════
// Task 14.3 – Admin dispute detail page: resolution form + Process Refund
// Validates: Requirements 10.6, 10.7
// ═══════════════════════════════════════════════════════════════════════════
describe("AdminDisputeDetailPage – resolution form and Process Refund button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 10.6
   * When dispute is "open", clicking "Resolve Dispute" shows the resolution form.
   */
  it('shows resolution form when "Resolve Dispute" is clicked on an open dispute', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(createMockDispute({ status: "open" }));

    render(<AdminDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Resolve Dispute")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Resolve Dispute"));

    await waitFor(() => {
      expect(screen.getByText("Resolution Form")).toBeTruthy();
    });
    expect(screen.getByText("Confirm Resolution")).toBeTruthy();
  });

  /**
   * Validates: Requirement 10.6
   * When resolution form is shown and "partial_refund" is selected,
   * the partial refund amount field appears.
   */
  it('shows partial refund amount field when "partial_refund" is selected', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(createMockDispute({ status: "open" }));

    render(<AdminDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Resolve Dispute")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Resolve Dispute"));

    await waitFor(() => {
      expect(screen.getByText("Resolution Form")).toBeTruthy();
    });

    // Select partial_refund
    const outcomeSelect = screen.getByDisplayValue("Select outcome...");
    fireEvent.change(outcomeSelect, { target: { value: "partial_refund" } });

    await waitFor(() => {
      expect(screen.getByText("Partial Refund Amount ($)")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("0.00")).toBeTruthy();
  });

  /**
   * Validates: Requirement 10.6
   * When resolution form is shown and "full_refund" is selected,
   * the partial refund amount field does NOT appear.
   */
  it('does NOT show partial refund amount field when "full_refund" is selected', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(createMockDispute({ status: "open" }));

    render(<AdminDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Resolve Dispute")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Resolve Dispute"));

    await waitFor(() => {
      expect(screen.getByText("Resolution Form")).toBeTruthy();
    });

    // Select full_refund
    const outcomeSelect = screen.getByDisplayValue("Select outcome...");
    fireEvent.change(outcomeSelect, { target: { value: "full_refund" } });

    expect(screen.queryByText("Partial Refund Amount ($)")).toBeNull();
    expect(screen.queryByPlaceholderText("0.00")).toBeNull();
  });

  /**
   * Validates: Requirement 10.7
   * When dispute is "resolved" with resolutionOutcome "full_refund",
   * "Process Refund" button is visible.
   */
  it('shows "Process Refund" button for resolved dispute with full_refund outcome', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(
      createMockDispute({ status: "resolved", resolutionOutcome: "full_refund" })
    );

    render(<AdminDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Process Refund")).toBeTruthy();
    });
  });

  /**
   * Validates: Requirement 10.7
   * When dispute is "resolved" with resolutionOutcome "partial_refund",
   * "Process Refund" button is visible.
   */
  it('shows "Process Refund" button for resolved dispute with partial_refund outcome', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(
      createMockDispute({ status: "resolved", resolutionOutcome: "partial_refund" })
    );

    render(<AdminDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Process Refund")).toBeTruthy();
    });
  });

  /**
   * Validates: Requirement 10.7
   * When dispute is "resolved" with resolutionOutcome "product_replacement",
   * "Process Refund" button is NOT visible.
   */
  it('does NOT show "Process Refund" button for resolved dispute with product_replacement outcome', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(
      createMockDispute({ status: "resolved", resolutionOutcome: "product_replacement" })
    );

    render(<AdminDisputeDetailPage />);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText("Product Defective")).toBeTruthy();
    });

    expect(screen.queryByText("Process Refund")).toBeNull();
  });

  /**
   * Validates: Requirement 10.7
   * When dispute is "open" (not resolved), "Process Refund" button is NOT visible.
   */
  it('does NOT show "Process Refund" button for open dispute', async () => {
    mockGetAdminDisputeDetail.mockResolvedValue(createMockDispute({ status: "open" }));

    render(<AdminDisputeDetailPage />);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText("Resolve Dispute")).toBeTruthy();
    });

    expect(screen.queryByText("Process Refund")).toBeNull();
  });
});
