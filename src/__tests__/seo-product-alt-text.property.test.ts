// Feature: seo-optimization, Property 7: Product image alt text derivation from product name
// **Validates: Requirements 10.3**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getProductImageAlt } from '@/utils/helper';

describe('Property 7: Product image alt text derivation from product name', () => {
  it('should produce a non-empty alt text derived from the product name for any product with a name and images', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          imageCount: fc.integer({ min: 1, max: 10 }),
        }),
        ({ name, imageCount }) => {
          // For each image in the product, the alt text should be non-empty and derived from the product name
          for (let i = 0; i < imageCount; i++) {
            const alt = getProductImageAlt(name, i);

            // Alt text must be non-empty
            expect(alt.length).toBeGreaterThan(0);

            // Alt text must contain or be derived from the product name
            expect(alt).toContain(name.trim());
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it('should return the product name directly for the first image (index 0 or undefined)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (name) => {
          const altNoIndex = getProductImageAlt(name);
          const altIndex0 = getProductImageAlt(name, 0);

          // Both should equal the trimmed product name
          expect(altNoIndex).toBe(name.trim());
          expect(altIndex0).toBe(name.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include image index suffix for subsequent images (index > 0)', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          index: fc.integer({ min: 1, max: 20 }),
        }),
        ({ name, index }) => {
          const alt = getProductImageAlt(name, index);

          // Alt text must contain the product name
          expect(alt).toContain(name.trim());

          // Alt text must include the image number suffix
          expect(alt).toContain(`Image ${index + 1}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fall back to "Product image" when product name is empty or whitespace', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 }).map((arr) => arr.join('')),
        (whitespace) => {
          const alt = getProductImageAlt(whitespace);

          // Alt text must still be non-empty
          expect(alt.length).toBeGreaterThan(0);
          expect(alt).toBe('Product image');
        }
      ),
      { numRuns: 100 }
    );
  });
});
