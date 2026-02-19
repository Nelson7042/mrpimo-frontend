import { useMutation, UseMutationResult } from "@tanstack/react-query";
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
    // Don't show toast here - let the component handle it via onError callback
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
      console.log('✅ Tokens stored after signup');
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
  console.log('🔄 Resending verification to:', email);
  console.log('🔄 API URL:', `${API_BASE_URL}/auth/resend-verification`);
  
  const response = await fetch(
    `${API_BASE_URL}/auth/resend-verification`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include", // Include cookies if needed
    }
  );

  console.log('🔄 Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ Resend verification error:', errorData);
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  const data = await response.json();
  console.log('✅ Resend verification success:', data);
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
    console.log('⚠️ Email verification required');
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
      console.log('✅ Tokens stored after login');
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
      console.log('✅ Tokens stored after vendor signup');
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

  console.log('🔒 Logout response status:', response.status);

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
    console.log(errorData);
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useSubscribeToPush = () => {
  return useMutation({
    mutationFn: subscribeToPushNotification,
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
  return useMutation({
    mutationFn: unsubscribeFromPushNotification,
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
  return useMutation({
    mutationFn: createWallet,
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
  return useMutation({
    mutationFn: saveDraft,
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
  return useMutation({
    mutationFn: deleteDraft,
    onSettled: () => {
      console.log("Delete draft mutation settled");
    }
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
  return useMutation({
    mutationFn: toggleHelpful,
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
  return useMutation({
    mutationFn: addVendorResponse,
  });
};


const makeBid = async (
  userId: string,
  productId: string,
  maxBid: number
): Promise<{ message: string; currentAmountUsd: number; userBidUsd: number }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, maxBid }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    toast.error(errorData.message);
    throw new Error(errorData.message);
  }

  return response.json();
};

export const useMakeBid = () => {
  return useMutation({
    mutationFn: ({ productId, userId, maxBid }: { productId: string; userId: string; maxBid: number }) =>
      makeBid(userId, productId, maxBid),
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
  return useMutation({
    mutationFn: updateDraft,
  });
};

// Create product mutation
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
    throw new Error(errorData.message || "Failed to create product");
  }

  return response.json();
};

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: createProduct,
  });
};


const createAdvertisement = async (data: {
  vendorId: string;
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  adType: string;
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
  return useMutation({
    mutationFn: createAdvertisement,
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
  return useMutation({
    mutationFn: createPaymentIntent,
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
  return useMutation({
    mutationFn: addPaymentMethod,
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
  return useMutation({
    mutationFn: initiateTopUp,
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
  return useMutation({
    mutationFn: createSetupIntent,
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
  return useMutation({
    mutationFn: buyNow,
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
  return useMutation({
    mutationFn: createBuyNowPaymentIntent,
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
  return useMutation({
    mutationFn: deletePaymentMethod,
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
  return useMutation({
    mutationFn: createBuyNowOrder,
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