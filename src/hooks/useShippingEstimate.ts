import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

export interface VendorShippingEstimate {
  vendorId: string;
  vendorName: string;
  shippingCost: number;
  senderStation: string;
  receiverStation: string;
  itemCount: number;
}

export interface ShippingEstimateData {
  totalShipping: number;
  currency: string;
  estimationType: "address" | "ip" | "none";
  vendors: VendorShippingEstimate[];
  warnings: string[];
}

interface ShippingEstimateResponse {
  success: boolean;
  estimate: ShippingEstimateData;
}

const fetchShippingEstimate = async (): Promise<ShippingEstimateResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/products/cart/shipping-estimate`
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to fetch shipping estimate");
  }
  return response.json();
};

export const useShippingEstimate = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["shipping-estimate"],
    queryFn: fetchShippingEstimate,
    enabled,
    staleTime: 60_000, // 1 minute
    retry: 1,
  });
};
