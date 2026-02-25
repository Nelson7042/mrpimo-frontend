// Feature: seo-optimization, Property 6: Category metadata contains category data
// **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the global fetch used by fetchCategory
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { generateMetadata } from '@/app/home/categories/[categoryId]/page';

describe('Property 6: Category metadata contains category data (title, description, OG, canonical)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should produce metadata with category name in title, description, OG title, OG type "website", and canonical URL containing categoryId for any valid category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          categoryId: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0 && !s.includes('/')),
        }),
        async ({ name, categoryId }) => {
          // Mock fetch to return the generated category data
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              category: { name },
            }),
          });

          const metadata = await generateMetadata({ params: { categoryId } });

          // Title contains the category name
          expect(metadata.title).toContain(name);

          // Description references the category name
          const description = metadata.description as string;
          expect(description).toBeDefined();
          expect(description).toContain(name);

          // Open Graph title contains the category name and type is 'website'
          const og = metadata.openGraph as {
            title: string;
            type: string;
          };
          expect(og).toBeDefined();
          expect(og.title).toContain(name);
          expect(og.type).toBe('website');

          // Canonical URL contains the categoryId
          const alternates = metadata.alternates as {
            canonical: string;
          };
          expect(alternates).toBeDefined();
          expect(alternates.canonical).toContain(categoryId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
