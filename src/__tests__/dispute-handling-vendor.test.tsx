/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ── Mock data helper ────────────────────────────────────────────────────────
const createMockDispute = (overrides: any = {}) => ({
  _id: "test-issue-id",
  caseId: "CASE-1234567890-0001",
  orderId: { _id: "order1" },
  userId: {
    _id: "buyer1",
    email: "buyer@test.com",
    profile: { firstName: "John" },
  },
  reason: "Product Defective",
  description: "The product arrived broken",
  status: "open",
  priority: "medium",
  evidenceUrls: [],
  vendorResponse: null,
  vendorEvidenceUrls: [],
  vendorRespondedAt: null,
  resolutionOutcome: null,
  resolution: null,
  createdAt: "2025-01-15T10:00:00.000Z",
  ...overrides,
});

// ── Mock disputeService ─────────────────────────────────────────────────────
const mockGetDisputeDetail = vi.fn();

vi.mock("@/services/disputeService", () => ({
  disputeService: {
    getDisputeDetail: (...args: any[]) => mockGetDisputeDetail(...args),
    submitVendorResponse: vi.fn(),
    updateVendorResponse: vi.fn(),
  },
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ issueId: "test-issue-id" }),
  useRouter: () => ({ push: mockPush }),
}));

// ── Mock fetchWithAuth (for DisputeChat) ────────────────────────────────────
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

// ── Mock useUserStore ───────────────────────────────────────────────────────
vi.mock("@/stores/useUserStore", () => ({
  useUserStore: () => ({ user: { _id: "vendor-user-1" }, setUser: vi.fn() }),
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
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
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
  AlertTriangle: ({ className }: any) => <span data-testid="alert-triangle" className={className} />,
  CheckCircle: ({ className }: any) => <span data-testid="check-circle" className={className} />,
  Clock: ({ className }: any) => <span data-testid="clock" className={className} />,
  ChevronDownIcon: ({ className }: any) => <span data-testid="chevron-down" className={className} />,
  Save: ({ className }: any) => <span data-testid="save" className={className} />,
  Plus: ({ className }: any) => <span data-testid="plus" className={className} />,
  X: ({ className }: any) => <span data-testid="x" className={className} />,
  ExternalLink: ({ className }: any) => <span data-testid="external-link" className={className} />,
  AlertCircle: ({ className }: any) => <span data-testid="alert-circle" className={className} />,
}));

// ── Mock select component (used by DisputeTemplateSelector) ─────────────────
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select a response template...</span>,
}));

// ── Mock textarea component (used by VendorResponseEditor) ──────────────────
vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ placeholder, ...props }: any) => (
    <textarea placeholder={placeholder} {...props} />
  ),
}));

// ── Mock label component (used by VendorResponseEditor) ─────────────────────
vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

// ── Mock dialog component (used by DisputeTemplateSelector) ─────────────────
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import VendorDisputeDetailPage from "@/app/vendor/dashboard/disputes/[issueId]/page";

// ═══════════════════════════════════════════════════════════════════════════
// Task 14.2 – Vendor dispute detail page: response form visibility
// Validates: Requirements 9.5, 9.6 / Property 15
// ═══════════════════════════════════════════════════════════════════════════
describe("VendorDisputeDetailPage – response form visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 9.5
   * When dispute status is "open" and no vendorResponse exists,
   * the response form (textarea + "Save Response" button) should be visible.
   */
  it('shows response form when status is "open" and no vendorResponse', async () => {
    mockGetDisputeDetail.mockResolvedValue(createMockDispute({ status: "open", vendorResponse: null }));

    render(<VendorDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Your Response").length).toBeGreaterThan(0);
    });

    expect(screen.getByPlaceholderText("Write your response to this dispute...")).toBeTruthy();
    expect(screen.getByText("Save Response")).toBeTruthy();
  });

  /**
   * Validates: Requirement 9.5
   * When dispute status is "in-progress" and no vendorResponse exists,
   * the response form should be visible.
   */
  it('shows response form when status is "in-progress" and no vendorResponse', async () => {
    mockGetDisputeDetail.mockResolvedValue(createMockDispute({ status: "in-progress", vendorResponse: null }));

    render(<VendorDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Write your response to this dispute...")).toBeTruthy();
    });

    expect(screen.getByText("Save Response")).toBeTruthy();
  });

  /**
   * Validates: Requirement 9.6
   * When dispute status is "closed", the response form should NOT be visible,
   * and "Read Only" badge should appear.
   */
  it('hides response form and shows "Read Only" badge when status is "closed"', async () => {
    mockGetDisputeDetail.mockResolvedValue(createMockDispute({ status: "closed", vendorResponse: null }));

    render(<VendorDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Read Only")).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText("Write your response to this dispute...")).toBeNull();
    expect(screen.queryByText("Save Response")).toBeNull();
  });

  /**
   * Validates: Requirement 9.6
   * When dispute status is "resolved", the response form should NOT be visible,
   * and "Read Only" badge should appear.
   */
  it('hides response form and shows "Read Only" badge when status is "resolved"', async () => {
    mockGetDisputeDetail.mockResolvedValue(createMockDispute({ status: "resolved", vendorResponse: null }));

    render(<VendorDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Read Only")).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText("Write your response to this dispute...")).toBeNull();
    expect(screen.queryByText("Save Response")).toBeNull();
  });

  /**
   * Validates: Requirement 9.6
   * When dispute status is "closed" and no vendorResponse,
   * shows "No response submitted." message.
   */
  it('shows "No response submitted" message when closed with no vendorResponse', async () => {
    mockGetDisputeDetail.mockResolvedValue(createMockDispute({ status: "closed", vendorResponse: null }));

    render(<VendorDisputeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("No response submitted.")).toBeTruthy();
    });
  });
});
