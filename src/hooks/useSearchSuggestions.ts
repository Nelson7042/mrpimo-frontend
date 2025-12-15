import { useQuery } from "@tanstack/react-query";
import { SearchSuggestionsResponse } from "@/types/search.types";
import { API_BASE_URL } from "@/utils/config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useUserStore } from "@/stores/useUserStore";

const fetchSearchSuggestions = async (
  query: string,
  limit: number = 5
): Promise<SearchSuggestionsResponse> => {
  if (!query.trim() || query.trim().length < 2) {
    return { success: true, suggestions: [] };
  }
  
  const response = await fetch(
    `${API_BASE_URL}/products/search/suggestions?q=${encodeURIComponent(query.trim())}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch search suggestions");
  }
  
  const data = await response.json();
  
  // If suggestions don't have priceInfo, fetch full product data for each
  if (data.suggestions && data.suggestions.length > 0) {
    const suggestionsWithPriceInfo = await Promise.all(
      data.suggestions.map(async (suggestion: any) => {
        // If priceInfo is missing, fetch full product data
        if (!suggestion.priceInfo) {
          try {
            const user = useUserStore.getState().user;
            const productResponse = user?._id 
              ? await fetchWithAuth(`${API_BASE_URL}/products/${suggestion._id}`)
              : await fetch(`${API_BASE_URL}/products/${suggestion._id}`);
            
            if (productResponse.ok) {
              const productData = await productResponse.json();
              // Merge priceInfo from full product data
              if (productData?.product?.priceInfo) {
                return {
                  ...suggestion,
                  priceInfo: productData.product.priceInfo,
                };
              }
            }
          } catch (error) {
            console.error(`Failed to fetch priceInfo for product ${suggestion._id}:`, error);
          }
        }
        return suggestion;
      })
    );
    
    return {
      ...data,
      suggestions: suggestionsWithPriceInfo,
    };
  }
  
  return data;
};

export const useSearchSuggestions = (query: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["searchSuggestions", query, limit],
    queryFn: () => fetchSearchSuggestions(query, limit),
    enabled: query.trim().length >= 2, // Only fetch when query is 2+ characters
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

