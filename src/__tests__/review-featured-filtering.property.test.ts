// Feature: review-system-enhancement, Property 2: Featured reviews filtering and completeness
// **Validates: Requirements 3.1, 3.2, 6.3**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the filtering and formatting logic
 * from getFeaturedReviews in mprimo-backend/src/controllers/review.controller.ts.
 *
 * Given a set of reviews (with populated user data) and mixed isFeatured values,
 * returns only reviews where isFeatured is true, formatted with the required fields.
 */
interface PopulatedUser {
  profile: {
    firstName: string;
    avatar: string | null;
  };
}

interface RawReview {
  _id: string;
  userId: PopulatedUser | null;
  rating: number;
  comment: string;
  isFeatured: boolean;
  createdAt: Date;
}

interface FormattedFeaturedReview {
  _id: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  comment: string;
  rating: number;
}

function getFeaturedReviewsLogic(allReviews: RawReview[]): FormattedFeaturedReview[] {
  // Filter by isFeatured
  const featuredReviews = allReviews.filter((r) => r.isFeatured === true);

  // Sort by createdAt descending (matching controller behavior)
  const sorted = [...featuredReviews].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Limit to 10
  const limited = sorted.slice(0, 10);

  // Format response
  return limited.map((review) => ({
    _id: review._id,
    reviewerName: (review.userId as PopulatedUser | null)?.profile?.firstName || 'Anonymous',
    reviewerAvatar: (review.userId as PopulatedUser | null)?.profile?.avatar || null,
    comment: review.comment,
    rating: review.rating,
  }));
}

// Arbitraries for generating test data
const avatarArb = fc.oneof(
  fc.webUrl(),
  fc.constant(null)
);

const populatedUserArb: fc.Arbitrary<PopulatedUser | null> = fc.oneof(
  fc.record({
    profile: fc.record({
      firstName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      avatar: avatarArb,
    }),
  }),
  fc.constant(null)
);

const reviewArb: fc.Arbitrary<RawReview> = fc.record({
  _id: fc.stringMatching(/^rev_[a-z0-9]{4,8}$/),
  userId: populatedUserArb,
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
  isFeatured: fc.boolean(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// Generate a set of reviews with mixed isFeatured values
const reviewsArb = fc.array(reviewArb, { minLength: 1, maxLength: 30 });

describe('Feature: review-system-enhancement, Property 2: Featured reviews filtering and completeness', () => {
  it('should return only reviews where isFeatured is true', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        // Every returned review must correspond to a review with isFeatured: true
        for (const featuredReview of result) {
          const original = reviews.find((r) => r._id === featuredReview._id);
          expect(original).toBeDefined();
          expect(original!.isFeatured).toBe(true);
        }

        // All featured reviews (up to limit of 10) should be present in the result
        const allFeatured = reviews.filter((r) => r.isFeatured === true);
        const expectedCount = Math.min(allFeatured.length, 10);
        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should include reviewerName as a string in each returned review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        for (const review of result) {
          expect(typeof review.reviewerName).toBe('string');
          expect(review.reviewerName.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include reviewerAvatar as a string or null in each returned review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        for (const review of result) {
          expect(
            review.reviewerAvatar === null || typeof review.reviewerAvatar === 'string'
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include comment as a non-empty string in each returned review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        for (const review of result) {
          expect(typeof review.comment).toBe('string');
          expect(review.comment.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include rating as a number between 1 and 5 in each returned review', () => {
    fc.assert(
      fc.property(reviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        for (const review of result) {
          expect(typeof review.rating).toBe('number');
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return an empty array when no reviews are marked as featured', () => {
    // Generate reviews that are all NOT featured
    const nonFeaturedReviewsArb = fc.array(
      fc.record({
        _id: fc.stringMatching(/^rev_[a-z0-9]{4,8}$/),
        userId: populatedUserArb,
        rating: fc.integer({ min: 1, max: 5 }),
        comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
        isFeatured: fc.constant(false),
        createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      }),
      { minLength: 1, maxLength: 20 }
    );

    fc.assert(
      fc.property(nonFeaturedReviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);
        expect(result).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});
