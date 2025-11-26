import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface Country {
  _id: string;
  name: string;
  code: string;
}

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await fetchWithAuth('http://localhost:5800/api/v1/admin/countries');
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      const data = await response.json();
      // Handle different response formats
      if (Array.isArray(data)) {
        return data as Country[];
      } else if (data.countries && Array.isArray(data.countries)) {
        return data.countries as Country[];
      } else if (data.data && Array.isArray(data.data)) {
        return data.data as Country[];
      }
      // Return empty array as fallback
      return [] as Country[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};