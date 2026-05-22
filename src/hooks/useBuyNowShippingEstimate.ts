import { useMutation } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-hot-toast";

export interface BuyNowShippingEstimateParams {
  productId: string;
  variantId: string;
  optionId: string;
  quantity: number;
  addressId?: string;
  deliveryMethod?: string;
}

export interface BuyNowShippingEstimate {
  shippingCost: number;
  currency: string;
  estimationType: "address" | "none";
  senderStation: string;
  receiverStation: string;
  warnings: string[];
  estimatedDays: string;
}

interface BuyNowShippingEstimateResponse {
  success: boolean;
  estimate: BuyNowShippingEstimate;
}

const fetchBuyNowShippingEstimate = async (
  params: BuyNowShippingEstimateParams
): Promise<BuyNowShippingEstimateResponse> => {
  console.log("[BuyNowShipping] Request params:", JSON.stringify(params, null, 2));
  const response = await fetchWithAuth(
    `${API_BASE_URL}/checkout/buy-now/shipping-estimate`,
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
    console.error("[BuyNowShipping] Error response:", JSON.stringify(errorData, null, 2));
    throw new Error(
      errorData.message || "Failed to fetch shipping estimate"
    );
  }

  const data = await response.json();
  console.log("[BuyNowShipping] Raw response:", JSON.stringify(data, null, 2));
  return data;
};

export const useBuyNowShippingEstimate = () => {
  return useMutation({
    mutationFn: fetchBuyNowShippingEstimate,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to calculate shipping");
    },
  });
};
