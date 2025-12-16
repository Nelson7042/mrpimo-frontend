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
      displayPrice?: number;
      currencySymbol?: string;
    }>;
  }>;
  priceInfo?: {
    displayPrice?: number;
    originalPrice?: number;
    currencySymbol?: string;
    displayCurrency?: string;
    exchangeRate?: number;
    originalCurrency?: string;
  };
  country?: {
    currency?: string;
    currencySymbol?: string;
  };
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