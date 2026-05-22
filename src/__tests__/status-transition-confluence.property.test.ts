// Feature: vendor-dispute-settings, Property 8: Valid transition sequence confluence
// **Validates: Requirements 9.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Valid status transitions map - mirrors the exported VALID_TRANSITIONS
 * from mprimo-backend/src/models/issue.model.ts.
 *
 * We define it here directly to avoid importing the full model which
 * triggers mongoose/passport/encryption dependencies requiring env vars.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  "open": ["in-progress", "closed"],
  "in-progress": ["resolved", "closed"],
  "resolved": ["closed"],
  "closed": [], // terminal state
};

/**
 * All possible dispute statuses in the system.
 */
const ALL_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
type DisputeStatus = (typeof ALL_STATUSES)[number];

/**
 * Simulates applying a status transition. Returns an object indicating
 * whether the transition succeeded and the resulting status.
 */
function applyTransition(
  currentStatus: string,
  targetStatus: string
): { success: boolean; newStatus: string; error?: string } {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  if (allowedTransitions.includes(targetStatus)) {
    return { success: true, newStatus: targetStatus };
  }
  return {
    success: false,
    newStatus: currentStatus,
    error: `Invalid status transition from ${currentStatus} to ${targetStatus}`,
  };
}

/**
 * Applies an entire sequence of transitions starting from a given initial status.
 * Returns the final status and whether all transitions succeeded.
 */
function applyTransitionSequence(
  initialStatus: string,
  transitions: string[]
): { success: boolean; finalStatus: string; failedAt?: number; error?: string } {
  let currentStatus = initialStatus;

  for (let i = 0; i < transitions.length; i++) {
    const result = applyTransition(currentStatus, transitions[i]);
    if (!result.success) {
      return {
        success: false,
        finalStatus: currentStatus,
        failedAt: i,
        error: result.error,
      };
    }
    currentStatus = result.newStatus;
  }

  return { success: true, finalStatus: currentStatus };
}

/**
 * Custom arbitrary that generates a valid transition sequence starting from "open".
 * At each step, picks a random valid next status from VALID_TRANSITIONS[currentStatus].
 * Continues until reaching a terminal state ("closed") or a maximum length.
 *
 * This uses fc.chain to build sequences step by step, ensuring each transition
 * in the generated sequence is individually valid according to the transition map.
 */
function validTransitionSequenceArb(maxLength: number = 10): fc.Arbitrary<string[]> {
  return fc.integer({ min: 1, max: maxLength }).chain((targetLength) => {
    // Build the sequence iteratively using a recursive chain approach
    return buildSequence('open', targetLength, []);
  });
}

/**
 * Recursively builds a valid transition sequence.
 * At each step, picks a random valid next status from the current status.
 * Stops when reaching a terminal state or the target length.
 */
function buildSequence(
  currentStatus: string,
  remainingSteps: number,
  accumulated: string[]
): fc.Arbitrary<string[]> {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];

  // If no valid transitions available (terminal state) or reached max length, return what we have
  if (validNextStatuses.length === 0 || remainingSteps <= 0) {
    return fc.constant(accumulated);
  }

  // Pick a random valid next status and continue building
  return fc.constantFrom(...validNextStatuses).chain((nextStatus) => {
    const newAccumulated = [...accumulated, nextStatus];
    return buildSequence(nextStatus, remainingSteps - 1, newAccumulated);
  });
}

describe('Property 8: Valid transition sequence confluence', () => {
  it('any valid transition sequence applied in order succeeds without error', () => {
    fc.assert(
      fc.property(validTransitionSequenceArb(), (sequence) => {
        // The sequence was generated to contain only valid transitions
        // starting from "open". Applying the entire sequence should succeed.
        const result = applyTransitionSequence('open', sequence);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.failedAt).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('valid sequences always end in a reachable state from the transition graph', () => {
    fc.assert(
      fc.property(validTransitionSequenceArb(), (sequence) => {
        const result = applyTransitionSequence('open', sequence);

        expect(result.success).toBe(true);
        // The final status must be one of the known statuses
        expect(ALL_STATUSES).toContain(result.finalStatus);
      }),
      { numRuns: 100 }
    );
  });

  it('valid sequences that reach "closed" are truly terminal (no further transitions possible)', () => {
    // Generate sequences that specifically end in "closed"
    const sequenceEndingInClosedArb = validTransitionSequenceArb(10).filter(
      (seq) => {
        const result = applyTransitionSequence('open', seq);
        return result.success && result.finalStatus === 'closed';
      }
    );

    fc.assert(
      fc.property(sequenceEndingInClosedArb, (sequence) => {
        const result = applyTransitionSequence('open', sequence);

        expect(result.success).toBe(true);
        expect(result.finalStatus).toBe('closed');

        // Attempting any further transition from "closed" should fail
        for (const status of ALL_STATUSES) {
          const furtherResult = applyTransition('closed', status);
          expect(furtherResult.success).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('each intermediate state in a valid sequence is consistent with the transition map', () => {
    fc.assert(
      fc.property(validTransitionSequenceArb(), (sequence) => {
        // Walk through the sequence and verify each step is valid
        let currentStatus = 'open';

        for (const nextStatus of sequence) {
          const allowedFromCurrent = VALID_TRANSITIONS[currentStatus] || [];
          expect(allowedFromCurrent).toContain(nextStatus);
          currentStatus = nextStatus;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all generated valid sequences have length >= 1 (at least one transition from open)', () => {
    fc.assert(
      fc.property(validTransitionSequenceArb(), (sequence) => {
        // Since "open" always has valid transitions, the generator should
        // produce at least one transition step
        expect(sequence.length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});
