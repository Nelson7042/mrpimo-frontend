/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import VoluntaryCancellation from "@/components/vendor/VoluntaryCancellation";

// Mock the useVendor hook
vi.mock("@/hooks/useVendor", () => ({
  useVoluntaryCancellation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("VoluntaryCancellation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the cancel button when countdown is active and status is pending", () => {
    const deadline = new Date("2024-01-03T00:00:00Z"); // 48h from now

    render(
      <VoluntaryCancellation
        orderId="order-123"
        shipmentStatus="pending"
        fulfillmentDeadline={deadline.toISOString()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Can't Fulfill Order")).toBeTruthy();
    expect(screen.getByText("Fulfillment Countdown")).toBeTruthy();
  });

  it("does not render when deadline has expired", () => {
    const deadline = new Date("2023-12-31T00:00:00Z"); // in the past

    const { container } = render(
      <VoluntaryCancellation
        orderId="order-123"
        shipmentStatus="pending"
        fulfillmentDeadline={deadline.toISOString()}
      />,
      { wrapper: createWrapper() }
    );

    expect(container.innerHTML).toBe("");
  });

  it("does not render cancel button when status is not pending", () => {
    const deadline = new Date("2024-01-03T00:00:00Z");

    render(
      <VoluntaryCancellation
        orderId="order-123"
        shipmentStatus="preparing_shipment"
        fulfillmentDeadline={deadline.toISOString()}
      />,
      { wrapper: createWrapper() }
    );

    // Should show countdown but not the cancel button
    expect(screen.getByText("Fulfillment Countdown")).toBeTruthy();
    expect(screen.queryByText("Can't Fulfill Order")).toBeNull();
  });

  it("opens the cancellation dialog when button is clicked", () => {
    const deadline = new Date("2024-01-03T00:00:00Z");

    render(
      <VoluntaryCancellation
        orderId="order-123"
        shipmentStatus="pending"
        fulfillmentDeadline={deadline.toISOString()}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("Can't Fulfill Order"));

    expect(screen.getByText("Cancel Order")).toBeTruthy();
    expect(screen.getByText("Select a reason")).toBeTruthy();
  });

  it("shows warning when less than 24 hours remain", () => {
    const deadline = new Date("2024-01-01T12:00:00Z"); // 12h from now

    render(
      <VoluntaryCancellation
        orderId="order-123"
        shipmentStatus="pending"
        fulfillmentDeadline={deadline.toISOString()}
      />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(/Less than 24 hours remaining/)
    ).toBeTruthy();
  });

  it("displays countdown timer with correct format", () => {
    const deadline = new Date("2024-01-03T00:00:00Z"); // 48h from now

    render(
      <VoluntaryCancellation
        orderId="order-123"
        shipmentStatus="pending"
        fulfillmentDeadline={deadline.toISOString()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("48h 0m 0s")).toBeTruthy();
  });
});
