/**
 * @vitest-environment jsdom
 */
import React from "react";
globalThis.React = React;

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import DeliveryOptions, {
  DeliveryOptionItem,
} from "../DeliveryOptions";

// ── Mock UI dependencies ────────────────────────────────────────────────────

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// ── Test Data ───────────────────────────────────────────────────────────────

const createMockOptions = (): DeliveryOptionItem[] => [
  {
    id: "home_standard",
    label: "Home Delivery (Standard)",
    description: "Delivered to your door in 3-5 business days",
    estimatedDays: { min: 3, max: 5 },
    carrierParams: { PickUpOptions: 0, DeliveryType: 0 },
    price: { amount: 3500, currency: "NGN" },
  },
  {
    id: "home_express",
    label: "Home Delivery (Express)",
    description: "Express delivery to your door in 1-2 business days",
    estimatedDays: { min: 1, max: 2 },
    carrierParams: { PickUpOptions: 0, DeliveryType: 1 },
    price: { amount: 5000, currency: "NGN" },
  },
  {
    id: "station_pickup",
    label: "Station Pickup",
    description: "Pick up from nearest GIG Experience Centre",
    estimatedDays: { min: 2, max: 4 },
    carrierParams: { PickUpOptions: 1, DeliveryType: 0 },
    price: { amount: 2000, currency: "NGN" },
  },
];

const defaultProps = {
  options: createMockOptions(),
  hasExactLocation: true,
  selectedOptionId: "home_standard",
  onSelect: vi.fn(),
  subtotal: 10000,
  currency: "NGN",
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("DeliveryOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering delivery options", () => {
    it("should display all three delivery options when coordinates are available", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(screen.getByText("Home Delivery (Standard)")).toBeTruthy();
      expect(screen.getByText("Home Delivery (Express)")).toBeTruthy();
      expect(screen.getByText("Station Pickup")).toBeTruthy();
    });

    it("should display prices for each option", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(screen.getAllByText(/3,500/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/5,000/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/2,000/).length).toBeGreaterThanOrEqual(1);
    });

    it("should display estimated delivery days for each option", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(screen.getAllByText(/3-5 business days/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/1-2 business days/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/2-4 business days/).length).toBeGreaterThanOrEqual(1);
    });

    it("should display descriptions for each option", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(
        screen.getByText("Delivered to your door in 3-5 business days")
      ).toBeTruthy();
      expect(
        screen.getByText("Express delivery to your door in 1-2 business days")
      ).toBeTruthy();
      expect(
        screen.getByText("Pick up from nearest GIG Experience Centre")
      ).toBeTruthy();
    });

    it("should show 'Fast' badge for express delivery", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(screen.getByText("Fast")).toBeTruthy();
    });
  });

  describe("No coordinates (station pickup only)", () => {
    it("should show warning message when no exact location", () => {
      render(
        <DeliveryOptions
          {...defaultProps}
          hasExactLocation={false}
          selectedOptionId="station_pickup"
        />
      );

      expect(
        screen.getByText(/Only station pickup is available/)
      ).toBeTruthy();
    });

    it("should show custom no-coordinates message when provided", () => {
      const customMessage =
        "Home delivery requires an exact location on your address.";
      render(
        <DeliveryOptions
          {...defaultProps}
          hasExactLocation={false}
          selectedOptionId="station_pickup"
          noCoordinatesMessage={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeTruthy();
    });

    it("should disable home delivery options when no coordinates", () => {
      render(
        <DeliveryOptions
          {...defaultProps}
          hasExactLocation={false}
          selectedOptionId="station_pickup"
        />
      );

      const standardRadio = screen.getByRole("radio", {
        name: "Home Delivery (Standard)",
      });
      const expressRadio = screen.getByRole("radio", {
        name: "Home Delivery (Express)",
      });
      const pickupRadio = screen.getByRole("radio", {
        name: "Station Pickup",
      });

      expect(standardRadio.hasAttribute("disabled")).toBe(true);
      expect(expressRadio.hasAttribute("disabled")).toBe(true);
      expect(pickupRadio.hasAttribute("disabled")).toBe(false);
    });

    it("should show 'Add exact location' message for disabled options", () => {
      render(
        <DeliveryOptions
          {...defaultProps}
          hasExactLocation={false}
          selectedOptionId="station_pickup"
        />
      );

      const messages = screen.getAllByText(
        "Add exact location to enable this option"
      );
      expect(messages).toHaveLength(2); // home_standard and home_express
    });
  });

  describe("Selection and callbacks", () => {
    it("should call onSelect when a delivery option is selected", () => {
      const onSelect = vi.fn();
      render(
        <DeliveryOptions {...defaultProps} onSelect={onSelect} />
      );

      const pickupRadio = screen.getByRole("radio", {
        name: "Station Pickup",
      });
      fireEvent.click(pickupRadio);

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "station_pickup",
          label: "Station Pickup",
          carrierParams: { PickUpOptions: 1, DeliveryType: 0 },
        })
      );
    });

    it("should highlight the selected option", () => {
      const { container } = render(
        <DeliveryOptions
          {...defaultProps}
          selectedOptionId="home_express"
        />
      );

      // The selected option should have the blue border class
      const selectedDiv = container.querySelector(".border-blue-500");
      expect(selectedDiv).toBeTruthy();
    });
  });

  describe("Order total calculation", () => {
    it("should display updated order total with shipping cost", () => {
      render(
        <DeliveryOptions
          {...defaultProps}
          selectedOptionId="home_standard"
          subtotal={10000}
        />
      );

      // Subtotal: 10,000 + Shipping: 3,500 = Total: 13,500
      expect(screen.getByText("Order Total")).toBeTruthy();
      expect(screen.getByText(/13,500/)).toBeTruthy();
    });

    it("should recalculate total when different option is selected", () => {
      const { rerender } = render(
        <DeliveryOptions
          {...defaultProps}
          selectedOptionId="home_standard"
          subtotal={10000}
        />
      );

      // Standard: 10,000 + 3,500 = 13,500
      expect(screen.getByText(/13,500/)).toBeTruthy();

      // Switch to express
      rerender(
        <DeliveryOptions
          {...defaultProps}
          selectedOptionId="home_express"
          subtotal={10000}
        />
      );

      // Express: 10,000 + 5,000 = 15,000
      expect(screen.getByText(/15,000/)).toBeTruthy();
    });

    it("should show shipping label with selected option name", () => {
      render(
        <DeliveryOptions
          {...defaultProps}
          selectedOptionId="station_pickup"
        />
      );

      expect(
        screen.getByText(/Shipping \(Station Pickup\)/)
      ).toBeTruthy();
    });
  });

  describe("Loading state", () => {
    it("should show loading indicator when isLoading is true", () => {
      render(<DeliveryOptions {...defaultProps} isLoading={true} />);

      expect(
        screen.getByText("Loading delivery options...")
      ).toBeTruthy();
    });

    it("should not show order total when loading", () => {
      render(<DeliveryOptions {...defaultProps} isLoading={true} />);

      expect(screen.queryByText("Order Total")).toBeNull();
    });
  });

  describe("Price errors", () => {
    it("should show 'Price unavailable' when option has priceError", () => {
      const optionsWithError: DeliveryOptionItem[] = [
        {
          id: "home_standard",
          label: "Home Delivery (Standard)",
          description: "Delivered to your door",
          estimatedDays: { min: 3, max: 5 },
          carrierParams: { PickUpOptions: 0, DeliveryType: 0 },
          price: null,
          priceError: "Unable to calculate shipping cost",
        },
        {
          id: "station_pickup",
          label: "Station Pickup",
          description: "Pick up from station",
          estimatedDays: { min: 2, max: 4 },
          carrierParams: { PickUpOptions: 1, DeliveryType: 0 },
          price: { amount: 2000, currency: "NGN" },
        },
      ];

      render(
        <DeliveryOptions
          {...defaultProps}
          options={optionsWithError}
          selectedOptionId="station_pickup"
        />
      );

      expect(screen.getByText("Price unavailable")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label on the radio group", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(
        screen.getByRole("radiogroup", { name: "Delivery options" })
      ).toBeTruthy();
    });

    it("should have proper labels for each radio button", () => {
      render(<DeliveryOptions {...defaultProps} />);

      expect(
        screen.getByRole("radio", { name: "Home Delivery (Standard)" })
      ).toBeTruthy();
      expect(
        screen.getByRole("radio", { name: "Home Delivery (Express)" })
      ).toBeTruthy();
      expect(
        screen.getByRole("radio", { name: "Station Pickup" })
      ).toBeTruthy();
    });
  });
});
