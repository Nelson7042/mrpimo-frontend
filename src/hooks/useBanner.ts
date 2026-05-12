import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchPublic } from '@/utils/fetchPublic';
import { API_BASE_URL } from '@/utils/config';
import { useCallback, useRef } from 'react';

interface ProductInfo {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  priceInfo?: {
    originalPrice: number;
    originalCurrency: string;
    displayPrice: number;
    displayCurrency: string;
    currencySymbol: string;
    exchangeRate: number;
  };
  variants?: any[];
  inventory?: any;
}

// New slide structure for big-banner carousel
interface BannerSlide {
  slideType: "product" | "campaign";
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  backgroundColor?: string;
  badge?: string;
  buttonText?: string;
  buttonLink?: string;
  productId?: ProductInfo;
}

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  content?: string;
  type?: "product" | "marketing";
  imageUrl?: string | null;
  backgroundColor?: string;
  location: string;
  status: string;
  buttonText?: string;
  buttonLink?: string;
  // Badge for promotional banners (e.g., "Hot Sale", "Auction")
  badge?: string;
  badgeStyle?: "red" | "blue" | "green" | "yellow" | "purple";
  // Text color for promotional banners (light for dark backgrounds, dark for light backgrounds)
  textColor?: "light" | "dark";
  // New: slides array for big-banner carousel
  slides?: BannerSlide[];
  rotationInterval?: number;
  // Legacy: products array for small banners and old big-banners
  products: ProductInfo[];
}

export type { Banner, BannerSlide, ProductInfo };

const bannerApi = {
  getBanners: async (): Promise<Banner[]> => {
    const response = await fetchPublic(`${API_BASE_URL}/banners/active`);
    if (!response.ok) throw new Error('Failed to fetch banners');
    const data = await response.json();
    return data.success ? data.data : [];
  },

  trackImpression: async (bannerId: string): Promise<void> => {
    try {
      await fetchPublic(`${API_BASE_URL}/banners/impression/${bannerId}`, {
        method: 'POST',
      });
    } catch (error) {
      // Silently fail - don't block user experience for analytics
      console.error('Failed to track banner impression:', error);
    }
  },

  trackClick: async (bannerId: string): Promise<void> => {
    try {
      await fetchPublic(`${API_BASE_URL}/banners/click/${bannerId}`, {
        method: 'GET',
      });
    } catch (error) {
      // Silently fail - don't block user experience for analytics
      console.error('Failed to track banner click:', error);
    }
  },
};

export const useBanners = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['banners'],
    queryFn: bannerApi.getBanners,
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for tracking banner impressions and clicks
 * Tracks impressions only once per banner per session
 */
export const useBannerTracking = () => {
  // Track which banners have been viewed in this session
  const trackedImpressions = useRef<Set<string>>(new Set());

  const trackImpression = useCallback((bannerId: string) => {
    if (!bannerId || trackedImpressions.current.has(bannerId)) {
      return;
    }
    trackedImpressions.current.add(bannerId);
    bannerApi.trackImpression(bannerId);
  }, []);

  const trackClick = useCallback((bannerId: string) => {
    if (!bannerId) return;
    bannerApi.trackClick(bannerId);
  }, []);

  return { trackImpression, trackClick };
};