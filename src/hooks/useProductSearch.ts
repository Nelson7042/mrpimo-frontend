import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/utils/config";
import { SearchResponse } from "@/types/search.types";
import { fetchPublic } from "@/utils/fetchPublic";
import { useLocalityFilter } from "./useLocalityFilter";

export interface ProductSearchFilters {
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

const fetchProductSearch = async (
  query: string,
  filters: ProductSearchFilters = {},
  locality?: string
): Promise<SearchResponse> => {
  const params = new URLSearchParams();
  
  if (query.trim()) {
    params.append("q", query.trim());
  }
  
  if (filters.category) {
    params.append("category", filters.category);
  }
  
  if (filters.status) {
    params.append("status", filters.status);
  }
  
  if (filters.minPrice !== undefined) {
    params.append("minPrice", filters.minPrice.toString());
  }
  
  if (filters.maxPrice !== undefined) {
    params.append("maxPrice", filters.maxPrice.toString());
  }
  
  if (locality) {
    params.append("locality", locality);
  }
  
  params.append("page", (filters.page || 1).toString());
  params.append("limit", (filters.limit || 20).toString());

  const response = await fetchPublic(
    `${API_BASE_URL}/products/search?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch search results");
  }
  
  return response.json();
};

export const useProductSearch = (
  query: string,
  filters: ProductSearchFilters = {}
) => {
  const { locality } = useLocalityFilter();
  const localityParam = locality ?? undefined;
  return useQuery({
    queryKey: ["productSearch", query, filters, localityParam],
    queryFn: () => fetchProductSearch(query, filters, localityParam),
    enabled: query.trim().length > 0,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};


