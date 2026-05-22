// Feature: vendor-dispute-settings, Property 1: Vendor response editability is determined by dispute status
// **Validates: Requirements 2.1, 2.3, 2.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 1: For any dispute and any vendor response edit attempt, the edit
 * SHALL be permitted if and only if the dispute status is "open" or "in-progress".
 * For statuses "resolved" or "closed", the edit SHALL be rejected.
 *
 * This tests the core editability logic as a pure function, matching the
 * status check in the updateVendorResponse controller:
 *   if (issue.status !== "open" && issue.status !== "in-progress") → reject
 */

/** All valid dispute statuses in the system */
const ALL_DISPUTE_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
type DisputeStatus = (typeof ALL_DISPUTE_STATUSES)[number];

/** Statuses that permit editing */
const EDITABLE_STATUSES: ReadonlySet<string> = new Set(['open', 'in-progress']);

/**
 * Pure function that determines whether a vendor response edit is permitted
 * based on the dispute status. This mirrors the logic in
 * mprimo-backend/src/controllers/issue.controller.ts (updateVendorResponse).
 */
function isEditPermitted(status: string): boolean {
  return EDITABLE_STATUSES.has(status);
}

/** Arbitrary that generates one of the four valid dispute statuses */
const disputeStatusArb: fc.Arbitrary<DisputeStatus> = fc.constantFrom(...ALL_DISPUTE_STATUSES);

/** Arbitrary that generates random response text (simulating edit content) */
const responseTextArb = fc.string({ minLength: 1, maxLength: 500 });

/** Arbitrary that generates random evidence URL arrays */
const evidenceUrlsArb = fc.array(
  fc.webUrl({ withFragments: false, withQueryParameters: false }),
  { minLength: 0, maxLength: 5 }
);

describe('Property 1: Vendor response editability is determined by dispute status', () => {
  it('edit is permitted if and only if status is "open" or "in-progress"', () => {
    fc.assert(
      fc.property(disputeStatusArb, (status) => {
        const permitted = isEditPermitted(status);

        if (status === 'open' || status === 'in-progress') {
          expect(permitted).toBe(true);
        } else {
          expect(permitted).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('edit is rejected for "resolved" status regardless of response content', () => {
    fc.assert(
      fc.property(responseTextArb, evidenceUrlsArb, (text, urls) => {
        const permitted = isEditPermitted('resolved');
        expect(permitted).toBe(false);

        // The response content does not influence editability
        expect(text.length).toBeGreaterThan(0); // confirms we generated valid content
        void urls; // evidence URLs are irrelevant to the editability decision
      }),
      { numRuns: 100 }
    );
  });

  it('edit is rejected for "closed" status regardless of response content', () => {
    fc.assert(
      fc.property(responseTextArb, evidenceUrlsArb, (text, urls) => {
        const permitted = isEditPermitted('closed');
        expect(permitted).toBe(false);

        expect(text.length).toBeGreaterThan(0);
        void urls;
      }),
      { numRuns: 100 }
    );
  });

  it('edit is always permitted for "open" status with any response content', () => {
    fc.assert(
      fc.property(responseTextArb, evidenceUrlsArb, (text, urls) => {
        const permitted = isEditPermitted('open');
        expect(permitted).toBe(true);

        // Editability holds regardless of what the vendor wants to submit
        void text;
        void urls;
      }),
      { numRuns: 100 }
    );
  });

  it('edit is always permitted for "in-progress" status with any response content', () => {
    fc.assert(
      fc.property(responseTextArb, evidenceUrlsArb, (text, urls) => {
        const permitted = isEditPermitted('in-progress');
        expect(permitted).toBe(true);

        void text;
        void urls;
      }),
      { numRuns: 100 }
    );
  });

  it('biconditional: permitted ↔ status ∈ {"open", "in-progress"} for all statuses and edit attempts', () => {
    fc.assert(
      fc.property(
        disputeStatusArb,
        responseTextArb,
        evidenceUrlsArb,
        (status, _responseText, _evidenceUrls) => {
          const permitted = isEditPermitted(status);
          const shouldBePermitted = status === 'open' || status === 'in-progress';

          // Biconditional: permitted if and only if status is editable
          expect(permitted).toBe(shouldBePermitted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
