/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mock state ──────────────────────────────────────────────────────────────

let mockHandoffMutate = vi.fn();
let mockHandoffIsPending = false;
let mockHandoffIsError = false;
let mockHandoffError: any = null;

// ── Mock hooks ──────────────────────────────────────────────────────────────

vi.mock("@/hooks/useVendor", () => ({
  useConfirmVendorHandoff: () => ({
    mutate: mockHandoffMutate,
    isPending: mockHandoffIsPending,
    isError: mockHandoffIsError,
    error: mockHandoffError,
  }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock lucide-react icons as simple spans
vi.mock("lucide-react", () => ({
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
  Package: (props: any) => <span data-testid="icon-package" {...props} />,
  Truck: (props: any) => <span data-testid="icon-truck" {...props} />,
  MapPin: (props: any) => <span data-testid="icon-mappin" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import VendorHandoffClaim from "@/components/vendor/VendorHandoffClaim";

// ═══════════════════════════════════════════════════════════════════════════
// Task 14.2 – VendorHandoffClaim component tests
// Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
// ═══════════════════════════════════════════════════════════════════════════

describe("VendorHandoffClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandoffMutate = vi.fn();
    mockHandoffIsPending = false;
    mockHandoffIsError = false;
    mockHandoffError = null;
  });

  /**
   * Validates: Requirement 5.1
   * Shows "Mark as Dropped Off" button for dropoff fulfillment when status is preparing_shipment.
   */
  it("shows 'Mark as Dropped Off' button for dropoff when preparing_shipment", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    expect(screen.getByText("Mark as Dropped Off")).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.3
   * Shows "Mark as Picked Up" button for pickup fulfillment when status is preparing_shipment.
   */
  it("shows 'Mark as Picked Up' button for pickup when preparing_shipment", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="pickup"
        handoffStatus="pending"
      />
    );

    expect(screen.getByText("Mark as Picked Up")).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.5
   * Disables the button when shipment status is not "preparing_shipment".
   */
  it("disables button when shipment status is not preparing_shipment", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="shipped"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    const button = screen.getByText("Mark as Dropped Off");
    expect(button.closest("button")?.hasAttribute("disabled")).toBe(true);
  });

  /**
   * Validates: Requirement 5.5
   * Disables the button when handoff status is "vendor_claimed" (already claimed).
   */
  it("disables button when handoff status is vendor_claimed", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="vendor_claimed"
      />
    );

    const button = screen.getByText("Mark as Dropped Off");
    expect(button.closest("button")?.hasAttribute("disabled")).toBe(true);
  });

  /**
   * Validates: Requirement 5.4
   * Displays current handoff status badge.
   */
  it("displays handoff status badge for pending status", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    expect(screen.getByText(/Handoff Status: Pending/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.4
   * Displays vendor_claimed status badge.
   */
  it("displays handoff status badge for vendor_claimed status", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="vendor_claimed"
      />
    );

    expect(screen.getByText(/Claimed — Awaiting Admin Confirmation/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.4
   * Displays confirmed status badge.
   */
  it("displays handoff status badge for confirmed status", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="shipped"
        fulfillmentMethod="dropoff"
        handoffStatus="confirmed"
      />
    );

    expect(screen.getByText(/Handoff Status: Confirmed/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.4
   * Displays rejected status badge with retry info.
   */
  it("displays rejected status badge with retry info", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="rejected"
      />
    );

    expect(screen.getByText(/Rejected — Please Retry/)).toBeTruthy();
    expect(screen.getByText(/previous handoff claim was rejected/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.1, 5.2
   * Clicking the button calls the confirm-handoff API with type "dropped_off" for dropoff.
   */
  it("calls confirmVendorHandoff with type dropped_off for dropoff", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    fireEvent.click(screen.getByText("Mark as Dropped Off"));

    expect(mockHandoffMutate).toHaveBeenCalledTimes(1);
    expect(mockHandoffMutate).toHaveBeenCalledWith(
      {
        orderId: "order-1",
        shipmentId: "ship-1",
        body: { type: "dropped_off" },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  /**
   * Validates: Requirement 5.3, 5.4
   * Clicking the button calls the confirm-handoff API with type "picked_up" for pickup.
   */
  it("calls confirmVendorHandoff with type picked_up for pickup", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="pickup"
        handoffStatus="pending"
      />
    );

    fireEvent.click(screen.getByText("Mark as Picked Up"));

    expect(mockHandoffMutate).toHaveBeenCalledTimes(1);
    expect(mockHandoffMutate).toHaveBeenCalledWith(
      {
        orderId: "order-1",
        shipmentId: "ship-1",
        body: { type: "picked_up" },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  /**
   * Validates: Requirement 5.2
   * Shows success state after successful handoff claim.
   */
  it("shows success state after successful handoff claim", () => {
    mockHandoffMutate = vi.fn((_, options) => {
      // Simulate immediate success callback
      options.onSuccess();
    });

    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    fireEvent.click(screen.getByText("Mark as Dropped Off"));

    expect(screen.getByText("Handoff Claimed Successfully")).toBeTruthy();
    expect(screen.getByText(/dropped off at the experience centre/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.5
   * Shows disabled state info when shipment is not in preparing_shipment status.
   */
  it("shows disabled state info when not in preparing_shipment status", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="pending"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    expect(screen.getByText(/Handoff can only be claimed/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.5
   * Shows error message when mutation fails.
   */
  it("shows error message when handoff mutation fails", () => {
    mockHandoffIsError = true;
    mockHandoffError = { message: "Shipment not in correct state" };

    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    expect(screen.getByText("Shipment not in correct state")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
  });

  /**
   * Validates: Requirement 5.1
   * Allows retry when handoff was previously rejected.
   */
  it("allows retry when handoff status is rejected and status is preparing_shipment", () => {
    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="rejected"
      />
    );

    const button = screen.getByText("Mark as Dropped Off");
    expect(button.closest("button")?.hasAttribute("disabled")).toBe(false);

    fireEvent.click(button);
    expect(mockHandoffMutate).toHaveBeenCalledTimes(1);
  });

  /**
   * Validates: Requirement 5.5
   * Shows loading state while mutation is pending.
   */
  it("shows loading state while mutation is pending", () => {
    mockHandoffIsPending = true;

    render(
      <VendorHandoffClaim
        orderId="order-1"
        shipmentId="ship-1"
        shipmentStatus="preparing_shipment"
        fulfillmentMethod="dropoff"
        handoffStatus="pending"
      />
    );

    expect(screen.getByText("Processing...")).toBeTruthy();
  });
});
