import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5800/api/v1';

interface UserProfile {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
  };
  addresses: Array<{
    _id: string;
    type: 'shipping' | 'billing';
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    isDefault: boolean;
  }>;
}

interface FiatWallet {
  _id: string;
  userId: string;
  balances: {
    available: number;
    pending: number;
    escrow: number;
    frozen: number;
  };
  currency: string;
  limits: {
    dailyTopUp: number;
    monthlyTopUp: number;
    singleTransaction: number;
  };
  paymentMethods: any[];
  settings: {
    autoTopUpThreshold: number;
    autoTopUp: boolean;
    autoTopUpAmount: number;
    dailySpendingLimit: number;
    notifications: boolean;
  };
  stripeCustomerId: string;
  verification: {
    level: string;
    kycStatus: string;
    documents: any[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ShippingAddress {
  id: string;
  _id: string;
  city: string;
  country: string;
  isDefault: boolean;
  postalCode: string;
  state: string;
  street: string;
  type: string;
}

interface Card {
  gateway: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  cardHolderName: string;
  isDefault: boolean;
  addedAt: string;
}

interface RecentView {
  _id: string;
  name: string;
  images: string[];
  slug: string;
  variants: Array<{
    options: Array<{
      price: number;
    }>;
  }>;
}

const userApi = {
  getProfile: async (): Promise<{ success: boolean; message: string; user: UserProfile; fiatWallet: FiatWallet; shippingDefaultAddress: ShippingAddress }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    return data;
  },

  getRecentViews: async (limit = 10): Promise<{ recentViews: RecentView[] }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/recent-views` + `?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent views');
    const data = await response.json();
    return data;
  },

  getRecomendations: async (limit = 10) => {
    const response = await fetchWithAuth(`${API_BASE}/products/user/recommendations` + `?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent views');
    const data = await response.json();
    return data;
  },

  addCard: async (cardData: {
    gateway: string;
    cardDetails: {
      last4: string;
      brand: string;
      expMonth: number;
      expYear: number;
      cardHolderName: string;
    };
    billingAddress: any;
    metadata: any;
  }) => {
    const response = await fetchWithAuth(`${API_BASE}/users/card`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    if (!response.ok) throw new Error('Failed to add card');
    return response.json();
  },

  removeCard: async (last4: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/card/${last4}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove card');
    return response.json();
  },

  setDefaultCard: async (last4: string) => {
    const response = await fetchWithAuth(`${API_BASE}/users/card`, {
      method: 'PATCH',
      body: JSON.stringify({ last4 }),
    });
    if (!response.ok) throw new Error('Failed to set default card');
    return response.json();
  },

  updateNotificationPreferences: async (preferences: any) => {
    const response = await fetchWithAuth(`${API_BASE}/users/notifications/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  },

  getCards: async (): Promise<{ cards: Card[]; defaultGateway: string }> => {
    const response = await fetchWithAuth(`${API_BASE}/users/cards`);
    if (!response.ok) throw new Error('Failed to fetch cards');
    return response.json();
  },

  getRecentActivities: async (page = 1, limit = 10) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await fetchWithAuth(`${API_BASE}/users/activities?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch recent activities');
    return response.json();
  },
};

export const useUserProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecentViews = (limit = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['recentViews', limit],
    queryFn: () => userApi.getRecentViews(limit),
    enabled: enabled,
    staleTime: 2 * 60 * 1000,
  });
};

export const useRecomendations = (limit = 10, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['recomendations', limit],
    queryFn: () => userApi.getRecomendations(limit),
    enabled: enabled,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.addCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCards'] });
      toast.success('Card added successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to add card', toastConfigError);
    },
  });
};

export const useRemoveCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.removeCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCards'] });
      toast.success('Card removed successfully', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to remove card', toastConfigError);
    },
  });
};

export const useSetDefaultCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.setDefaultCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCards'] });
      toast.success('Default card updated', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to set default card', toastConfigError);
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  return useMutation({
    mutationFn: userApi.updateNotificationPreferences,
    onSuccess: () => {
      toast.success('Notification preferences updated', toastConfigSuccess);
    },
    onError: () => {
      toast.error('Failed to update preferences', toastConfigError);
    },
  });
};

export const useUserCards = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['userCards'],
    queryFn: userApi.getCards,
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserRecentActivities = (page = 1, limit = 10, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['userRecentActivities', page, limit],
    queryFn: () => userApi.getRecentActivities(page, limit),
    enabled: enabled,
    staleTime: 2 * 60 * 1000,
  });
};