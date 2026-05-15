import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-hot-toast";
import type { DeliveryOptionItem } from "@/components/checkout/DeliveryOptions";

// --- Types ---

export interface BidDeliveryOptionsResponse {
  success: boolean;
  deliveryOptions: DeliveryOptionItem[];
  hasCoordinates: boolean;
  message?: string;
}

export interface BidCheckoutParams {
  bidId: string;
  paymentMethod: string;
  addressId?: string;
  deliveryMethod?: string;
  tokenType?: string;
  selectedDeliveryOption?: {
    optionId: string;
    label: string;
    carrierParams?: Record<string, unknown>;
  };
}

export interface BidPaymentIntentResponse {
  success: boolean;
  orderId: string;
  paymentData: {
    type: string;
    provider: string;
    clientSecret?: string;
    paymentIntentId?: string;
    amount?: number;
    availableBalance?: number;
    currency?: string;
    email?: string;
  };
  checkout: {
    items: any[];
    pricing: {
      subtotal: number;
      tax: number;
      taxName?: string;
      taxRate?: number;
      isTaxInclusive?: boolean;
      shipping: number;
      total: number;
      currency: string;
    };
  };
  expiresAt: string;
}

export interface BidPaystackVerificationParams {
  reference: string;
  orderId: string;
}

export interface BidPaystackVerificationResponse {
  success: boolean;
  message?: string;
  order?: {
    _id: string;
    status: string;
  };
}

// --- Fetch functions ---

const fetchBidDeliveryOptions = async (
  bidId: string,
  addressId?: string
): Promise<BidDeliveryOptionsResponse> => {
  const queryParams = addressId ? `?addressId=${addressId}` : "";
  const response = await fetchWithAuth(
    `${API_BASE_URL}/checkout/bid/${bidId}/delivery-options${queryParams}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to fetch delivery options"
    );
  }

  return response.json();
};

const createBidPaymentIntent = async (
  params: BidCheckoutParams
): Promise<BidPaymentIntentResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/checkout/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create bid payment intent");
  }

  return response.json();
};

const verifyBidPaystackPayment = async (
  params: BidPaystackVerificationParams
): Promise<BidPaystackVerificationResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/checkout/bid/verify-paystack`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to verify Paystack payment"
    );
  }

  return response.json();
};

// --- Hooks ---

/**
 * Hook to fetch delivery options for a bid checkout.
 * Calls GET /api/checkout/bid/:bidId/delivery-options?addressId=...
 *
 * Requirements: 6.4
 */
export const useBidDeliveryOptions = (
  bidId: string | undefined,
  addressId: string | undefined
) => {
  return useQuery({
    queryKey: ["bidDeliveryOptions", bidId, addressId],
    queryFn: () => fetchBidDeliveryOptions(bidId!, addressId),
    enabled: !!bidId,
    staleTime: 60 * 1000,
    retry: 1,
  });
};

/**
 * Hook to create a bid payment intent and handle payment.
 * Calls POST /api/checkout/bid with bid checkout data.
 *
 * Requirements: 6.5
 */
export const useBidCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBidPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create bid payment intent");
    },
  });
};

/**
 * Hook to verify a Paystack payment for a bid order.
 * Calls POST /api/checkout/bid/verify-paystack with reference and orderId.
 *
 * Requirements: 6.5
 */
export const useBidPaystackVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyBidPaystackPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["userBids"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Paystack payment verification failed");
    },
  });
};
