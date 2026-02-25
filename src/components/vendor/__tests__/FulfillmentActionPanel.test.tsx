/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// ── Mock hooks ──────────────────────────────────────────────────────────────
const mockUseFulfillmentOptions = vi.fn();
const mockUseFulfillShipment = vi.fn();
const mockUseExperienceCentres = vi.fn();

vi.mock("@/hooks/useVendor", () => ({
  useFulfillmentOptions: (...args: any[]) => mockUseFulfillmentOptions(...args),
  useFulfillShipment: (...args: any[]) => mockUseFulfillShipment(...args),
  useExperienceCentres: (...args: any[]) => mockUseExperienceCentres(...args),
}));

// ── Mock react-hot-toast ────────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock Skeleton ───────────────────────────────────────────────────────────
vi.mock("@/components/ui/Skeleton", () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Truck: () => <span data-testid="truck-icon" />,
  MapPin: () => <span data-testid="mappin-icon" />,
  CheckCircle: () => <span data-testid="check-circle-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Copy: () => <span data-testid="copy-icon" />,
  Info: () => <span data-testid="info-icon" />,
}));

// ── Import component under test (after mocks) ──────────────────────────────
import FulfillmentActionPanel from "../FulfillmentActionPanel";
import { IClientShipment } from "@/types/order.type";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMockShipment(overrides: Partial<IClientShipment> = {}): IClientShipment {
  return {
    _id: "shipment-1",
    vendorId: {
      _id: "vendor-1",
      businessInfo: {
        name: "Test Vendor",
        address: { country: "Nigeria", city: "Lagos", street: "123 Test St" },
      },
    },
    items: [
      {
        productId: { _id: "prod-1", name: "Test Product", images: ["/img.jpg"] },
        variantId: "var-1",
        quantity: 1,
        price: 5000,
      },
    ],
    origin: {
      vendorLocation: { country: "Nigeria", city: "Lagos", address: "123 Test St" },
    },
    shipping: {
      carrier: "GIGL",
      service: "standard",
      status: "pending",
      estimatedDelivery: "2025-01-15",
      cost: { amount: 3000, currency: "NGN" },
    },
    deliveryAddress: {
      street: "456 Buyer St",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      postalCode: "900001",
    },
    ...overrides,
  };
}

const localFulfillmentOptions = {
  data: {
    isInternational: false,
    isDropoffAvailable: true,
    pickupPrice: 5000,
    dropoffPrice: 3000,
    buyerPays: 3000,
    vendorPickupFee: 2000,
    currency: "NGN",
    senderStationId: 1,
    receiverStationId: 2,
    experienceCentres: [
      {
        ServiceCentreId: 101,
        Name: "GIGL Lagos Hub",
        Address: "10 Marina Road",
        City: "Lagos",
        State: "Lagos",
        PhoneNumber: "08012345678",
      },
      {
        ServiceCentreId: 102,
        Name: "GIGL Ikeja Centre",
        Address: "25 Allen Avenue",
        City: "Ikeja",
        State: "Lagos",
      },
    ],
  },
};

const internationalFulfillmentOptions = {
  data: {
    isInternational: true,
    isDropoffAvailable: false,
    pickupPrice: 15000,
    dropoffPrice: null,
    buyerPays: 15000,
    vendorPickupFee: 0,
    currency: "NGN",
    senderStationId: 1,
    receiverStationId: 0,
    experienceCentres: [],
  },
};

const defaultProps = {
  orderId: "order-1",
  shipment: makeMockShipment(),
  vendorId: "vendor-1",
  onFulfillmentComplete: vi.fn(),
};

// ── Tests ───────────────────────────────────────────────────────────────────
describe("FulfillmentActionPanel", () => {
  let mockMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate = vi.fn();
    mockUseFulfillShipment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
    mockUseExperienceCentres.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  /**
   * Validates: Requirements 1.1, 1.2
   * WHEN a vendor views a pending local Nigerian shipment, both Pickup and
   * Dropoff fulfillment options are displayed.
   */
  it("renders both pickup and dropoff options for a local order", () => {
    mockUseFulfillmentOptions.mockReturnValue({
      data: localFulfillmentOptions,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<FulfillmentActionPanel {...defaultProps} />);

    expect(screen.getByText("Pickup")).toBeTruthy();
    expect(screen.getByText("GIGL sends a rider to your location")).toBeTruthy();
    expect(screen.getByText("Dropoff")).toBeTruthy();
    expect(screen.getByText("Take your package to a GIGL Experience Centre")).toBeTruthy();
    expect(screen.getByText("No extra charge")).toBeTruthy();
  });

  /**
   * Validates: Requirements 1.2, 1.6
   * WHEN a vendor views an international shipment, only the Pickup option is
   * shown with an explanatory note about dropoff unavailability.
   */
  it("renders only pickup option for an international order with explanatory note", () => {
    mockUseFulfillmentOptions.mockReturnValue({
      data: internationalFulfillmentOptions,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<FulfillmentActionPanel {...defaultProps} />);

    expect(screen.getByText("Pickup")).toBeTruthy();
    expect(screen.queryByText("Dropoff")).toBeNull();
    expect(
      screen.getByText(
        "Dropoff is not available for international shipments. Only pickup is available."
      )
    ).toBeTruthy();
  });

  /**
   * Validates: Requirement 1.6
   * IF the vendor has not selected a fulfillment method, the confirm button
   * is disabled.
   */
  it("confirm button is disabled when no method is selected", () => {
    mockUseFulfillmentOptions.mockReturnValue({
      data: localFulfillmentOptions,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<FulfillmentActionPanel {...defaultProps} />);

    const confirmBtn = screen.getByText("Confirm Fulfillment");
    expect(confirmBtn.closest("button")?.disabled).toBe(true);
  });

  /**
   * Validates: Requirements 4.4, 10.3
   * WHEN the dropoff fulfillment succeeds, the panel displays the tempCode
   * and Experience Centre details.
   */
  it("displays tempCode and Experience Centre details after successful dropoff", async () => {
    const dropoffResult = {
      fulfillmentMethod: "dropoff" as const,
      waybill: "WB-DROP-001",
      tempCode: "TEMP-12345",
      trackingNumber: "TRK-001",
      experienceCentre: {
        id: 101,
        name: "GIGL Lagos Hub",
        address: "10 Marina Road, Lagos",
      },
      shipmentStatus: "preparing_shipment",
      vendorPickupCost: 0,
    };

    mockMutate.mockImplementation((_args: any, options: any) => {
      options.onSuccess({ data: dropoffResult });
    });

    mockUseFulfillmentOptions.mockReturnValue({
      data: localFulfillmentOptions,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<FulfillmentActionPanel {...defaultProps} />);

    // Select dropoff
    fireEvent.click(screen.getByText("Dropoff"));

    // Select an experience centre
    fireEvent.click(screen.getByText("GIGL Lagos Hub"));

    // Confirm
    fireEvent.click(screen.getByText("Confirm Fulfillment"));

    // After success, result should be displayed
    await waitFor(() => {
      expect(screen.getByText("TEMP-12345")).toBeTruthy();
      expect(screen.getByText("GIGL Lagos Hub")).toBeTruthy();
      expect(screen.getByText("10 Marina Road, Lagos")).toBeTruthy();
      expect(screen.getByText("Shipment Created Successfully")).toBeTruthy();
    });
  });

  /**
   * Validates: Requirement 10.3
   * WHEN the pickup fulfillment succeeds, the panel displays the waybill.
   */
  it("displays waybill after successful pickup", async () => {
    const pickupResult = {
      fulfillmentMethod: "pickup" as const,
      waybill: "WB-PICK-999",
      trackingNumber: "TRK-999",
      shipmentStatus: "preparing_shipment",
      vendorPickupCost: 2000,
    };

    mockMutate.mockImplementation((_args: any, options: any) => {
      options.onSuccess({ data: pickupResult });
    });

    mockUseFulfillmentOptions.mockReturnValue({
      data: localFulfillmentOptions,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<FulfillmentActionPanel {...defaultProps} />);

    // Select pickup
    fireEvent.click(screen.getByText("Pickup"));

    // Confirm
    fireEvent.click(screen.getByText("Confirm Fulfillment"));

    // After success, waybill should be displayed
    await waitFor(() => {
      expect(screen.getByText("WB-PICK-999")).toBeTruthy();
      expect(screen.getByText("Waybill Number")).toBeTruthy();
      expect(screen.getByText("Shipment Created Successfully")).toBeTruthy();
    });
  });

  /**
   * Validates: Requirement 10.5
   * IF the shipment creation fails, the panel shows an error message with
   * a retry button.
   */
  it("shows error message with retry button on failure", () => {
    mockUseFulfillmentOptions.mockReturnValue({
      data: localFulfillmentOptions,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseFulfillShipment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: { message: "GIGL API is temporarily unavailable" },
    });

    render(<FulfillmentActionPanel {...defaultProps} />);

    // Select pickup so the error area is visible
    fireEvent.click(screen.getByText("Pickup"));

    expect(screen.getByText("GIGL API is temporarily unavailable")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
  });
});
