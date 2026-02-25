// Feature: seo-optimization, Property 5: Search metadata reflects query
// **Validates: Requirements 7.1, 7.2**

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock client-side dependencies before importing the search page module
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/hooks/useProductSearch', () => ({
  useProductSearch: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/components/Home/ProductCard', () => ({
  ProductCard: vi.fn(() => null),
}));

vi.mock('@/components/ProductSearchBar', () => ({
  default: vi.fn(() => null),
}));

vi.mock('lucide-react', () => ({
  Loader2: vi.fn(() => null),
  Filter: vi.fn(() => null),
}));

import { getSearchMetadata } from '@/app/search/page';

describe('Property 5: Search metadata reflects query', () => {
  it('should produce a title containing the query and a description containing both the query and the count for any non-empty query', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.nat(),
        (query, count) => {
          const { title, description } = getSearchMetadata(query, count);

          // Title contains the query text
          expect(title).toContain(query);

          // Description contains the query text
          expect(description).toContain(query);

          // Description contains the count as a string
          expect(description).toContain(String(count));
        }
      ),
      { numRuns: 100 }
    );
  });
});
