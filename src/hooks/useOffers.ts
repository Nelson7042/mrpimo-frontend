import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

export interface OfferUser {
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface OfferItem {
  _id: string;
  userId: string | OfferUser;
  productId: string;
  vendorId: string;
  variantId: string;
  optionId: string;
  vendorAmount: number;
  userAmount: number;
  vendorCurrency: string;
  userCurrency: string;
  displayAmount: number;
  displayCurrency: string;
  role: 'buyer' | 'vendor';
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'payment_pending' | 'completed';
  type: 'offer' | 'counter-offer';
  expiresAt?: string;
  paymentDeadline?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupedOffers {
  productId: string;
  name: string;
  slug: string;
  image?: string;
  offers: OfferItem[];
  counterOffers: OfferItem[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OffersResult {
  offers: GroupedOffers[];
  pagination: PaginationInfo;
}

interface UserOffersOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface VendorOffersOptions {
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  page?: number;
  limit?: number;
  enabled?: boolean;
}

const fetchUserOffers = async (page: number, limit: number): Promise<OffersResult> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const response = await fetchWithAuth(`${API_BASE_URL}/users/offers?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch user offers');
  const data = await response.json();
  return { offers: data.data, pagination: data.pagination };
};

const fetchVendorOffers = async (
  options: Omit<VendorOffersOptions, 'enabled'> = {}
): Promise<OffersResult> => {
  const params = new URLSearchParams();
  if (options.status) params.append('status', options.status);
  params.append('page', (options.page || 1).toString());
  params.append('limit', (options.limit || 10).toString());

  const url = `${API_BASE_URL}/vendors/offers?${params.toString()}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error('Failed to fetch vendor offers');
  const data = await response.json();
  return { offers: data.data, pagination: data.pagination };
};

export const useUserOffers = (options: UserOffersOptions = {}) => {
  const { page = 1, limit = 10, enabled = true } = options;

  return useQuery({
    queryKey: ['userOffers', page, limit],
    queryFn: () => fetchUserOffers(page, limit),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useVendorOffers = (options: VendorOffersOptions = {}) => {
  const { status, page = 1, limit = 10, enabled = true } = options;

  return useQuery({
    queryKey: ['vendorOffers', status, page, limit],
    queryFn: () => fetchVendorOffers({ status, page, limit }),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
