"use client";

import React from "react";
import { Truck, Package, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Represents a single delivery option returned from the backend.
 * Maps to the CarrierAdapter's DeliveryOption + pricing from the
 * POST /checkout/delivery-options endpoint.
 */
export interface DeliveryOptionItem {
  /** Unique option identifier, e.g. 'home_standard', 'home_express', 'station_pickup' */
  id: string;
  /** Human-readable label */
  label: string;
  /** Short description of the option */
  description: string;
  /** Estimated delivery window */
  estimatedDays: { min: number; max: number };
  /** Carrier-specific parameters stored on the order */
  carrierParams: {
    PickUpOptions: number;
    DeliveryType: number;
  };
  /** Calculated price for this option (null if pricing failed) */
  price: { amount: number; currency: string } | null;
  /** Error message if pricing failed */
  priceError?: string;
}

export interface DeliveryOptionsProps {
  /** Available delivery options from the backend */
  options: DeliveryOptionItem[];
  /** Whether the buyer's address has valid coordinates */
  hasExactLocation: boolean;
  /** Currently selected option id */
  selectedOptionId: string;
  /** Callback when user selects a delivery option */
  onSelect: (option: DeliveryOptionItem) => void;
  /** Order subtotal (items + tax, before shipping) */
  subtotal: number;
  /** Currency code, e.g. 'NGN' or 'USD' */
  currency: string;
  /** Whether shipping prices are currently loading */
  isLoading?: boolean;
  /** Optional message from backend when only station pickup is available */
  noCoordinatesMessage?: string;
}

/** Maps option IDs to appropriate icons */
function getOptionIcon(optionId: string) {
  switch (optionId) {
    case "home_standard":
      return <Truck className="w-5 h-5 text-blue-600" />;
    case "home_express":
      return <Package className="w-5 h-5 text-orange-500" />;
    case "station_pickup":
      return <MapPin className="w-5 h-5 text-green-600" />;
    default:
      return <Truck className="w-5 h-5 text-gray-500" />;
  }
}

/** Formats estimated delivery days into a readable string */
function formatEstimatedDays(days: { min: number; max: number }): string {
  if (days.min === days.max) {
    return `${days.min} business day${days.min > 1 ? "s" : ""}`;
  }
  return `${days.min}-${days.max} business days`;
}

/**
 * DeliveryOptions component for the checkout page.
 *
 * Displays available delivery options (Home Standard, Home Express, Station Pickup)
 * with prices. Shows a message when only Station Pickup is available (no coordinates).
 * Recalculates and displays updated order total when an option is selected.
 *
 * Requirements: 15.1, 15.2, 15.3, 15.5, 15.6
 */
export default function DeliveryOptions({
  options,
  hasExactLocation,
  selectedOptionId,
  onSelect,
  subtotal,
  currency,
  isLoading = false,
  noCoordinatesMessage,
}: DeliveryOptionsProps) {
  const selectedOption = options.find((opt) => opt.id === selectedOptionId);
  const shippingCost = selectedOption?.price?.amount ?? 0;
  const orderTotal = subtotal + shippingCost;

  const handleValueChange = (optionId: string) => {
    const option = options.find((opt) => opt.id === optionId);
    if (option) {
      onSelect(option);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1">Delivery Method</h3>
        <p className="text-xs text-gray-600 mb-3">
          Choose how you want to receive your order
        </p>
      </div>

      {/* No coordinates message */}
      {!hasExactLocation && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-800">
            {noCoordinatesMessage ||
              "Only station pickup is available. Add your exact location to unlock home delivery options."}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-500">
            Loading delivery options...
          </span>
        </div>
      ) : (
        <RadioGroup
          value={selectedOptionId}
          onValueChange={handleValueChange}
          className="space-y-2"
          aria-label="Delivery options"
        >
          {options.map((option) => {
            const isDisabled = !hasExactLocation && option.id !== "station_pickup";
            const isSelected = selectedOptionId === option.id;

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-start space-x-3 p-3 border rounded-lg transition-colors",
                  isSelected && "border-blue-500 bg-blue-50",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : "hover:bg-gray-50 cursor-pointer"
                )}
              >
                <RadioGroupItem
                  value={option.id}
                  id={`delivery-${option.id}`}
                  className="mt-0.5"
                  disabled={isDisabled}
                  aria-label={option.label}
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`delivery-${option.id}`}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      isDisabled && "cursor-not-allowed"
                    )}
                  >
                    {getOptionIcon(option.id)}
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.id === "home_express" && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200"
                      >
                        Fast
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    {isDisabled
                      ? "Add exact location to enable this option"
                      : option.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 ml-7">
                    Est. {formatEstimatedDays(option.estimatedDays)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {option.price ? (
                    <span className="text-sm font-semibold text-gray-900">
                      {option.price.currency}{" "}
                      {option.price.amount.toLocaleString()}
                    </span>
                  ) : option.priceError ? (
                    <span className="text-xs text-red-500">
                      Price unavailable
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>
      )}

      {/* Updated order total */}
      {selectedOption && !isLoading && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Subtotal</span>
            <span>
              {currency} {subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Shipping ({selectedOption.label})</span>
            <span>
              {selectedOption.price
                ? `${selectedOption.price.currency} ${selectedOption.price.amount.toLocaleString()}`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-200 pt-2">
            <span>Order Total</span>
            <span>
              {currency} {orderTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
