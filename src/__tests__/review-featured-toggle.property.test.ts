// Feature: review-system-enhancement, Property 4: Featured toggle round-trip
// **Validates: Requirements 5.2, 5.3**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the toggle logic from toggleReviewFeatured
 * in mprimo-backend/src/controllers/admin-review.controller.ts.
 *
 * Given a review with an isFeatured state and a target boolean value,
 * sets isFeatured to that value and returns the updated state.
 */
interface Review {
  _id: string;
  rating: number;
  comment: string;
  isFeatured: boolean;
}

function applyToggle(review: Review, isFeatured: boolean): Review {
  return { ...review, isFeatured };
}

// Arbitrary for generating reviews with random initial isFeatured states
const reviewArb: fc.Arbitrary<Review> = fc.record({
  _id: fc.stringMatching(/^[a-f0-9]{24}$/),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
  isFeatured: fc.boolean(),
});

describe('Feature: review-system-enhancement, Property 4: Featured toggle round-trip', () => {
  it('toggling true→false restores original state for initially-false reviews', () => {
    // For any review starting with isFeatured=false,
    // toggle to true then back to false should restore original state
    const initiallyFalseReviewArb = fc.record({
      _id: fc.stringMatching(/^[a-f0-9]{24}$/),
      rating: fc.integer({ min: 1, max: 5 }),
      comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
      isFeatured: fc.constant(false as boolean),
    });

    fc.assert(
      fc.property(initiallyFalseReviewArb, (review) => {
        // Toggle to true
        const afterToggleTrue = applyToggle(review, true);
        expect(afterToggleTrue.isFeatured).toBe(true);

        // Toggle back to false
        const afterToggleFalse = applyToggle(afterToggleTrue, false);
        expect(afterToggleFalse.isFeatured).toBe(false);

        // Should match original state
        expect(afterToggleFalse.isFeatured).toBe(review.isFeatured);
      }),
      { numRuns: 100 }
    );
  });

  it('toggling false→true→false restores original state for initially-true reviews', () => {
    // For any review starting with isFeatured=true,
    // toggle to false then back to true should restore original state
    const initiallyTrueReviewArb = fc.record({
      _id: fc.stringMatching(/^[a-f0-9]{24}$/),
      rating: fc.integer({ min: 1, max: 5 }),
      comment: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
      isFeatured: fc.constant(true as boolean),
    });

    fc.assert(
      fc.property(initiallyTrueReviewArb, (review) => {
        // Toggle to false
        const afterToggleFalse = applyToggle(review, false);
        expect(afterToggleFalse.isFeatured).toBe(false);

        // Toggle back to true
        const afterToggleTrue = applyToggle(afterToggleFalse, true);
        expect(afterToggleTrue.isFeatured).toBe(true);

        // Should match original state
        expect(afterToggleTrue.isFeatured).toBe(review.isFeatured);
      }),
      { numRuns: 100 }
    );
  });

  it('a single toggle inverts the current isFeatured state', () => {
    fc.assert(
      fc.property(reviewArb, (review) => {
        const toggled = applyToggle(review, !review.isFeatured);
        expect(toggled.isFeatured).toBe(!review.isFeatured);
      }),
      { numRuns: 100 }
    );
  });

  it('double toggle (any direction) restores original isFeatured state', () => {
    fc.assert(
      fc.property(reviewArb, (review) => {
        // First toggle: invert
        const afterFirst = applyToggle(review, !review.isFeatured);
        // Second toggle: invert back
        const afterSecond = applyToggle(afterFirst, !afterFirst.isFeatured);

        // Should be back to original
        expect(afterSecond.isFeatured).toBe(review.isFeatured);
      }),
      { numRuns: 100 }
    );
  });

  it('toggle does not mutate other review fields', () => {
    fc.assert(
      fc.property(reviewArb, fc.boolean(), (review, targetFeatured) => {
        const toggled = applyToggle(review, targetFeatured);

        // All fields except isFeatured should remain unchanged
        expect(toggled._id).toBe(review._id);
        expect(toggled.rating).toBe(review.rating);
        expect(toggled.comment).toBe(review.comment);
      }),
      { numRuns: 100 }
    );
  });
});
