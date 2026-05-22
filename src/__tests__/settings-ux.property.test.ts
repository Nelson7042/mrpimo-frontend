// Feature: disputes-settings-improvements, Property 12: Form dirty state detection
// **Validates: Requirements 10.2**
// Feature: disputes-settings-improvements, Property 13: Exponential backoff timing
// **Validates: Requirements 11.3**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isDirty } from '../hooks/useUnsavedChanges';
import { calculateBackoffDelay } from '../hooks/useRetryQuery';

// --- Arbitraries for Property 12 ---

/**
 * Generates a settings form value object with string fields.
 */
const formValuesArb = fc.record({
  firstName: fc.string({ minLength: 0, maxLength: 50 }),
  lastName: fc.string({ minLength: 0, maxLength: 50 }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 0, maxLength: 20 }),
  bio: fc.string({ minLength: 0, maxLength: 200 }),
});

/**
 * Generates a pair of form values where at least one field differs.
 */
const differentFormValuesArb = fc
  .tuple(formValuesArb, formValuesArb)
  .filter(([a, b]) => {
    return (
      a.firstName !== b.firstName ||
      a.lastName !== b.lastName ||
      a.email !== b.email ||
      a.phone !== b.phone ||
      a.bio !== b.bio
    );
  });

/**
 * Generates a form values object with mixed types (strings, numbers, booleans).
 */
const mixedFormValuesArb = fc.record({
  name: fc.string({ minLength: 0, maxLength: 30 }),
  age: fc.integer({ min: 0, max: 150 }),
  active: fc.boolean(),
  preference: fc.constantFrom('real-time', 'daily_digest', 'weekly'),
});

describe('Property 12: Form dirty state detection', () => {
  it('dirty state SHALL be false when current values equal saved values', () => {
    fc.assert(
      fc.property(formValuesArb, (values) => {
        // When current values are identical to saved values, isDirty should be false
        const result = isDirty(values, { ...values });
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('dirty state SHALL be true when at least one field value differs', () => {
    fc.assert(
      fc.property(differentFormValuesArb, ([currentValues, savedValues]) => {
        // When at least one field differs, isDirty should be true
        const result = isDirty(currentValues, savedValues);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('dirty state is true if and only if at least one current field value differs from its corresponding saved value', () => {
    fc.assert(
      fc.property(
        formValuesArb,
        formValuesArb,
        (currentValues, savedValues) => {
          const result = isDirty(currentValues, savedValues);

          // Manually check if any field differs
          const hasAnyDifference =
            currentValues.firstName !== savedValues.firstName ||
            currentValues.lastName !== savedValues.lastName ||
            currentValues.email !== savedValues.email ||
            currentValues.phone !== savedValues.phone ||
            currentValues.bio !== savedValues.bio;

          expect(result).toBe(hasAnyDifference);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('dirty state works correctly with mixed value types (strings, numbers, booleans)', () => {
    fc.assert(
      fc.property(
        mixedFormValuesArb,
        mixedFormValuesArb,
        (currentValues, savedValues) => {
          const result = isDirty(currentValues, savedValues);

          const hasAnyDifference =
            currentValues.name !== savedValues.name ||
            currentValues.age !== savedValues.age ||
            currentValues.active !== savedValues.active ||
            currentValues.preference !== savedValues.preference;

          expect(result).toBe(hasAnyDifference);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('dirty state SHALL be false for an empty form (no fields)', () => {
    fc.assert(
      fc.property(fc.constant({}), (values) => {
        const result = isDirty(values, { ...values });
        expect(result).toBe(false);
      }),
      { numRuns: 10 }
    );
  });

  it('modifying a single field makes the form dirty', () => {
    fc.assert(
      fc.property(
        formValuesArb,
        fc.constantFrom('firstName', 'lastName', 'email', 'phone', 'bio') as fc.Arbitrary<keyof ReturnType<typeof formValuesArb['generate']>['value']>,
        fc.string({ minLength: 1, maxLength: 50 }),
        (savedValues, fieldToChange, newValue) => {
          // Only test when the new value is actually different
          if ((savedValues as Record<string, unknown>)[fieldToChange] === newValue) return;

          const currentValues = { ...savedValues, [fieldToChange]: newValue };
          const result = isDirty(currentValues, savedValues);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 13: Exponential backoff timing', () => {
  it('retry delay SHALL equal 2^(n-1) seconds for attempt n (1-indexed, max 3)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (attemptNumber) => {
          // attemptNumber is 1-indexed, but calculateBackoffDelay takes 0-indexed
          const attemptIndex = attemptNumber - 1;
          const delay = calculateBackoffDelay(attemptIndex);

          // Expected: 2^(n-1) seconds in milliseconds
          const expectedDelay = Math.pow(2, attemptNumber - 1) * 1000;

          expect(delay).toBe(expectedDelay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('attempt 1 delay SHALL be 1 second (1000ms)', () => {
    fc.assert(
      fc.property(fc.constant(0), (attemptIndex) => {
        const delay = calculateBackoffDelay(attemptIndex);
        expect(delay).toBe(1000);
      }),
      { numRuns: 10 }
    );
  });

  it('attempt 2 delay SHALL be 2 seconds (2000ms)', () => {
    fc.assert(
      fc.property(fc.constant(1), (attemptIndex) => {
        const delay = calculateBackoffDelay(attemptIndex);
        expect(delay).toBe(2000);
      }),
      { numRuns: 10 }
    );
  });

  it('attempt 3 delay SHALL be 4 seconds (4000ms)', () => {
    fc.assert(
      fc.property(fc.constant(2), (attemptIndex) => {
        const delay = calculateBackoffDelay(attemptIndex);
        expect(delay).toBe(4000);
      }),
      { numRuns: 10 }
    );
  });

  it('delays SHALL increase monotonically with each retry attempt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        (attemptIndex) => {
          const currentDelay = calculateBackoffDelay(attemptIndex);
          const nextDelay = calculateBackoffDelay(attemptIndex + 1);

          expect(nextDelay).toBeGreaterThan(currentDelay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each subsequent delay SHALL be exactly double the previous delay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        (attemptIndex) => {
          const currentDelay = calculateBackoffDelay(attemptIndex);
          const nextDelay = calculateBackoffDelay(attemptIndex + 1);

          expect(nextDelay).toBe(currentDelay * 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all 3 retry delays follow the pattern [1s, 2s, 4s]', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const delays = [0, 1, 2].map((i) => calculateBackoffDelay(i));
        expect(delays).toEqual([1000, 2000, 4000]);
      }),
      { numRuns: 10 }
    );
  });
});
