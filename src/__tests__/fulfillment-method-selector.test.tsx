/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mock data helpers ───────────────────────────────────────────────────────

const ORDER_ID = "order-456";
const SHIPMENT_ID = "shipment-789";

const createMockOptions = (overrides: any = {}) => ({
  data: {
    isInternational: false,
    pickupPrice: 3000,
    dropoffPrice: 1500,
    vendorPickupFee: 1500,
    buyerPays: 3000,
    currency: "NGN",
    senderStationId: 100,
    experienceCentres: [],
    ...overrides,
  },
});

const createMockCentres = () => ({
  data: [
    {
      ServiceCentreId: 1,
      Name: "Lagos Hub",
      Address: "10 Marina Rd",
      City: "Lagos",
      State: "Lagos",
      PhoneNumber: "08012345678",
    },
    {
      ServiceCentreId: 2,
      Name: "Ikeja Centre",
      Address: "5 Allen Ave",
      City: "Ikeja",
      State: "Lagos",
    },
  ],
});

// ── Mock state ──────────────────────────────────────────────────────────────

let mockOptionsData: any = null;
let mockOptionsLoading = false;
let mockOptionsError = false;
let mockOptionsErrorData: any = null;
let mockRefetchOptions = vi.fn();

let mockCentresData: any = null;
let mockCentresLoading = false;
let mockCentresError = false;

let mockFulfillMutate = vi.fn();
let mockFulfillIsPending = false;
let mockFulfillIsError = false;
let mockFulfillError: any = null;

// ── Mock hooks ──────────────────────────────────────────────────────────────

vi.mock("@/hooks/useVendor", () => ({
  useFulfillmentOptions: () => ({
    data: mockOptionsData,
    isLoading: mockOptionsLoading,
    isError: mockOptionsError,
    error: mockOptionsErrorData,
    refetch: mockRefetchOptions,
  }),
  useExperienceCentres: () => ({
    data: mockCentresData,
    isLoading: mockCentresLoading,
    isError: mockCentresError,
  }),
  useFulfillShipment: () => ({
    mutate: mockFulfillMutate,
    isPending: mockFulfillIsPending,
    isError: mockFulfillIsError,
    error: mockFulfillError,
  }),
}));

// ── Mock UI dependencies ────────────────────────────────────────────────────

vi.mock("@/components/ui/Skeleton", () => ({
  default: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock lucide-react icons as simple spans
vi.mock("lucide-react", () => ({
  Truck: (props: any) => <span data-testid="icon-truck" {...props} />,
  MapPin: (props: any) => <span data-testid="icon-mappin" {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
  Info: (props: any) => <span data-testid="icon-info" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  Copy: (props: any) => <span data-testid="icon-copy" {...props} />,
  Lock: (props: any) => <span data-testid="icon-lock" {...props} />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import FulfillmentMethodSelector from "@/components/vendor/FulfillmentMethodSelector";

// ═══════════════════════════════════════════════════════════════════════════
// Task 14.1 – FulfillmentMethodSelector tests
// Validates: Requirements 2.1, 2.2, 2.3
// ═══════════════════════════════════════════════════════════════════════════

describe("FulfillmentMethodSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockOptionsData = createMockOptions();
    mockOptionsLoading = false;
    mockOptionsError = false;
    mockOptionsErrorData = null;
    mockRefetchOptions = vi.fn();

    mockCentresData = null;
    mockCentresLoading = false;
    mockCentresError = false;

    mockFulfillMutate = vi.fn();
    mockFulfillIsPending = false;
    mockFulfillIsError = false;
    mockFulfillError = null;
  });

  /**
   * Validates: Requirement 2.1
   * Displays pickup and dropoff options with pricing comparison.
   */
  it("renders pickup and dropoff options with pricing comparison", () => {
    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    expect(screen.getByText("Choose Fulfillment Method")).toBeTruthy();
    expect(screen.getByText("Pickup")).toBeTruthy();
    expect(screen.getByText("Dropoff")).toBeTruthy();
    expect(screen.getByText("Pricing Comparison")).toBeTruthy();
    // Pickup price and dropoff price shown
    expect(screen.getByText("Pickup price (buyer pays)")).toBeTruthy();
    expect(screen.getByText("Dropoff price (buyer pays)")).toBeTruthy();
  });

  /**
   * Validates: Requirement 2.1
   * Shows the pickup surcharge info clearly.
   */
  it("displays pickup surcharge info", () => {
    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    // The pricing comparison section shows the surcharge label
    expect(
      screen.getByText("Pickup surcharge (deducted from your earnings)")
    ).toBeTruthy();
    // The surcharge info banner is present
    expect(
      screen.getByText(/Choose dropoff to avoid this fee/)
    ).toBeTruthy();
  });

  /**
   * Validates: Requirement 2.2
   * Shows experience centre selection when dropoff is selected.
   */
  it("shows experience centre selection when dropoff is selected", () => {
    mockCentresData = createMockCentres();

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    // Click the dropoff card
    fireEvent.click(screen.getByText("Dropoff"));

    expect(screen.getByText("Select Experience Centre")).toBeTruthy();
    expect(screen.getByText("Lagos Hub")).toBeTruthy();
    expect(screen.getByText("Ikeja Centre")).toBeTruthy();
  });

  /**
   * Validates: Requirement 2.3
   * Disables selection when shipment is not in "pending" status.
   */
  it("disables selection when shipment status is not pending", () => {
    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="preparing_shipment"
      />
    );

    expect(screen.getByText("Selection locked")).toBeTruthy();
    expect(
      screen.getByText(/Fulfillment method can only be selected/)
    ).toBeTruthy();

    // Buttons should be disabled
    const pickupBtn = screen.getByLabelText(
      "Select pickup fulfillment method"
    );
    expect(pickupBtn.hasAttribute("disabled")).toBe(true);

    const dropoffBtn = screen.getByLabelText(
      "Select dropoff fulfillment method"
    );
    expect(dropoffBtn.hasAttribute("disabled")).toBe(true);
  });

  /**
   * Validates: Requirement 2.3
   * Confirm button is disabled when shipment is not pending.
   */
  it("confirm button is disabled when shipment is not pending", () => {
    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="shipped"
      />
    );

    const confirmBtn = screen.getByText("Confirm Fulfillment");
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);
  });

  /**
   * Validates: Requirement 2.1
   * Calls fulfillShipment mutation on confirm with pickup method.
   */
  it("calls fulfillShipment mutation on confirm with pickup method", () => {
    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    // Select pickup
    fireEvent.click(screen.getByText("Pickup"));

    // Click confirm
    fireEvent.click(screen.getByText("Confirm Fulfillment"));

    expect(mockFulfillMutate).toHaveBeenCalledTimes(1);
    expect(mockFulfillMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        shipmentId: SHIPMENT_ID,
        body: { fulfillmentMethod: "pickup" },
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  /**
   * Validates: Requirement 2.2
   * Calls fulfillShipment mutation with dropoff and selected centre.
   */
  it("calls fulfillShipment mutation with dropoff and selected centre", () => {
    mockCentresData = createMockCentres();

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    // Select dropoff
    fireEvent.click(screen.getByText("Dropoff"));

    // Select a centre
    fireEvent.click(screen.getByText("Lagos Hub"));

    // Click confirm
    fireEvent.click(screen.getByText("Confirm Fulfillment"));

    expect(mockFulfillMutate).toHaveBeenCalledTimes(1);
    expect(mockFulfillMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        shipmentId: SHIPMENT_ID,
        body: { fulfillmentMethod: "dropoff", serviceCentreId: 1 },
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  /**
   * Validates: Requirement 2.2
   * Confirm button is disabled when dropoff is selected but no centre chosen.
   */
  it("disables confirm button when dropoff selected but no centre chosen", () => {
    mockCentresData = createMockCentres();

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    // Select dropoff but don't select a centre
    fireEvent.click(screen.getByText("Dropoff"));

    const confirmBtn = screen.getByText("Confirm Fulfillment");
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);
  });

  /**
   * Validates: Requirement 2.1
   * Only shows pickup for international orders.
   */
  it("only shows pickup for international orders", () => {
    mockOptionsData = createMockOptions({ isInternational: true });

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    expect(screen.getByText("Pickup")).toBeTruthy();
    expect(
      screen.queryByLabelText("Select dropoff fulfillment method")
    ).toBeNull();
    expect(
      screen.getByText(
        /Dropoff is not available for international shipments/
      )
    ).toBeTruthy();
  });

  /**
   * Shows loading skeleton while fetching options.
   */
  it("shows loading skeleton while fetching options", () => {
    mockOptionsLoading = true;

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  /**
   * Shows error state with retry button when options fail to load.
   */
  it("shows error state with retry button when options fail to load", () => {
    mockOptionsError = true;
    mockOptionsErrorData = { message: "Network error" };

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    expect(screen.getByText("Failed to load fulfillment options")).toBeTruthy();
    expect(screen.getByText("Network error")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
  });

  /**
   * Clicking retry calls refetch.
   */
  it("calls refetch when retry button is clicked", () => {
    mockOptionsError = true;
    mockOptionsErrorData = { message: "Server error" };

    render(
      <FulfillmentMethodSelector
        orderId={ORDER_ID}
        shipmentId={SHIPMENT_ID}
        shipmentStatus="pending"
      />
    );

    fireEvent.click(screen.getByText("Retry"));
    expect(mockRefetchOptions).toHaveBeenCalledTimes(1);
  });
});
