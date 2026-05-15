import { useMutation } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-hot-toast";
import type { DeliveryOptionItem } from "@/components/checkout/DeliveryOptions";

export interface DeliveryOptionsParams {
  origin: {
    country: string;
    state: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  destination: {
    country: string;
    state: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  items: Array<{
    weight?: number;
    quantity: number;
    description?: string;
  }>;
}

export interface DeliveryOptionsResponse {
  success: boolean;
  deliveryOptions: DeliveryOptionItem[];
  hasCoordinates: boolean;
  message?: string;
}

const fetchDeliveryOptions = async (
  params: DeliveryOptionsParams
): Promise<DeliveryOptionsResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/checkout/delivery-options`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to fetch delivery options"
    );
  }

  return response.json();
};

/**
 * Hook to fetch available delivery options with pricing from the backend.
 * Calls POST /checkout/delivery-options with origin, destination, and items.
 *
 * Requirements: 15.1, 15.2, 15.3, 15.5
 */
export const useDeliveryOptions = () => {
  return useMutation({
    mutationFn: fetchDeliveryOptions,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to load delivery options");
    },
  });
};
