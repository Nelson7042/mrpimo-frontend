import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { toast } from "react-hot-toast";

export type OrderProcessingStage =
  | "idle"
  | "validating"
  | "creating"
  | "finalizing"
  | "complete"
  | "error";

export interface BuyNowCheckoutParams {
  productId: string;
  variantId: string;
  optionId?: string;
  quantity: number;
  paymentMethod: string;
  addressId?: string;
  deliveryMethod?: string;
  tokenType?: string;
}

export interface BuyNowPaymentIntentResponse {
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
    walletAddress?: string;
    token?: string;
    tokenType?: string;
    balance?: string;
  };
  checkout: {
    items: any[];
    pricing: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
      currency: string;
    };
  };
  shortfall?: number;
  suggestTopUp?: boolean;
  expiresAt: string;
}

const createBuyNowPaymentIntent = async (
  params: BuyNowCheckoutParams
): Promise<BuyNowPaymentIntentResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/checkout/buy-now/payment-intent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create payment intent");
  }

  return response.json();
};

const confirmWalletPayment = async (
  orderId: string
): Promise<{ success: boolean; order?: any; message?: string }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/checkout/pay-with-wallet`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Wallet payment failed");
  }

  return response.json();
};

export const useBuyNowCheckout = () => {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<OrderProcessingStage>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentIntentData, setPaymentIntentData] =
    useState<BuyNowPaymentIntentResponse | null>(null);

  const paymentIntentMutation = useMutation({
    mutationFn: createBuyNowPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create payment intent");
      setStage("error");
    },
  });

  const walletConfirmMutation = useMutation({
    mutationFn: confirmWalletPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Wallet payment confirmation failed");
      setStage("error");
    },
  });

  const initiateCheckout = useCallback(
    async (params: BuyNowCheckoutParams) => {
      setStage("validating");

      try {
        const response = await paymentIntentMutation.mutateAsync(params);

        if (!response.success) {
          setStage("error");
          return null;
        }

        setOrderId(response.orderId);
        setPaymentIntentData(response);

        // Airwallex not yet integrated — fall back to Stripe
        if (response.paymentData?.provider === 'airwallex') {
          console.warn('[BuyNow] Airwallex not yet integrated, falling back to Stripe');
          response.paymentData.provider = 'stripe';
        }

        setStage("creating");

        return response;
      } catch {
        setStage("error");
        return null;
      }
    },
    [paymentIntentMutation]
  );

  const handleWalletPayment = useCallback(
    async (piResponse: BuyNowPaymentIntentResponse) => {
      if (!piResponse.orderId) {
        toast.error("Missing order information for wallet payment");
        setStage("error");
        return false;
      }

      setStage("finalizing");

      try {
        const result = await walletConfirmMutation.mutateAsync(
          piResponse.orderId
        );

        if (result.success) {
          setStage("complete");
          return true;
        } else {
          toast.error(result.message || "Wallet payment failed");
          setStage("error");
          return false;
        }
      } catch {
        setStage("error");
        return false;
      }
    },
    [walletConfirmMutation]
  );

  const initializePaystackPayment = useCallback(
    async (piResponse: BuyNowPaymentIntentResponse) => {
      setStage("finalizing");

      try {
        const { paymentData, orderId: piOrderId, checkout } = piResponse;

        const response = await fetchWithAuth(
          `${API_BASE_URL}/checkout/paystack/initialize`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: checkout.items.map((item: any) => ({
                productId: item.productId,
                variantId: item.variantId,
                optionId: item.optionId,
                quantity: item.quantity,
              })),
              pricing: checkout.pricing,
              orderId: piOrderId,
              isBuyNow: true,
            }),
          }
        );

        const data = await response.json();
        const authorizationUrl =
          data.data?.authorization_url || data.authorization_url;

        if (data.success && authorizationUrl) {
          window.location.href = authorizationUrl;
          return true;
        } else {
          toast.error((data.message || "Failed to initialize Paystack payment") + " — please try again.");
          setStage("error");
          return false;
        }
      } catch (error: any) {
        toast.error(error.message || "Paystack payment initialization failed");
        setStage("error");
        return false;
      }
    },
    []
  );

  const resetStage = useCallback(() => {
    setStage("idle");
    setOrderId(null);
    setPaymentIntentData(null);
  }, []);

  return {
    stage,
    setStage,
    orderId,
    paymentIntentData,
    initiateCheckout,
    handleWalletPayment,
    initializePaystackPayment,
    resetStage,
    isProcessing:
      paymentIntentMutation.isPending || walletConfirmMutation.isPending,
  };
};
