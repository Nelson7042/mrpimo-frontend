import { toastConfigError } from '@/app/config/toast.config';
import { useUserStore } from '@/stores/useUserStore';
import { AllProduct, AProduct, AProductBySlug } from '@/utils/config';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const googleLogin = async () => {
  const response = await fetch('http://localhost:5800/api/v1/auth/google', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    toast.error('Google authentication failed!', toastConfigError);
    // throw new Error('Network response was not ok');
    return null;
  }
  return response.json();
};

export const useGoogleLogin = () => {
  return useQuery({
    queryKey: ['google'],
    queryFn: googleLogin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    enabled: false,
    retry: false
  });
};

// Fetch categories
const fetchCategories = async () => {
  const response = await fetch('http://localhost:5800/api/v1/categories');
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


// Fetch best deals
const fetchBestDeals = async () => {
  const response = await fetch('http://localhost:5800/api/v1/products/best-deals');
  if (!response.ok) {
    throw new Error('Failed to fetch best deals');
  }
  const data = await response.json();
  return data.products;
};

export const useBestDeals = () => {
  return useQuery({
    queryKey: ['bestDeals'],
    queryFn: fetchBestDeals,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
};


const fetchUserSubscriptions = async () => {
  const response = await fetchWithAuth('http://localhost:5800/api/v1/push/user');
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  console.log("User subscriptions:", data);
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
  const response = await fetch(`http://localhost:5800/api/v1/products/slug/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const data = await response.json();
  console.log("Product data:", data);
  return data;
};

export const useFetchProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchProductById = async (productId: string) => {
  const user = useUserStore.getState().user;
  const response = user?._id ? await fetchWithAuth(`http://localhost:5800/api/v1/products/${productId}`) : await fetch(`http://localhost:5800/api/v1/products/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  const data = await response.json();
  console.log("Product data:", data);
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
    `http://localhost:5800/api/v1/products/${entityId}/performance`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch product analytics");
  }
  const data = await response.json();
  console.log("Product analytics:", data);
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

const fetchAllProducts = async () => {
  const response = await fetch('http://localhost:5800/api/v1/products?page=1&limit=50');
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data.products;
};

export const useFetchAllProducts = () => {
  return useQuery({
    queryKey: ['allProducts'],
    queryFn: fetchAllProducts,
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

const fetchProductsOnAuction = async (queryData: AuctionQueryDataType) => {
  const params = new URLSearchParams();

  if (queryData.page !== undefined) params.append('page', queryData.page.toString());
  if (queryData.limit !== undefined) params.append('limit', queryData.limit.toString());
  if (queryData.status) params.append('status', queryData.status);
  if (queryData.categoryId) params.append('categoryId', queryData.categoryId);

  const response = await fetch(`http://localhost:5800/api/v1/products/auctions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products on auction');
  }
  const data = await response.json();
  console.log("Products on auction data:", data);
  return data.products;
};


export const useProductsOnAuction = (queryData: AuctionQueryDataType) => {
  return useQuery({
    queryKey: ['productsOnAuction', queryData],
    queryFn: () => fetchProductsOnAuction(queryData),
    refetchOnWindowFocus: false,
    retry: 1,
  });
};



const fetchVendorProducts = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/products/vendor/${vendorId}`);
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
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/dashboard/vendors/${vendorId}/analytics?range=${range}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  const data = await response.json();
  console.log("Vendor analytics data:", data);
  return data;
};

export const useVendorAnalytics= (vendorId: string, range?: string) => {
  return useQuery({
    queryKey: ['vendorAnalytics', vendorId, range],
    queryFn: () => fetchVendorAnalytics(vendorId, range),
    enabled: !!vendorId, // ensures it won't run if vendorId is undefined/null
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchUserNotifications = async() => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/notifications`);
  if (!response.ok) {
    throw new Error('Failed to fetch user notifications');
  }
  const data = await response.json();
  return data.notifications;
};

export const useUserNotifications = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['userNotifications'],
    queryFn: fetchUserNotifications,
    enabled: enabled,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchVendorOrders = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/orders/vendors/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor orders');
  }
  const data = await response.json();
  console.log("Data is")
  return data;
};

export const useVendorOrders = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorOrders', vendorId],
    queryFn: () => fetchVendorOrders(vendorId),
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchOrderById = async (orderId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/orders/${orderId}`);
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
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// Chat queries
const fetchChats = async () => {
  const response = await fetchWithAuth('http://localhost:5800/api/v1/messages/chats');
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
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/messages/chat/${chatId}/messages?page=${page}&limit=${limit}`);
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
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/reviews/vendor/${vendorId}/analytics`);
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
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchVendorReviews = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/reviews/vendor/${vendorId}`);
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
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchVendorOrderMetrics = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/orders/${vendorId}/metrics`);
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
    refetchOnWindowFocus: false,
    retry: 1,
  });
};



export const fetchAProducts = async (slug:string) => {
  const response = await fetch(`${AProductBySlug}${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data;
};


const fetchAuctionProduct = async (productId: string) => {
  const response = await fetch(`http://localhost:5800/api/v1/products/${productId}/bids`);
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
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchPlans = async () => {
  const response = await fetch('http://localhost:5800/api/v1/subscriptions/plans');
  if (!response.ok) {
    throw new Error('Failed to fetch plans');
  }
  const data = await response.json();
  console.log('Backend Plans Response:', data);
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
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/subscriptions/vendor/${vendorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor subscription');
  }
  const data = await response.json();
  console.log('Vendor Subscription Response:', data);
  return data;
};

export const useVendorSubscription = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorSubscription', vendorId],
    queryFn: () => fetchVendorSubscription(vendorId),
    enabled: !!vendorId,
    refetchOnWindowFocus: false,
    retry: 1
  });
};

const fetchCountrySubscriptionPrice = async (vendorId: string) => {
  const response = await fetchWithAuth(`http://localhost:5800/api/v1/subscriptions/countrySubscriptionPrice/${vendorId}`);
  console.log(vendorId);
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


