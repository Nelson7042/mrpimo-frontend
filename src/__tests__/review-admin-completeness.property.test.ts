// Feature: review-system-enhancement, Property 5: Admin reviews include all reviews with featured status
// **Validates: Requirements 5.1**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the formatting logic from getAllReviewsForAdmin
 * in mprimo-backend/src/controllers/admin-review.controller.ts.
 *
 * Given a set of reviews (with populated product and user data),
 * returns ALL reviews (no filtering by user or featured status),
 * each including the correct isFeatured value and all required fields.
 */
interface PopulatedProduct {
  _id: string;
  name: string;
}

interface PopulatedUser {
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface RawReview {
  _id: string;
  productId: PopulatedProduct | null;
  userId: PopulatedUser | null;
  rating: number;
  comment: string;
  isFeatured: boolean;
  createdAt: Date;
}

interface FormattedAdminReview {
  _id: string;
  productName: string;
  productId: string | undefined;
  reviewerName: string;
  rating: number;
  comment: string;
  isFeatured: boolean;
  createdAt: Date;
}

function getAllReviewsForAdminLogic(allReviews: RawReview[]): FormattedAdminReview[] {
  // Sort by createdAt descending (matching controller behavior)
  const sorted = [...allReviews].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Format response — no filtering, all reviews are returned
  return sorted.map((review) => ({
    _id: review._id,
    productName: (review.productId as PopulatedProduct | null)?.name || 'Unknown Product',
    productId: (review.productId as PopulatedProduct | null)?._id,
    reviewerName:
      `${(review.userId as PopulatedUser | null)?.profile?.firstName || ''} ${(review.userId as PopulatedUser | null)?.profile?.lastName || ''}`.trim() ||
      'Anonymous',
    rating: review.rating,
    comment: review.comment,
    isFeatured: review.isFeatured,
    createdAt: review.createdAt,
  }));
}

// Arbitraries for generating test data
const populatedProductArb: fc.Arbitrary<PopulatedProduct | null> = fc.oneof(
  fc.record({
    _id: fc.stringMatching(/^prod_[a-z0-9]{4,8}$/),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  }),
  fc.constant(null)
);

const populatedUserArb: fc.Arbitrary<PopulatedUser | null> = fc.oneof(
  fc.record({
    profile: fc.record({
      firstName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      lastName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    }),
  }),
  fc.constant(null)
);

const validDateArb = fc
  .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
  .map((ts) => new Date(ts));

const reviewArb: fc.Arbitrary<RawReview> = fc.record({
  _id: fc.stringMatching(/^rev_[a-z0-9]{4,8}$/),
  productId: populatedProductArb,
  userId: populatedUserArb,
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
  isFeatured: fc.boolean(),
  createdAt: validDateArb,
});

// Generate a set of reviews with mixed featured statuses
const reviewsArb = fc.array(reviewArb, { minLength: 1, maxLength: 30 });

describe('Feature: review-system-enhancement, Property 5: Admin reviews include all reviews with featured status', () => {
  it('should return ALL reviews without filtering by user or featured status', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getAllReviewsForAdminLogic(reviews);

        // The admin endpoint must return every single review
        expect(result.length).toBe(reviews.length);

        // Every original review must appear in the result
        for (const original of reviews) {
          const found = result.find((r) => r._id === original._id);
          expect(found).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include the correct isFeatured value for each review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getAllReviewsForAdminLogic(reviews);

        for (const formatted of result) {
          const original = reviews.find((r) => r._id === formatted._id);
          expect(original).toBeDefined();
          expect(formatted.isFeatured).toBe(original!.isFeatured);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include productName as a non-empty string in each review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getAllReviewsForAdminLogic(reviews);

        for (const review of result) {
          expect(typeof review.productName).toBe('string');
          expect(review.productName.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include reviewerName as a non-empty string in each review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getAllReviewsForAdminLogic(reviews);

        for (const review of result) {
          expect(typeof review.reviewerName).toBe('string');
          expect(review.reviewerName.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include rating, comment, isFeatured, and createdAt in each review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getAllReviewsForAdminLogic(reviews);

        for (const review of result) {
          // rating must be a number between 1 and 5
          expect(typeof review.rating).toBe('number');
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);

          // comment must be a non-empty string
          expect(typeof review.comment).toBe('string');
          expect(review.comment.length).toBeGreaterThan(0);

          // isFeatured must be a boolean
          expect(typeof review.isFeatured).toBe('boolean');

          // createdAt must be a valid Date
          expect(review.createdAt).toBeInstanceOf(Date);
          expect(isNaN(review.createdAt.getTime())).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return both featured and non-featured reviews together', () => {
    // Generate reviews that have a mix of featured and non-featured
    const mixedReviewsArb = fc
      .tuple(
        fc.array(
          fc.record({
            _id: fc.stringMatching(/^rev_[a-z0-9]{4,8}$/),
            productId: populatedProductArb,
            userId: populatedUserArb,
            rating: fc.integer({ min: 1, max: 5 }),
            comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
            isFeatured: fc.constant(true),
            createdAt: validDateArb,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            _id: fc.stringMatching(/^nfr_[a-z0-9]{4,8}$/),
            productId: populatedProductArb,
            userId: populatedUserArb,
            rating: fc.integer({ min: 1, max: 5 }),
            comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
            isFeatured: fc.constant(false),
            createdAt: validDateArb,
          }),
          { minLength: 1, maxLength: 10 }
        )
      )
      .map(([featured, nonFeatured]) => [...featured, ...nonFeatured]);

    fc.assert(
      fc.property(mixedReviewsArb, (reviews) => {
        const result = getAllReviewsForAdminLogic(reviews);

        const featuredCount = reviews.filter((r) => r.isFeatured).length;
        const nonFeaturedCount = reviews.filter((r) => !r.isFeatured).length;

        const resultFeaturedCount = result.filter((r) => r.isFeatured).length;
        const resultNonFeaturedCount = result.filter((r) => !r.isFeatured).length;

        // Both featured and non-featured reviews must be present
        expect(resultFeaturedCount).toBe(featuredCount);
        expect(resultNonFeaturedCount).toBe(nonFeaturedCount);
        expect(result.length).toBe(reviews.length);
      }),
      { numRuns: 100 }
    );
  });
});
