// Feature: review-system-enhancement, Property 1: User reviews ownership and ordering
// **Validates: Requirements 1.1, 1.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the filtering, sorting, and formatting logic
 * from getUserReviews in mprimo-backend/src/controllers/review.controller.ts.
 *
 * Given a set of reviews (with populated product data) and a requesting userId,
 * returns only reviews belonging to that user, sorted by createdAt descending,
 * formatted with the required fields.
 */
interface RawReview {
  _id: string;
  userId: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
  } | null;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface FormattedReview {
  _id: string;
  productName: string;
  productImage: string | null;
  productId: string | undefined;
  rating: number;
  comment: string;
  createdAt: Date;
}

function getUserReviewsLogic(
  allReviews: RawReview[],
  requestingUserId: string
): FormattedReview[] {
  // Filter by userId
  const userReviews = allReviews.filter((r) => r.userId === requestingUserId);

  // Sort by createdAt descending
  const sorted = [...userReviews].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Format response
  return sorted.map((review) => ({
    _id: review._id,
    productName: review.productId?.name || 'Unknown Product',
    productImage: review.productId?.images?.[0] || null,
    productId: review.productId?._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }));
}

// Arbitraries for generating test data
const userIdArb = fc.stringMatching(/^user_[a-z0-9]{4,8}$/);

const productArb = fc.record({
  _id: fc.stringMatching(/^prod_[a-z0-9]{4,8}$/),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  images: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
});

const reviewArb = (userIds: string[]) =>
  fc.record({
    _id: fc.stringMatching(/^rev_[a-z0-9]{4,8}$/),
    userId: fc.constantFrom(...userIds),
    productId: fc.oneof(productArb, fc.constant(null)),
    rating: fc.integer({ min: 1, max: 5 }),
    comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  });

// Generate a scenario with multiple users and multiple reviews
const scenarioArb = fc
  .array(userIdArb, { minLength: 2, maxLength: 6 })
  .chain((userIds) => {
    const uniqueUserIds = [...new Set(userIds)];
    // Ensure at least 2 unique users
    if (uniqueUserIds.length < 2) {
      return fc.constant({ userIds: ['user_aaa', 'user_bbb'], reviews: [] as RawReview[] });
    }
    return fc
      .array(reviewArb(uniqueUserIds), { minLength: 1, maxLength: 30 })
      .map((reviews) => ({ userIds: uniqueUserIds, reviews }));
  });

describe('Feature: review-system-enhancement, Property 1: User reviews ownership and ordering', () => {
  it('should return only reviews belonging to the requesting user', () => {
    fc.assert(
      fc.property(scenarioArb, ({ userIds, reviews }) => {
        // Pick a random user to be the "requesting" user
        const requestingUserId = userIds[0];
        const result = getUserReviewsLogic(reviews, requestingUserId);

        // Every returned review must belong to the requesting user
        for (const review of result) {
          const original = reviews.find((r) => r._id === review._id);
          expect(original).toBeDefined();
          expect(original!.userId).toBe(requestingUserId);
        }

        // No review belonging to the requesting user should be missing
        const expectedCount = reviews.filter((r) => r.userId === requestingUserId).length;
        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should return reviews sorted by createdAt in descending order', () => {
    fc.assert(
      fc.property(scenarioArb, ({ userIds, reviews }) => {
        const requestingUserId = userIds[0];
        const result = getUserReviewsLogic(reviews, requestingUserId);

        // Verify descending order by createdAt
        for (let i = 1; i < result.length; i++) {
          const prev = result[i - 1].createdAt.getTime();
          const curr = result[i].createdAt.getTime();
          expect(prev).toBeGreaterThanOrEqual(curr);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should include all required fields (productName, productImage, rating, comment, createdAt) in each review', () => {
    fc.assert(
      fc.property(scenarioArb, ({ userIds, reviews }) => {
        const requestingUserId = userIds[0];
        const result = getUserReviewsLogic(reviews, requestingUserId);

        for (const review of result) {
          // productName must be a string
          expect(typeof review.productName).toBe('string');
          expect(review.productName.length).toBeGreaterThan(0);

          // productImage must be string or null
          expect(
            review.productImage === null || typeof review.productImage === 'string'
          ).toBe(true);

          // rating must be a number between 1 and 5
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);

          // comment must be a non-empty string
          expect(typeof review.comment).toBe('string');
          expect(review.comment.length).toBeGreaterThan(0);

          // createdAt must be a valid Date
          expect(review.createdAt).toBeInstanceOf(Date);
          expect(isNaN(review.createdAt.getTime())).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return an empty array when the user has no reviews', () => {
    fc.assert(
      fc.property(scenarioArb, ({ userIds, reviews }) => {
        // Use a userId that doesn't exist in the reviews
        const nonExistentUser = 'user_nonexistent';
        const result = getUserReviewsLogic(reviews, nonExistentUser);

        expect(result).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});
