import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchPublic } from '@/utils/fetchPublic';
import { API_BASE_URL } from '@/utils/config';

interface Bid {
  userId: string;
  maxAmount: number;
  currentAmount: number;
  currency: string;
  isWinning: boolean;
  createdAt: string;
  user?: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Offer {
  _id: string;
  userId: string;
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
  type: 'offer' | 'counter-offer';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  user?: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

const bidsApi = {
  getBidsForProduct: async (productId: string) => {
    const response = await fetchPublic(`${API_BASE_URL}/products/${productId}/bids`);
    if (!response.ok) throw new Error('Failed to fetch bids');
    const data = await response.json();
    // Return full response so auctionInfo and priceInfo are available
    return data;
  },
};

const offersApi = {
  getOffersForProduct: async (productId: string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/offer/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch offers');
    const data = await response.json();
    return { offers: data.offers || [], viewerRole: data.viewerRole || 'buyer' };
  },
};

export const useProductBids = (productId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['productBids', productId],
    queryFn: () => bidsApi.getBidsForProduct(productId),
    enabled: enabled && !!productId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useProductOffers = (productId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['productOffers', productId],
    queryFn: () => offersApi.getOffersForProduct(productId),
    enabled: enabled && !!productId,
    staleTime: 30 * 1000, // 30 seconds
  });
};