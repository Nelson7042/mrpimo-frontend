// Feature: review-system-enhancement, Property 3: Featured reviews maximum limit
// **Validates: Requirements 3.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the filtering/limiting logic
 * from getFeaturedReviews in mprimo-backend/src/controllers/review.controller.ts.
 *
 * Given a set of reviews that are ALL marked as isFeatured: true,
 * applies the same sort + limit logic and returns at most 10 reviews.
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

// Generate a featured review (isFeatured is always true)
const featuredReviewArb: fc.Arbitrary<RawReview> = fc.record({
  _id: fc.stringMatching(/^rev_[a-z0-9]{4,8}$/),
  userId: populatedUserArb,
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
  isFeatured: fc.constant(true as boolean),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// Generate 0 to 50 featured reviews
const featuredReviewsArb = fc.array(featuredReviewArb, { minLength: 0, maxLength: 50 });

describe('Feature: review-system-enhancement, Property 3: Featured reviews maximum limit', () => {
  it('should return at most 10 reviews regardless of how many are marked featured', () => {
    fc.assert(
      fc.property(featuredReviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        // The result must never exceed 10 reviews
        expect(result.length).toBeLessThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });

  it('should return all featured reviews when there are fewer than 10', () => {
    // Generate 0 to 9 featured reviews
    const fewFeaturedReviewsArb = fc.array(featuredReviewArb, { minLength: 0, maxLength: 9 });

    fc.assert(
      fc.property(fewFeaturedReviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        // When there are fewer than 10 featured reviews, all should be returned
        expect(result.length).toBe(reviews.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should return exactly 10 reviews when there are more than 10 featured reviews', () => {
    // Generate 11 to 50 featured reviews
    const manyFeaturedReviewsArb = fc.array(featuredReviewArb, { minLength: 11, maxLength: 50 });

    fc.assert(
      fc.property(manyFeaturedReviewsArb, (reviews) => {
        const result = getFeaturedReviewsLogic(reviews);

        // When there are more than 10 featured reviews, exactly 10 should be returned
        expect(result.length).toBe(10);
      }),
      { numRuns: 100 }
    );
  });
});
