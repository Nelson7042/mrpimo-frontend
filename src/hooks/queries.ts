import { toastConfigError } from '@/app/config/toast.config';
import { useUserStore } from '@/stores/useUserStore';
import { AllProduct, API_BASE_URL, AProduct, AProductBySlug } from '@/utils/config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchPublic } from '@/utils/fetchPublic';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Fetch categories
const fetchCategories = async () => {
  const response = await fetchPublic(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  const data = await response.json();
  return data; // Return the entire response object
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 1 day
    refetchOnWindowFocus: false,
    retry: 1
  });
};


import { useLocalityFilter } from './useLocalityFilter';

// Fetch best deals
const fetchBestDeals = async (locality?: string) => {
  const params = locality ? `?locality=${locality}` : '';
  const response = await fetchPublic(`${API_BASE_URL}/products/best-deals${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch best deals');
  }
  const data = await response.json();
  return data.products;
};

export const useBestDeals = () => {
  const { locality } = useLocalityFilter();
  const localityParam = locality ?? undefined;
  return useQuery({
    queryKey: ['bestDeals', localityParam],
    queryFn: () => fetchBestDeals(localityParam),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });
};


const fetchUserSubscriptions = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/push/user`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  return data;
};

export const useUserSubscriptions = () => {
  return useQuery({
    queryKey: ['userSubscriptions'],
    queryFn: fetchUserSubscriptions,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchProductBySlug = async (slug: string) => {
  const response = await fetchPublic(`${API_BASE_URL}/products/slug/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const data = await response.json();
  return data;
};

export const useFetchProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product-slug', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchProductById = async (productId: string) => {
  const user = useUserStore.getState().user;
  const response = user?._id ? await fetchWithAuth(`${API_BASE_URL}/products/${productId}`) : await fetchPublic(`${API_BASE_URL}/products/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const data = await response.json();
  return data;
};

export const useFetchProductById = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
    enabled: !!productId,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchProductAnalytics = async (
  entityId: string,
) => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/products/${entityId}/performance`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch product analytics");
  }
  const data = await response.json();
  return data;
};

export const useFetchProductAnalytics = (
  entityId: string,
) => {
  return useQuery({
    queryKey: ["product-perfomance", entityId],
    queryFn: () => fetchProductAnalytics(entityId),
    enabled: !!entityId,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchAllProducts = async (locality?: string) => {
  const params = new URLSearchParams({ page: '1', limit: '50' });
  if (locality) params.append('locality', locality);
  const response = await fetchPublic(`${API_BASE_URL}/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data.products;
};

export const useFetchAllProducts = () => {
  const { locality } = useLocalityFilter();
  const localityParam = locality ?? undefined;
  return useQuery({
    queryKey: ['allProducts', localityParam],
    queryFn: () => fetchAllProducts(localityParam),
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

interface AuctionQueryDataType {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
}

const fetchProductsOnAuction = async (queryData: AuctionQueryDataType, locality?: string) => {
  const params = new URLSearchParams();

  if (queryData.page !== undefined) params.append('page', queryData.page.toString());
  if (queryData.limit !== undefined) params.append('limit', queryData.limit.toString());
  if (queryData.status) params.append('status', queryData.status);
  if (queryData.categoryId) params.append('categoryId', queryData.categoryId);
  if (locality) params.append('locality', locality);

  const response = await fetchPublic(`${API_BASE_URL}/products/auctions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products on auction');
  }
  const data = await response.json();
  return data.products;
};


export const useProductsOnAuction = (queryData: AuctionQueryDataType) => {
  const { locality } = useLocalityFilter();
  const localityParam = locality ?? undefined;
  return useQuery({
    queryKey: ['productsOnAuction', queryData, localityParam],
    queryFn: () => fetchProductsOnAuction(queryData, localityParam),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
    retry: 1,
  });
};



const fetchVendorProducts = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/products/vendor/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  return data.products;
};

export const useVendorProducts = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorProducts', vendorId],
    queryFn: () => fetchVendorProducts(vendorId),
    enabled: !!vendorId, // ensures it won't run if vendorId is undefined/null
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchVendorAnalytics= async (vendorId: string, range="7days") => {
  const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/vendors/${vendorId}/analytics?range=${range}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  return data;
};

export const useVendorAnalytics= (vendorId: string, range?: string) => {
  return useQuery({
    queryKey: ['vendorAnalytics', vendorId, range],
    queryFn: () => fetchVendorAnalytics(vendorId, range),
    enabled: !!vendorId, // ensures it won't run if vendorId is undefined/null
    retry: 1,
  });
};

const fetchUserNotifications = async(scope?: string) => {
  const params = scope ? `?scope=${scope}` : '';
  const response = await fetchWithAuth(`${API_BASE_URL}/notifications${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user notifications');
  }
  const data = await response.json();
  return data.notifications;
};

export const useUserNotifications = (enabled: boolean = true, scope?: string) => {
  return useQuery({
    queryKey: ['userNotifications', scope],
    queryFn: () => fetchUserNotifications(scope),
    enabled: enabled,
    retry: 1,
  });
};

const fetchVendorOrders = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/vendors/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor orders');
  }
  const data = await response.json();
  return data;
};

export const useVendorOrders = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorOrders', vendorId],
    queryFn: () => fetchVendorOrders(vendorId),
    enabled: !!vendorId, // Only run query if vendorId exists
    retry: 1,
  });
};

const fetchOrderById = async (orderId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/${orderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }
  const data = await response.json();
  return data.order;
};

export const useOrderById = (orderId: string) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId,
    retry: 1,
  });
};

// Chat queries
const fetchChats = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/messages/chats`);
  if (!response.ok) {
    throw new Error('Failed to fetch chats');
  }
  return response.json();
};

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchMessages = async (chatId: string, page = 1, limit = 20) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/messages/chat/${chatId}/messages?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
};

export const useMessages = (chatId: string, page = 1) => {
  return useQuery({
    queryKey: ['messages', chatId, page],
    queryFn: () => fetchMessages(chatId, page),
    enabled: !!chatId,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// Review queries
const fetchVendorReviewAnalytics = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/reviews/vendor/${vendorId}/analytics`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor review analytics');
  }
  return response.json();
};

export const useVendorReviewAnalytics = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorReviewAnalytics', vendorId],
    queryFn: () => fetchVendorReviewAnalytics(vendorId),
    enabled: !!vendorId,
    retry: 1,
  });
};

const fetchVendorReviews = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/reviews/vendor/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor reviews');
  }
  return response.json();
};

export const useVendorReviews = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorReviews', vendorId],
    queryFn: () => fetchVendorReviews(vendorId),
    enabled: !!vendorId,
    retry: 1,
  });
};

const fetchVendorOrderMetrics = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/orders/${vendorId}/metrics`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor reviews');
  }
  return response.json();
};

export const useFetchVendorOrderMetrics = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorOrderMetrics', vendorId],
    queryFn: () => fetchVendorOrderMetrics(vendorId),
    enabled: !!vendorId,
    retry: 1,
  });
};



export const fetchAProducts = async (slug:string) => {
  const response = await fetchPublic(`${AProductBySlug}${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data;
};


const fetchAuctionProduct = async (productId: string) => {
  const response = await fetchPublic(`${API_BASE_URL}/products/${productId}/bids`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const data = await response.json();
  return data;
};

export const useFetchAuctionProduct = (productId: string) => {
  return useQuery({
    queryKey: ['auctionProduct', productId],
    queryFn: () => fetchAuctionProduct(productId),
    enabled: !!productId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000, // refetch every 15s for live bid updates
    retry: 1
  });
};

const fetchPlans = async () => {
  const response = await fetchPublic(`${API_BASE_URL}/subscriptions/plans`);
  if (!response.ok) {
    throw new Error('Failed to fetch plans');
  }
  const data = await response.json();
  return data.plans;
};

export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchVendorSubscription = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/subscriptions/vendor/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor subscription');
  }
  const data = await response.json();
  return data;
};

export const useVendorSubscription = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorSubscription', vendorId],
    queryFn: () => fetchVendorSubscription(vendorId),
    enabled: !!vendorId,
    retry: 1
  });
};

const fetchCountrySubscriptionPrice = async (vendorId: string) => {
  const response = await fetchWithAuth(`${API_BASE_URL}/subscriptions/countrySubscriptionPrice/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch country subscription price');
  }
  const data = await response.json();
  return data;
};

export const useCountrySubscriptionPrice = (vendorId: string) => {
  return useQuery({
    queryKey: ['countrySubscriptionPrice', vendorId],
    queryFn: () => fetchCountrySubscriptionPrice(vendorId),
    enabled: !!vendorId,
    refetchOnWindowFocus: false,
    retry: 1
  });
};


