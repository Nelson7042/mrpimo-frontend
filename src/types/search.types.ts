export interface SearchSuggestion {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  category?: {
    main?: { name: string };
    sub?: { name: string }[];
  };
  variants?: Array<{
    options: Array<{
      price: number;
    }>;
  }>;
}

export interface SearchResponse {
  success: boolean;
  products: SearchSuggestion[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchSuggestionsResponse {
  success: boolean;
  suggestions: SearchSuggestion[];
}