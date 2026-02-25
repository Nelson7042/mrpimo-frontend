import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

export type BidFilter = 'all' | 'open' | 'closed' | 'won';
export type VendorBidFilter = 'all' | 'open' | 'closed';

export interface BidUser {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface UserBid {
  productId: string;
  productName: string;
  productImage?: string;
  currentAmount: number;
  maxAmount: number;
  currency: string;
  isWinning: boolean;
  createdAt: string;
  auctionEnded: boolean;
}

export interface VendorBid extends UserBid {
  bidder: BidUser;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BidsResponse<T> {
  bids: T[];
  pagination: PaginationInfo;
}

const fetchUserBids = async (filter: BidFilter, page: number, limit: number): Promise<BidsResponse<UserBid>> => {
  const params = new URLSearchParams();
  if (filter !== 'all') params.append('filter', filter);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const qs = params.toString();
  const response = await fetchWithAuth(`${API_BASE_URL}/products/bids/user${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch user bids');
  const data = await response.json();
  return { bids: data.bids, pagination: data.pagination };
};

const fetchVendorBids = async (filter: VendorBidFilter, page: number, limit: number): Promise<BidsResponse<VendorBid>> => {
  const params = new URLSearchParams();
  if (filter !== 'all') params.append('filter', filter);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const qs = params.toString();
  const response = await fetchWithAuth(`${API_BASE_URL}/products/bids/vendor${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error('Failed to fetch vendor bids');
  const data = await response.json();
  return { bids: data.bids, pagination: data.pagination };
};

export const useUserBids = (filter: BidFilter = 'all', page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['userBids', filter, page, limit],
    queryFn: () => fetchUserBids(filter, page, limit),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useVendorBids = (filter: VendorBidFilter = 'all', page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['vendorBids', filter, page, limit],
    queryFn: () => fetchVendorBids(filter, page, limit),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
