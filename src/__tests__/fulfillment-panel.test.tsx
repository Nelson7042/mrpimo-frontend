/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Mock data helpers ───────────────────────────────────────────────────────

const VENDOR_ID = "vendor-123";
const ORDER_ID = "order-456";
const SHIPMENT_ID = "shipment-789";

const createMockShipment = (overrides: any = {}) => ({
  _id: SHIPMENT_ID,
  vendorId: { _id: VENDOR_ID, businessInfo: { name: "Test Vendor", address: { country: "NG", city: "Lagos", street: "1 Test St" } } },
  items: [{ productId: { _id: "p1", name: "Widget", images: [] }, variantId: "v1", quantity: 1, price: 5000 }],
  origin: {},
  shipping: {
    carrier: "GIG",
    service: "standard",
    status: "pending",
    estimatedDelivery: "2025-02-01",
    cost: { amount: 2000, currency: "NGN" },
    ...overrides.shipping,
  },
  ...overrides,
});

const createMockOrder = (shipmentOverrides: any = {}) => ({
  _id: ORDER_ID,
  shipments: [createMockShipment(shipmentOverrides)],
});

const createMockOptions = (overrides: any = {}) => ({
  data: {
    isInternational: false,
    pickupPrice: 1500,
    dropoffPrice: 0,
    vendorPickupFee: 500,
    buyerPays: 2000,
    currency: "NGN",
    senderStationId: 100,
    experienceCentres: [],
    ...overrides,
  },
});

const createMockCentres = () => ({
  data: [
    { ServiceCentreId: 1, Name: "Lagos Hub", Address: "10 Marina Rd", City: "Lagos", State: "Lagos", PhoneNumber: "08012345678" },
    { ServiceCentreId: 2, Name: "Ikeja Centre", Address: "5 Allen Ave", City: "Ikeja", State: "Lagos" },
  ],
});

// ── Mock state ──────────────────────────────────────────────────────────────

let mockOrderData: any = null;
let mockOrderLoading = false;
let mockRefetchOrder = vi.fn();

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

vi.mock("@/hooks/queries", () => ({
  useOrderById: () => ({
    data: mockOrderData,
    isLoading: mockOrderLoading,
    refetch: mockRefetchOrder,
  }),
}));

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

vi.mock("@/stores/useVendorStore", () => ({
  useVendorStore: () => ({
    vendor: { _id: VENDOR_ID },
  }),
}));

// ── Mock UI dependencies ────────────────────────────────────────────────────

vi.mock("@/components/ui/Skeleton", () => ({
  default: ({ className }: any) => <div data-testid="skeleton" className={className} />,
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
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-check" {...props} />,
  Copy: (props: any) => <span data-testid="icon-copy" {...props} />,
  Package: (props: any) => <span data-testid="icon-package" {...props} />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import FulfillmentPanel from "@/components/vendor/FulfillmentPanel";

// ═══════════════════════════════════════════════════════════════════════════
// Task 10.12 – Frontend tests for FulfillmentPanel
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
// ═══════════════════════════════════════════════════════════════════════════

describe("FulfillmentPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mock state to defaults
    mockOrderData = createMockOrder();
    mockOrderLoading = false;
    mockRefetchOrder = vi.fn();

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
   * Validates: Requirement 6.1
   * FulfillmentPanel renders fulfillment options (pickup and dropoff) from API.
   */
  it("renders fulfillment options with pickup and dropoff cards", () => {
    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    expect(screen.getByText("Choose Fulfillment Method")).toBeTruthy();
    expect(screen.getByText("Pickup")).toBeTruthy();
    expect(screen.getByText("Dropoff")).toBeTruthy();
    expect(screen.getByText("Confirm Fulfillment")).toBeTruthy();
  });

  /**
   * Validates: Requirement 6.1
   * Shows loading skeleton while data is being fetched.
   */
  it("shows loading skeleton while fetching data", () => {
    mockOrderLoading = true;

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  /**
   * Validates: Requirement 6.2
   * Selecting dropoff shows experience centres list.
   */
  it("shows experience centres when dropoff is selected", () => {
    mockCentresData = createMockCentres();

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    // Click the dropoff card
    fireEvent.click(screen.getByText("Dropoff"));

    expect(screen.getByText("Nearest Experience Centres")).toBeTruthy();
    expect(screen.getByText("Lagos Hub")).toBeTruthy();
    expect(screen.getByText("Ikeja Centre")).toBeTruthy();
  });

  /**
   * Validates: Requirement 6.2
   * Selecting pickup shows scheduling details and pricing.
   */
  it("shows scheduling details when pickup is selected", () => {
    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    // Click the pickup card
    fireEvent.click(screen.getByText("Pickup"));

    expect(screen.getByText("Pickup Scheduling Details")).toBeTruthy();
    expect(screen.getByText("Scheduled Pickup")).toBeTruthy();
    expect(screen.getByText("Pickup Window")).toBeTruthy();
    expect(screen.getByText(/Pickup price/)).toBeTruthy();
    expect(screen.getByText(/Vendor pickup surcharge/)).toBeTruthy();
  });

  /**
   * Validates: Requirement 6.3
   * Confirming fulfillment calls the mutation with the selected method.
   */
  it("calls fulfillShipment mutation on confirm with pickup method", () => {
    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

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
   * Validates: Requirement 6.3
   * Confirming dropoff with a selected centre calls the mutation with serviceCentreId.
   */
  it("calls fulfillShipment mutation on confirm with dropoff method and selected centre", () => {
    mockCentresData = createMockCentres();

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

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
   * Validates: Requirement 6.3
   * Dropoff confirm button is disabled until an experience centre is selected.
   */
  it("disables confirm button when dropoff is selected but no centre chosen", () => {
    mockCentresData = createMockCentres();

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    // Select dropoff but don't select a centre
    fireEvent.click(screen.getByText("Dropoff"));

    const confirmBtn = screen.getByText("Confirm Fulfillment");
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);
  });

  /**
   * Validates: Requirement 6.4
   * Already-fulfilled shipments show tracking info instead of fulfillment options.
   */
  it("shows tracking info for already-fulfilled shipments", () => {
    mockOrderData = createMockOrder({
      shipping: {
        carrier: "GIG",
        service: "standard",
        status: "in_transit",
        trackingNumber: "TRK-12345",
        waybill: "WB-67890",
        estimatedDelivery: "2025-02-01",
        fulfillmentMethod: "pickup",
        cost: { amount: 2000, currency: "NGN" },
      },
    });

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="in_transit" />);

    expect(screen.getByText("Shipment Status")).toBeTruthy();
    expect(screen.getByText("In Transit")).toBeTruthy();
    expect(screen.getByText("TRK-12345")).toBeTruthy();
    expect(screen.getByText("WB-67890")).toBeTruthy();
    expect(screen.getByText("via Pickup")).toBeTruthy();
    // Should NOT show fulfillment options
    expect(screen.queryByText("Choose Fulfillment Method")).toBeNull();
  });

  /**
   * Validates: Requirement 6.4
   * Delivered shipments show delivered status and actual delivery date.
   */
  it("shows delivered status with actual delivery date", () => {
    mockOrderData = createMockOrder({
      shipping: {
        carrier: "GIG",
        service: "standard",
        status: "delivered",
        trackingNumber: "TRK-99999",
        estimatedDelivery: "2025-02-01",
        actualDelivery: "2025-01-30",
        fulfillmentMethod: "dropoff",
        cost: { amount: 2000, currency: "NGN" },
      },
    });

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="delivered" />);

    expect(screen.getByText("Delivered")).toBeTruthy();
    expect(screen.getByText("via Dropoff")).toBeTruthy();
    expect(screen.getByText("Delivered On")).toBeTruthy();
  });

  /**
   * Validates: Requirement 6.5
   * API failure shows error message with retry button.
   */
  it("shows error message with retry button when options API fails", () => {
    mockOptionsError = true;
    mockOptionsErrorData = { message: "Network error occurred" };

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    expect(screen.getByText("Failed to load fulfillment options")).toBeTruthy();
    expect(screen.getByText("Network error occurred")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
  });

  /**
   * Validates: Requirement 6.5
   * Clicking retry calls refetch on the options query.
   */
  it("calls refetch when retry button is clicked", () => {
    mockOptionsError = true;
    mockOptionsErrorData = { message: "Server error" };

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    fireEvent.click(screen.getByText("Retry"));

    expect(mockRefetchOptions).toHaveBeenCalledTimes(1);
  });

  /**
   * Validates: Requirement 6.5
   * Mutation error shows error message with retry button.
   */
  it("shows mutation error with retry button when fulfillment fails", () => {
    mockFulfillIsError = true;
    mockFulfillError = { message: "Failed to create shipment. Please try again." };

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    // Select pickup to enable confirm
    fireEvent.click(screen.getByText("Pickup"));

    expect(screen.getByText("Failed to create shipment. Please try again.")).toBeTruthy();
    // The retry button in the mutation error section
    expect(screen.getByText("Retry")).toBeTruthy();
  });

  /**
   * Validates: Requirement 6.1
   * International orders only show pickup option (no dropoff).
   */
  it("only shows pickup for international orders", () => {
    mockOptionsData = createMockOptions({ isInternational: true });

    render(<FulfillmentPanel orderId={ORDER_ID} shipmentStatus="pending" />);

    expect(screen.getByText("Pickup")).toBeTruthy();
    expect(screen.queryByText("Dropoff")).toBeNull();
    expect(screen.getByText(/Dropoff is not available for international shipments/)).toBeTruthy();
  });
});
