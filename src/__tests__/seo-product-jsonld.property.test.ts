// Feature: seo-optimization, Property 3: Product JSON-LD structure completeness
// **Validates: Requirements 6.1, 6.2, 6.3**

import React from 'react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Make React available globally for JSX in components that use the automatic runtime
globalThis.React = React;

import ProductJsonLd from '@/components/seo/ProductJsonLd';

describe('Property 3: Product JSON-LD structure completeness', () => {
  it('should produce a complete Product JSON-LD with @context, @type, name, description, image, sku, and offers for any valid product data', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          image: fc.webUrl(),
          sku: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(999999), noNaN: true }),
          currency: fc.stringMatching(/^[A-Z]{3}$/),
          availability: fc.constantFrom(
            'https://schema.org/InStock',
            'https://schema.org/OutOfStock',
            'https://schema.org/PreOrder'
          ),
        }),
        ({ name, description, image, sku, price, currency, availability }) => {
          const element = ProductJsonLd({
            name,
            description,
            image,
            sku,
            price,
            currency,
            availability,
          });

          // Verify the element is a script tag with application/ld+json type
          expect(element.type).toBe('script');
          expect(element.props.type).toBe('application/ld+json');

          // Parse the JSON-LD content
          const jsonLd = JSON.parse(element.props.dangerouslySetInnerHTML.__html);

          // @context must be https://schema.org
          expect(jsonLd['@context']).toBe('https://schema.org');

          // @type must be Product
          expect(jsonLd['@type']).toBe('Product');

          // name, description, image, sku must match the input props
          expect(jsonLd.name).toBe(name);
          expect(jsonLd.description).toBe(description);
          expect(jsonLd.image).toBe(image);
          expect(jsonLd.sku).toBe(sku);

          // offers object must exist with correct structure
          expect(jsonLd.offers).toBeDefined();
          expect(jsonLd.offers['@type']).toBe('Offer');
          expect(jsonLd.offers.price).toBe(price);
          expect(jsonLd.offers.priceCurrency).toBe(currency);
          expect(jsonLd.offers.availability).toBe(availability);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: seo-optimization, Property 4: Aggregate rating conditional inclusion
// **Validates: Requirements 6.4**

describe('Property 4: Aggregate rating conditional inclusion based on reviews presence', () => {
  const baseProductArb = fc.record({
    name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    description: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    image: fc.webUrl(),
    sku: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(999999), noNaN: true }),
    currency: fc.stringMatching(/^[A-Z]{3}$/),
    availability: fc.constantFrom(
      'https://schema.org/InStock',
      'https://schema.org/OutOfStock',
      'https://schema.org/PreOrder'
    ),
  });

  it('should include aggregateRating when ratingValue > 0 and reviewCount > 0', () => {
    fc.assert(
      fc.property(
        baseProductArb,
        fc.float({ min: Math.fround(0.01), max: 5, noNaN: true }),
        fc.integer({ min: 1, max: 10000 }),
        (product, ratingValue, reviewCount) => {
          const element = ProductJsonLd({
            ...product,
            ratingValue,
            reviewCount,
          });

          const jsonLd = JSON.parse(element.props.dangerouslySetInnerHTML.__html);

          // aggregateRating must be present
          expect(jsonLd.aggregateRating).toBeDefined();
          expect(jsonLd.aggregateRating['@type']).toBe('AggregateRating');
          expect(jsonLd.aggregateRating.ratingValue).toBe(ratingValue);
          expect(jsonLd.aggregateRating.reviewCount).toBe(reviewCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT include aggregateRating when ratingValue and reviewCount are undefined', () => {
    fc.assert(
      fc.property(baseProductArb, (product) => {
        const element = ProductJsonLd({
          ...product,
          // ratingValue and reviewCount omitted (undefined)
        });

        const jsonLd = JSON.parse(element.props.dangerouslySetInnerHTML.__html);

        // aggregateRating must NOT be present
        expect(jsonLd.aggregateRating).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
