# Search Implementation Guide

This guide explains how to use the new product search implementation in the frontend.

## Overview

The search implementation consists of:
- **Hooks**: React Query hooks for fetching search data
- **Components**: Reusable search UI components
- **Pages**: Search results page with filters and pagination

## Files Created

### Hooks

1. **`src/hooks/useProductSearch.ts`**
   - React Query hook for product search
   - Supports filters (category, status, price range)
   - Includes pagination
   - Usage:
     ```typescript
     const { data, isLoading, error } = useProductSearch("laptop", {
       page: 1,
       limit: 20,
       category: "electronics",
       minPrice: 100,
       maxPrice: 1000,
     });
     ```

2. **`src/hooks/useSearchSuggestions.ts`**
   - Hook for autocomplete suggestions
   - Debounced (300ms)
   - Only fetches when query is 2+ characters
   - Usage:
     ```typescript
     const { data, isLoading } = useSearchSuggestions("laptop", 5);
     ```

### Components

3. **`src/components/ProductSearchBar.tsx`**
   - Reusable search bar component
   - Features:
     - Real-time autocomplete suggestions
     - Keyboard navigation (Arrow keys, Enter, Escape)
     - Loading states
     - Click outside to close
     - Clear button
   - Usage:
     ```typescript
     <ProductSearchBar
       onSearch={(query) => {
         router.push(`/search?q=${encodeURIComponent(query)}`);
       }}
       placeholder="Search products..."
     />
     ```

### Pages

4. **`src/app/search/page.tsx`**
   - Search results page
   - Features:
     - Search bar
     - Filters (category, status, price range)
     - Product grid display
     - Pagination
     - Empty/error states

## How to Use

### Option 1: Use the Search Page

Navigate to `/search` or use the search bar to redirect there.

```typescript
import { useRouter } from "next/navigation";

const router = useRouter();
router.push(`/search?q=${encodeURIComponent("laptop")}`);
```

### Option 2: Add Search to Any Component

```typescript
import ProductSearchBar from "@/components/ProductSearchBar";
import { useRouter } from "next/navigation";

const MyComponent = () => {
  const router = useRouter();
  
  return (
    <ProductSearchBar
      onSearch={(query) => {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
    />
  );
};
```

### Option 3: Use Hooks Directly

```typescript
import { useProductSearch } from "@/hooks/useProductSearch";

const { data, isLoading, error } = useProductSearch("laptop", {
  page: 1,
  limit: 20,
  category: "electronics",
});
```

## Features

- ✅ Debounced search suggestions (300ms)
- ✅ Caching via React Query
- ✅ Keyboard navigation
- ✅ Loading and error states
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Product links use `_id` for proper routing

## Integration with Existing Code

The existing `useSearch.ts` has been updated to re-export the new `useSearchSuggestions` hook for backward compatibility. The Header component continues to work with the existing implementation, but now uses product `_id` instead of `slug` for proper routing.

## API Endpoints

The implementation uses these backend endpoints:
- `GET /api/v1/products/search/suggestions?q={query}&limit={limit}` - For autocomplete
- `GET /api/v1/products/search?q={query}&page={page}&limit={limit}&category={category}&status={status}&minPrice={minPrice}&maxPrice={maxPrice}` - For search results

## Next Steps

1. Test the search: Navigate to `/search` and try searching
2. Customize: Adjust styles, debounce timing, or API endpoints as needed
3. Optional: Replace Header search with `ProductSearchBar` component for consistency

## Notes

- Product details links now use `_id` instead of `slug` to ensure proper routing
- The search implementation handles incomplete product data gracefully
- Auction products are always shown regardless of quantity


