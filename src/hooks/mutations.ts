import { useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { User } from "@/types/user.type";
import { toastConfigError } from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { fetchPublic } from "@/utils/fetchPublic";
import {IVendor} from "@/types/vendor.type";
import ICryptoWallet from "@/types/wallet.type";
import { API_BASE_URL } from "@/utils/config";

interface SignUpData {
  firstName: string;
  lastName: string;
  middleName?: string;
  sex?: string;
  email: string;
  password: string;
  role: string
  phoneNumber: string;
  locationData?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    ipLocation?: {
      city: string;
      region: string;
      country: string;
      country_code: string;
      postal: string;
      latitude: number;
      longitude: number;
      timezone: string;
      ip: string;
    };
    source: 'gps' | 'ip';
  };
}

interface LoginData {
  email: string;
  password: string;
}

interface verificationData {
  code: string;
}

interface SignUpResponse {
  message: string;
  user: User;
}

const signUpUser = async (
  data: SignUpData
): Promise<{ message: string; user: User; accessToken?: string; refreshToken?: string }> => {
  const response = await fetch( `${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Log full validation error details for debugging
    console.error('[Registration Error]', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      requestPayload: { ...data, password: '[REDACTED]' },
    });
    throw new Error(errorData.message);
  }

  const result = await response.json();
  
  // Store tokens in localStorage for mobile compatibility (same as login)
  if (result.accessToken) {
    try {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
    } catch (e) {
      console.warn('Failed to store tokens:', e);
    }
  }

  return result;
};

export const useSignUp = () => {
  return useMutation<SignUpResponse, Error, SignUpData>({
    mutationFn: signUpUser,
  });
};

const verifyData = async (
  data: verificationData
): Promise<{ message: string; user: User }> => {
  const response = await fetch( `${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: verifyData,
  });
};

const resendVerification = async (
  email: string
): Promise<{ message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/resend-verification`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include", // Include cookies if needed
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Resend verification error:', errorData);
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  const data = await response.json();
  return data;
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: resendVerification,
  });
};

const loginUser = async (
  data: LoginData
): Promise<{
  message: string;
  user?: User;
  vendor?: IVendor;
  has2faEnabled?: boolean;
  requires2FA?: boolean;
  requiresEmailVerification?: boolean;
}> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  // Handle email verification required (403 status)
  if (response.status === 403 && result.requiresEmailVerification) {
    // Store user data temporarily for verification page
    if (result.user) {
      try {
        localStorage.setItem('tempUser', JSON.stringify(result.user));
      } catch (e) {
        console.warn('Failed to store temp user:', e);
      }
    }
    return result;
  }

  if (!response.ok) {
    throw new Error(result.message || 'Login failed');
  }
  
  // Store tokens in localStorage for mobile compatibility
  if (result.accessToken) {
    try {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
    } catch (e) {
      console.warn('Failed to store tokens:', e);
    }
  }

  return result;
};

const signUpVendor = async (
  data: SignUpData
): Promise<{ message: string; user: User; accessToken?: string; refreshToken?: string }> => {
  const response = await fetch(
     `${API_BASE_URL}/auth/register-vendor`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message, toastConfigError);
    throw new Error(errorData.message);
  }

  const result = await response.json();
  
  // Store tokens in localStorage for mobile compatibility (same as login)
  if (result.accessToken) {
    try {
      localStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
    } catch (e) {
      console.warn('Failed to store tokens:', e);
    }
  }

  return result;
};

export const useLoginUser = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

export const useSignVendor = () => {
  return useMutation<SignUpResponse, Error, SignUpData>({
    mutationFn: signUpVendor,
  });
};

const upgradeToVendor = async (
  data: SignUpData
): Promise<{ message: string; user: User; vendor?: any }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/auth/upgrade-to-vendor`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message, toastConfigError);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useUpgradeToVendor = () => {
  return useMutation<{ message: string; user: User; vendor?: any }, Error, SignUpData>({
    mutationFn: upgradeToVendor,
  });
};

const logoutUser = async (): Promise<{ message: string }> => {
  // Use regular fetch instead of fetchWithAuth to avoid auth checks during logout
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Don't show error toast for logout - it should always succeed client-side
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useLogoutUser = () => {
  return useMutation({
    mutationFn: logoutUser,
  });
};

const verifyPasswordResetToken = async (data: {
  code: string;
}): Promise<{ message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/verify-password-reset-token`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useVerifyEmailForPasswordChange = () => {
  return useMutation({
    mutationFn: verifyPasswordResetToken,
  });
};

const resendPasswordResentToken = async (data: {
  email: string;
}): Promise<{ message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/resend-password-reset-token`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useResendPasswordResetToken = () => {
  return useMutation({
    mutationFn: resendPasswordResentToken,
  });
};

const subscribeToPushNotification = async (subscription: {
  subscription: any; 
  deviceId?: string | null
}): Promise<{ message: string, deviceId: any }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/push/subscribe`,
    {
      method: "POST",
      body: JSON.stringify(subscription),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useSubscribeToPush = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscribeToPushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
    },
  });
};


const unsubscribeFromPushNotification = async (deviceId: string): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/push/unsubscribe/${deviceId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useUnsubscribeFromPush = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unsubscribeFromPushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
    },
  });
};

const createWallet = async (): Promise<{wallet: ICryptoWallet}> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/wallets/crypto/create-wallet`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
}

export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
  });
}


const saveDraft = async (draft: any): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
     `${API_BASE_URL}/products/drafts`,
    {
      method: "POST",
      body: JSON.stringify(draft),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to save draft");
  }

  return response.json();
};

export const useSaveDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
};

const deleteDraft = async (id: string): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/products/drafts/${id}`,
    {method: "DELETE"}
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete draft");
  }

  return response.json();
};

export const useDeleteDraft = (): UseMutationResult<
  { message: string }, 
  Error,               
  string               
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
};

// Toggle helpful mutation
const toggleHelpful = async ({ productId, reviewId }: { productId: string; reviewId: string }) => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/product/${productId}/review/${reviewId}/helpful`,
    { method: 'PATCH' }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  return response.json();
};

export const useToggleHelpful = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleHelpful,
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['vendorReviews'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
};

// Add vendor response mutation
const addVendorResponse = async ({ 
  productId, 
  reviewId, 
  vendorId,
  response
}: { 
  productId: string; 
  reviewId: string; 
  vendorId: string;
  response: string; 
}) => {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/product/${productId}/review/${reviewId}/response`,
    {

      method: 'POST',
      body: JSON.stringify({ response, vendorId }),
    }
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message);
  }
  return res.json();
};

export const useAddVendorResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVendorResponse,
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['vendorReviews'] });
      queryClient.invalidateQueries({ queryKey: ['vendorReviewAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
};


const makeBid = async (
  userId: string,
  productId: string,
  amount: number
): Promise<{ message: string; bidAmountUSD: number; isWinning: boolean; success: boolean }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, currency: "USD" }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useMakeBid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, userId, amount }: { productId: string; userId: string; amount: number }) =>
      makeBid(userId, productId, amount),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['auctionProduct', productId] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
    },
  });
};

// Update draft mutation
const updateDraft = async ({ id, draft }: { id: string; draft: any }): Promise<{ message: string }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/products/drafts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(draft),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update draft");
  }

  return response.json();
};

export const useUpdateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
};

// Create product mutation
interface CreateProductError extends Error {
  fieldErrors?: Record<string, string>;
  code?: string;
}

const createProduct = async (productData: any): Promise<{ product: any; message: string }> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/products`,
    {
      method: "POST",
      body: JSON.stringify(productData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    // Create error with additional properties for field-specific errors
    const error = new Error(errorData.message || errorData.error || "Failed to create product") as CreateProductError;
    error.fieldErrors = errorData.errors || errorData.details;
    error.code = errorData.code;
    throw error;
  }

  return response.json();
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate product list queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
      queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
      // Invalidate vendor analytics queries
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
    },
    onError: (error: CreateProductError) => {
      // Display backend error message in toast notification
      const errorMessage = error.message || 'Failed to create product';
      toast.error(errorMessage, toastConfigError);
      
      // Log field-specific errors for debugging
      if (error.fieldErrors) {
        console.error('Field validation errors:', error.fieldErrors);
      }
    },
  });
};


const createAdvertisement = async (data: {
  vendorId: string;
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  adType: string;
  promoConfig?: {
    mode: "none" | "flat" | "percentage" | "per_variant";
    flatPrice?: number;
    percentageDiscount?: number;
    variantPrices?: Array<{ optionId: string; price: number }>;
  };
}) => {
  const { vendorId, ...body } = data;
  const response = await fetchWithAuth(`${API_BASE_URL}/advertisements/${vendorId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create advertisement');
  }
  return response.json();
};

export const useCreateAdvertisement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdvertisement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
  });
};

// Stripe Elements mutations
const createPaymentIntent = async (data: {
  vendorId: string;
  priceId: string;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/stripe/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment intent');
  }
  return response.json();
};

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorSubscription'] });
    },
  });
};

// Add payment method mutation (updated for Stripe)
const addPaymentMethod = async (data: {
  type: 'card' | 'bank_transfer' | 'mobile_money';
  metadata?: {
    last4?: string;
    brand?: string;
    bankName?: string;
    accountNumber?: string;
  };
  isDefault: boolean;
  paymentMethodId?: string;
  paystackAuthorizationCode?: string;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/payment-methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add payment method');
  }
  return response.json();
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
    },
  });
};

// Wallet top-up mutation
const initiateTopUp = async (data: {
  amount: number;
  method: 'card' | 'bank_transfer';
  paymentMethodId?: string;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/topup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to initiate top-up');
  }
  return response.json();
};

export const useInitiateTopUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateTopUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
  });
};

// Create setup intent for payment method
const createSetupIntent = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/setup-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create setup intent');
  }
  return response.json();
};

export const useCreateSetupIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSetupIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
  });
};

// Buy Now mutations
const buyNow = async (data: {
  productId: string;
  variantId: string;
  optionId?: string;
  quantity?: number;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/checkout/buy-now`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to initiate buy now');
  }
  return response.json();
};

export const useBuyNow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buyNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    },
  });
};

const createBuyNowPaymentIntent = async (data: {
  productId: string;
  variantId: string;
  optionId?: string;
  quantity?: number;
  paymentMethod: string;
  tokenType?: string;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/checkout/buy-now/payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment intent');
  }
  return response.json();
};

export const useCreateBuyNowPaymentIntent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBuyNowPaymentIntent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
  });
};

// Delete payment method mutation
const deletePaymentMethod = async (paymentMethodId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/wallets/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete payment method');
  }
  return response.json();
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
  });
};



// Create order from buy now
const createBuyNowOrder = async (data: {
  validatedItems: Array<{
    productId: string;
    variantId?: string;
    optionId?: string;
    quantity?: number;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
    userCurrency?: string;
  };
  paymentData: any;
  address: any;
  isBuyNow?: boolean;
}) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...data, isBuyNow: true })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create order');
  }
  return response.json();
};

export const useCreateBuyNowOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBuyNowOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
  });
};

// Fetch active banners (public API - no auth required)
const fetchActiveBanners = async (): Promise<{ success: boolean; data: any[] }> => {
  const response = await fetchPublic(`${API_BASE_URL}/banners/active`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch banners');
  }

  return response.json();
};

export const useFetchActiveBanners = () => {
  return useMutation({
    mutationFn: fetchActiveBanners,
  });
};