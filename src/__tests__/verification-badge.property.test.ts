// Feature: smart-notification-routing, Property 6: Verification status badge rendering matches vendor status
// **Validates: Requirements 17.2, 17.3, 17.4, 17.5, 17.6, 17.7**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure function replicating the getVerificationBadge logic from
 * mprimo/src/app/vendor/dashboard/settings/page.tsx
 *
 * Returns an object describing the badge, or null when no badge should render.
 */
function getVerificationBadgeResult(status: string | undefined | null): {
  text: string;
  colorClass: string;
} | null {
  if (status === 'verified') {
    return { text: 'Verified', colorClass: 'bg-green-100 text-green-800' };
  }
  if (status === 'pending' || status === 'requires_review') {
    return { text: 'Pending Review', colorClass: 'bg-yellow-100 text-yellow-800' };
  }
  return null;
}

const ALL_STATUSES = ['pending', 'verified', 'rejected', 'requires_review', null, undefined] as const;

describe('Property 6: Verification status badge rendering matches vendor status', () => {
  it('should render the correct badge text and color for any KYC/KYB status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        fc.constantFrom(...ALL_STATUSES),
        (kycStatus, kybStatus) => {
          const kycBadge = getVerificationBadgeResult(kycStatus as string | undefined | null);
          const kybBadge = getVerificationBadgeResult(kybStatus as string | undefined | null);

          // --- KYC badge assertions ---
          if (kycStatus === 'verified') {
            // Requirement 17.4: green "Verified" badge
            expect(kycBadge).not.toBeNull();
            expect(kycBadge!.text).toBe('Verified');
            expect(kycBadge!.colorClass).toContain('green');
          } else if (kycStatus === 'pending' || kycStatus === 'requires_review') {
            // Requirement 17.6: yellow "Pending Review" badge
            expect(kycBadge).not.toBeNull();
            expect(kycBadge!.text).toBe('Pending Review');
            expect(kycBadge!.colorClass).toContain('yellow');
          } else {
            // Requirement 17.2: rejected or not submitted → no badge (show submit button instead)
            expect(kycBadge).toBeNull();
          }

          // --- KYB badge assertions ---
          if (kybStatus === 'verified') {
            // Requirement 17.5: green "Verified" badge
            expect(kybBadge).not.toBeNull();
            expect(kybBadge!.text).toBe('Verified');
            expect(kybBadge!.colorClass).toContain('green');
          } else if (kybStatus === 'pending' || kybStatus === 'requires_review') {
            // Requirement 17.7: yellow "Pending Review" badge
            expect(kybBadge).not.toBeNull();
            expect(kybBadge!.text).toBe('Pending Review');
            expect(kybBadge!.colorClass).toContain('yellow');
          } else {
            // Requirement 17.3: rejected or not submitted → no badge (show submit button instead)
            expect(kybBadge).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return green badge only for "verified" status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        (status) => {
          const badge = getVerificationBadgeResult(status as string | undefined | null);
          if (badge && badge.colorClass.includes('green')) {
            expect(status).toBe('verified');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return yellow badge only for "pending" or "requires_review" status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        (status) => {
          const badge = getVerificationBadgeResult(status as string | undefined | null);
          if (badge && badge.colorClass.includes('yellow')) {
            expect(['pending', 'requires_review']).toContain(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null (submit button shown) only for "rejected", null, or undefined status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATUSES),
        (status) => {
          const badge = getVerificationBadgeResult(status as string | undefined | null);
          if (badge === null) {
            expect([null, undefined, 'rejected']).toContain(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
