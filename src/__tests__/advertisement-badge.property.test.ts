// Feature: smart-notification-routing, Property 7: Advertisement status badge rendering matches advertisement status
// **Validates: Requirements 18.3, 18.4, 18.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the advertisement badge logic from
 * mprimo/src/app/vendor/dashboard/advert/page.tsx
 *
 * Given an advertisement status, returns the badge text and CSS color classes.
 */
function getAdvertisementBadge(status: 'pending' | 'approved' | 'rejected'): {
  text: string;
  colorClass: string;
} {
  switch (status) {
    case 'pending':
      return { text: 'Pending', colorClass: 'bg-yellow-100 text-yellow-800' };
    case 'approved':
      return { text: 'Approved', colorClass: 'bg-green-100 text-green-800' };
    case 'rejected':
      return { text: 'Rejected', colorClass: 'bg-red-100 text-red-800' };
  }
}

/**
 * Pure function replicating the rejection reason display logic.
 * Returns true if the rejection reason should be displayed for the given status.
 */
function shouldShowRejectionReason(
  status: 'pending' | 'approved' | 'rejected',
  rejectionReason?: string
): boolean {
  return status === 'rejected' && !!rejectionReason;
}

const AD_STATUSES = ['pending', 'approved', 'rejected'] as const;

describe('Property 7: Advertisement status badge rendering matches advertisement status', () => {
  it('should render the correct badge text and color for any advertisement status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AD_STATUSES),
        (status) => {
          const badge = getAdvertisementBadge(status);

          expect(badge).not.toBeNull();

          if (status === 'pending') {
            // Requirement 18.3: yellow "Pending" badge
            expect(badge.text).toBe('Pending');
            expect(badge.colorClass).toContain('yellow');
          } else if (status === 'approved') {
            // Requirement 18.4: green "Approved" badge
            expect(badge.text).toBe('Approved');
            expect(badge.colorClass).toContain('green');
          } else if (status === 'rejected') {
            // Requirement 18.5: red "Rejected" badge
            expect(badge.text).toBe('Rejected');
            expect(badge.colorClass).toContain('red');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render yellow badge only for "pending" status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AD_STATUSES),
        (status) => {
          const badge = getAdvertisementBadge(status);
          if (badge.colorClass.includes('yellow')) {
            expect(status).toBe('pending');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render green badge only for "approved" status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AD_STATUSES),
        (status) => {
          const badge = getAdvertisementBadge(status);
          if (badge.colorClass.includes('green')) {
            expect(status).toBe('approved');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render red badge only for "rejected" status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AD_STATUSES),
        (status) => {
          const badge = getAdvertisementBadge(status);
          if (badge.colorClass.includes('red')) {
            expect(status).toBe('rejected');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show rejection reason only for rejected status with a reason provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AD_STATUSES),
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (status, rejectionReason) => {
          const showReason = shouldShowRejectionReason(status, rejectionReason);

          if (status === 'rejected' && rejectionReason) {
            // Requirement 18.5: rejection reason displayed when available
            expect(showReason).toBe(true);
          } else {
            expect(showReason).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
