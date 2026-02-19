import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { fetchPublic } from '@/utils/fetchPublic';
import { API_BASE_URL } from '@/utils/config';

interface Banner {
  _id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  backgroundColor: string;
  location: string;
  status: string;
  products: Array<{
    _id: string;
    name: string;
    slug: string;
    images: string[];
    priceInfo: {
      originalPrice: number;
      originalCurrency: string;
      displayPrice: number;
      displayCurrency: string;
      currencySymbol: string;
      exchangeRate: number;
    };
  }>;
}

const bannerApi = {
  getBanners: async (): Promise<Banner[]> => {
    const response = await fetchPublic(`${API_BASE_URL}/banners/active`);
    if (!response.ok) throw new Error('Failed to fetch banners');
    const data = await response.json();
    return data.success ? data.data : [];
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