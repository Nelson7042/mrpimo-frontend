import { useQuery } from "@tanstack/react-query";

import { SearchSuggestionsResponse } from "@/types/search.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5800";

export const useSearchSuggestions = (query: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["searchSuggestions", query, limit],
    queryFn: async (): Promise<SearchSuggestionsResponse> => {
      if (!query.trim()) {
        return { success: true, suggestions: [] };
      }
      
      const response = await fetch(
        `${API_BASE}/api/v1/products/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch search suggestions");
      }
      
      return response.json();
    },
    enabled: query.length > 0,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};