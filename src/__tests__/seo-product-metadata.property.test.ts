// Feature: seo-optimization, Property 1: Product metadata contains product data
// **Validates: Requirements 5.1, 5.3, 5.4**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock the global fetch used by fetchProduct
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { generateMetadata } from '@/app/home/product-details/[id]/page';

describe('Property 1: Product metadata contains product data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should produce metadata with product name in title, OG title, correct OG type, OG images, and canonical URL for any valid product', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          images: fc
            .array(fc.webUrl(), { minLength: 1, maxLength: 5 })
            .filter((arr) => arr.length > 0),
          id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0 && !s.includes('/')),
        }),
        async ({ name, description, images, id }) => {
          // Mock fetch to return the generated product data
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              product: { name, description, images },
            }),
          });

          const metadata = await generateMetadata({ params: { id } });

          // Title contains the product name
          expect(metadata.title).toContain(name);

          // Open Graph title equals the product name
          const og = metadata.openGraph as {
            title: string;
            type: string;
            images: Array<{ url: string }>;
          };
          expect(og).toBeDefined();
          expect(og.title).toBe(name);

          // Open Graph type is 'product'
          expect(og.type).toBe('product');

          // Open Graph images include the first product image
          expect(og.images).toBeDefined();
          expect(og.images.length).toBeGreaterThanOrEqual(1);
          expect(og.images[0].url).toBe(images[0]);

          // Canonical URL ends with /home/product-details/{id}
          const alternates = metadata.alternates as {
            canonical: string;
          };
          expect(alternates).toBeDefined();
          expect(alternates.canonical).toMatch(
            new RegExp(`/home/product-details/${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: seo-optimization, Property 2: Product description truncation
// **Validates: Requirements 5.2**

describe('Property 2: Product description truncation to 160 characters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should truncate descriptions longer than 160 chars to exactly 160 chars (a prefix of the original), and preserve descriptions of 160 chars or fewer', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          description: fc.string({ minLength: 0, maxLength: 600 }),
          id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0 && !s.includes('/')),
        }),
        async ({ description, id }) => {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              product: {
                name: 'Test Product',
                description,
                images: ['https://example.com/img.jpg'],
              },
            }),
          });

          const metadata = await generateMetadata({ params: { id } });

          const metaDescription = metadata.description as string;

          if (description.length > 160) {
            // Description should be exactly 160 characters
            expect(metaDescription.length).toBe(160);
            // It should be a prefix of the original description
            expect(description.startsWith(metaDescription)).toBe(true);
          } else {
            // Description should equal the original
            expect(metaDescription).toBe(description);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
