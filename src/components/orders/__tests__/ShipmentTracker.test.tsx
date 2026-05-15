/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Mock lucide-react icons as simple spans
vi.mock("lucide-react", () => ({
  Package: (props: any) => <span data-testid="icon-package" {...props} />,
  Truck: (props: any) => <span data-testid="icon-truck" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  MapPin: (props: any) => <span data-testid="icon-mappin" {...props} />,
  AlertTriangle: (props: any) => <span data-testid="icon-alert" {...props} />,
  Copy: (props: any) => <span data-testid="icon-copy" {...props} />,
  Check: (props: any) => <span data-testid="icon-check-small" {...props} />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import ShipmentTracker, {
  ShipmentStatus,
} from "@/components/orders/ShipmentTracker";

// ═══════════════════════════════════════════════════════════════════════════
// Task 16.1 – ShipmentTracker component tests
// Validates: Requirements 9.1, 9.2, 9.4, 9.5
// ═══════════════════════════════════════════════════════════════════════════

describe("ShipmentTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Requirement 9.1: Display current shipment status ──────────────────

  it("displays the current shipment status badge for pending", () => {
    render(<ShipmentTracker status="pending" />);
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("displays the current shipment status badge for preparing_shipment", () => {
    render(<ShipmentTracker status="preparing_shipment" />);
    // "Preparing Shipment" appears in both the badge and the step timeline
    expect(screen.getAllByText("Preparing Shipment").length).toBeGreaterThanOrEqual(1);
  });

  it("displays the current shipment status badge for shipped", () => {
    render(<ShipmentTracker status="shipped" />);
    // "Shipped" appears in both the badge and the step timeline
    expect(screen.getAllByText("Shipped").length).toBeGreaterThanOrEqual(1);
  });

  it("displays the current shipment status badge for in_transit", () => {
    render(<ShipmentTracker status="in_transit" />);
    // "In Transit" appears in both the badge and the step timeline
    expect(screen.getAllByText("In Transit").length).toBeGreaterThanOrEqual(1);
  });

  it("displays the current shipment status badge for out_for_delivery", () => {
    render(<ShipmentTracker status="out_for_delivery" />);
    // "Out for Delivery" appears in both the badge and the step timeline
    expect(screen.getAllByText("Out for Delivery").length).toBeGreaterThanOrEqual(1);
  });

  it("displays the current shipment status badge for delivered", () => {
    render(
      <ShipmentTracker status="delivered" deliveredAt="2024-06-15T14:30:00Z" />
    );
    // "Delivered" appears in both the badge and the step timeline
    expect(screen.getAllByText("Delivered").length).toBeGreaterThanOrEqual(1);
  });

  it("displays the failed status with error message", () => {
    render(<ShipmentTracker status="failed" />);
    // "Delivery Failed" appears in both the badge and the error panel
    expect(screen.getAllByText("Delivery Failed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/issue with this delivery/)).toBeTruthy();
  });

  // ── Requirement 9.1: Visual progress indicator ────────────────────────

  it("renders the step timeline with all status steps", () => {
    render(<ShipmentTracker status="in_transit" />);
    expect(screen.getByText("Order Placed")).toBeTruthy();
    expect(screen.getByText("Preparing Shipment")).toBeTruthy();
    expect(screen.getByText("Shipped")).toBeTruthy();
    // "In Transit" appears in both the badge and the step timeline
    expect(screen.getAllByText("In Transit").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Out for Delivery")).toBeTruthy();
    // "Delivered" appears in the step timeline
    expect(screen.getAllByText("Delivered").length).toBeGreaterThanOrEqual(1);
  });

  it("does not render step timeline when status is failed", () => {
    render(<ShipmentTracker status="failed" />);
    expect(screen.queryByText("Order Placed")).toBeNull();
    expect(screen.queryByText("In Transit")).toBeNull();
  });

  // ── Requirement 9.2: Show waybill number when available ───────────────

  it("displays waybill number when provided", () => {
    render(<ShipmentTracker status="shipped" waybill="GIG-12345678" />);
    expect(screen.getByText("Tracking Number")).toBeTruthy();
    expect(screen.getByText("GIG-12345678")).toBeTruthy();
  });

  it("does not display waybill section when waybill is null", () => {
    render(<ShipmentTracker status="pending" waybill={null} />);
    expect(screen.queryByText("Tracking Number")).toBeNull();
  });

  it("does not display waybill section when waybill is undefined", () => {
    render(<ShipmentTracker status="pending" />);
    expect(screen.queryByText("Tracking Number")).toBeNull();
  });

  it("shows copy button for waybill", () => {
    render(<ShipmentTracker status="shipped" waybill="GIG-12345678" />);
    expect(screen.getByLabelText("Copy tracking number")).toBeTruthy();
  });

  it("copies waybill to clipboard on copy button click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<ShipmentTracker status="shipped" waybill="GIG-12345678" />);
    fireEvent.click(screen.getByLabelText("Copy tracking number"));

    expect(writeText).toHaveBeenCalledWith("GIG-12345678");
  });

  // ── Requirement 9.4: Show estimated delivery timeline ─────────────────

  it("displays estimated delivery timeline when estimatedDays is provided", () => {
    render(
      <ShipmentTracker
        status="shipped"
        estimatedDays={{ min: 3, max: 5 }}
        deliveryOptionLabel="Home Delivery (Standard)"
      />
    );
    expect(screen.getByText("Estimated Delivery")).toBeTruthy();
    expect(screen.getByText("3–5 business days")).toBeTruthy();
    expect(screen.getByText("via Home Delivery (Standard)")).toBeTruthy();
  });

  it("displays single day estimate correctly", () => {
    render(
      <ShipmentTracker status="shipped" estimatedDays={{ min: 1, max: 1 }} />
    );
    expect(screen.getByText("1 business day")).toBeTruthy();
  });

  it("does not display estimated delivery when status is delivered", () => {
    render(
      <ShipmentTracker
        status="delivered"
        estimatedDays={{ min: 3, max: 5 }}
        deliveredAt="2024-06-15T14:30:00Z"
      />
    );
    expect(screen.queryByText("Estimated Delivery")).toBeNull();
  });

  it("does not display estimated delivery when status is failed", () => {
    render(
      <ShipmentTracker status="failed" estimatedDays={{ min: 3, max: 5 }} />
    );
    expect(screen.queryByText("Estimated Delivery")).toBeNull();
  });

  it("does not display estimated delivery when estimatedDays is null", () => {
    render(<ShipmentTracker status="shipped" estimatedDays={null} />);
    expect(screen.queryByText("Estimated Delivery")).toBeNull();
  });

  // ── Requirement 9.5: Show delivery confirmation date ──────────────────

  it("displays delivery confirmation date when delivered", () => {
    render(
      <ShipmentTracker
        status="delivered"
        deliveredAt="2024-06-15T14:30:00Z"
        deliveryOptionLabel="Home Delivery (Express)"
      />
    );
    expect(screen.getByText("Delivered Successfully")).toBeTruthy();
    expect(screen.getByText("via Home Delivery (Express)")).toBeTruthy();
    // The formatted date should contain "Jun 15, 2024"
    expect(screen.getByText(/Jun 15, 2024/)).toBeTruthy();
  });

  it("does not display delivery confirmation when status is not delivered", () => {
    render(<ShipmentTracker status="in_transit" />);
    expect(screen.queryByText("Delivered Successfully")).toBeNull();
  });

  it("does not display delivery confirmation when deliveredAt is null", () => {
    render(<ShipmentTracker status="delivered" deliveredAt={null} />);
    expect(screen.queryByText("Delivered Successfully")).toBeNull();
  });

  it("accepts Date object for deliveredAt", () => {
    render(
      <ShipmentTracker
        status="delivered"
        deliveredAt={new Date("2024-12-25T10:00:00Z")}
      />
    );
    expect(screen.getByText("Delivered Successfully")).toBeTruthy();
    expect(screen.getByText(/Dec 25, 2024/)).toBeTruthy();
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  it("renders full tracking view with all data for in-transit shipment", () => {
    render(
      <ShipmentTracker
        status="in_transit"
        waybill="GIG-99887766"
        estimatedDays={{ min: 2, max: 4 }}
        deliveryOptionLabel="Station Pickup"
      />
    );

    // Status badge (appears in badge and step timeline)
    expect(screen.getAllByText("In Transit").length).toBeGreaterThanOrEqual(1);
    // Waybill
    expect(screen.getByText("GIG-99887766")).toBeTruthy();
    // Estimated delivery
    expect(screen.getByText("2–4 business days")).toBeTruthy();
    expect(screen.getByText("via Station Pickup")).toBeTruthy();
    // Step timeline present
    expect(screen.getByText("Order Placed")).toBeTruthy();
  });

  it("renders delivered state with confirmation and no estimated delivery", () => {
    render(
      <ShipmentTracker
        status="delivered"
        waybill="GIG-11223344"
        estimatedDays={{ min: 3, max: 5 }}
        deliveredAt="2024-08-20T16:45:00Z"
        deliveryOptionLabel="Home Delivery (Standard)"
      />
    );

    // Status badge (appears in badge and step timeline)
    expect(screen.getAllByText("Delivered").length).toBeGreaterThanOrEqual(1);
    // Waybill still shown
    expect(screen.getByText("GIG-11223344")).toBeTruthy();
    // No estimated delivery (hidden when delivered)
    expect(screen.queryByText("Estimated Delivery")).toBeNull();
    // Delivery confirmation shown
    expect(screen.getByText("Delivered Successfully")).toBeTruthy();
    expect(screen.getByText(/Aug 20, 2024/)).toBeTruthy();
  });
});
