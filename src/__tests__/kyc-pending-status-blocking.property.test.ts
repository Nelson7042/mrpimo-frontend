// Feature: vendor-dispute-settings, Property 11: Pending status blocks new submissions
// **Validates: Requirements 10.4**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 11: Pending status blocks new submissions
 *
 * For any vendor with a KYC or KYB submission in "pending" or "requires_review"
 * status, new submissions of that same verification type SHALL be rejected
 * regardless of how much time has elapsed since the last submission.
 */

// Mock Redis service
const mockTtl = vi.fn();
vi.mock('../../../mprimo-backend/src/services/redis.service', () => ({
  default: {
    redisClient: {
      ttl: (...args: any[]) => mockTtl(...args),
      set: vi.fn().mockResolvedValue('OK'),
    },
  },
}));

// Mock Vendor model
const mockFindById = vi.fn();
vi.mock('../../../mprimo-backend/src/models/vendor.model', () => ({
  default: {
    findById: (...args: any[]) => mockFindById(...args),
  },
}));

// Mock LoggerService
vi.mock('../../../mprimo-backend/src/services/logger.service', () => ({
  LoggerService: {
    getInstance: () => ({
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

import { checkSubmissionCooldown } from '../../../mprimo-backend/src/services/kyc-cooldown.service';

/**
 * Arbitrary: MongoDB-like ObjectId strings (24 hex characters).
 */
const vendorIdArb = fc
  .array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 24, maxLength: 24 })
  .map((arr) => arr.join(''));

/**
 * Arbitrary: Verification type (kyc or kyb).
 */
const verificationTypeArb = fc.constantFrom('kyc', 'kyb') as fc.Arbitrary<'kyc' | 'kyb'>;

/**
 * Arbitrary: Pending/blocking statuses that should prevent new submissions.
 */
const blockingStatusArb = fc.constantFrom('pending', 'requires_review');

/**
 * Arbitrary: Elapsed time in seconds (0 to 172800 = 48 hours).
 * Covers both within-cooldown and well-past-cooldown scenarios to prove
 * that pending status blocks regardless of elapsed time.
 */
const elapsedTimeArb = fc.integer({ min: 0, max: 172800 });

describe('Property 11: Pending status blocks new submissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects submission with reason "pending_submission" when vendor has pending status for that type', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        verificationTypeArb,
        blockingStatusArb,
        elapsedTimeArb,
        async (vendorId, verificationType, blockingStatus, elapsedSeconds) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with a blocking status for the requested verification type
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: verificationType === 'kyc' ? blockingStatus : 'approved',
            kybStatus: verificationType === 'kyb' ? blockingStatus : 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Redis cooldown state varies — should not matter when status is blocking
          if (elapsedSeconds < 86400) {
            mockTtl.mockResolvedValue(86400 - elapsedSeconds);
          } else {
            mockTtl.mockResolvedValue(-2);
          }

          const result = await checkSubmissionCooldown(vendorId, verificationType);

          // Must always be rejected with pending_submission reason
          expect(result.allowed).toBe(false);
          expect(result.reason).toBe('pending_submission');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('blocks regardless of whether Redis cooldown is active or expired', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        verificationTypeArb,
        blockingStatusArb,
        fc.boolean(), // true = cooldown active, false = cooldown expired
        async (vendorId, verificationType, blockingStatus, cooldownActive) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor has blocking status for the requested type
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: verificationType === 'kyc' ? blockingStatus : 'approved',
            kybStatus: verificationType === 'kyb' ? blockingStatus : 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Explicitly set Redis to either active cooldown or expired
          if (cooldownActive) {
            mockTtl.mockResolvedValue(43200); // 12 hours remaining
          } else {
            mockTtl.mockResolvedValue(-2); // No cooldown key
          }

          const result = await checkSubmissionCooldown(vendorId, verificationType);

          // Pending status takes priority — always blocked
          expect(result.allowed).toBe(false);
          expect(result.reason).toBe('pending_submission');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pending status for one type does not block the other type', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        blockingStatusArb,
        async (vendorId, blockingStatus) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor has pending KYC but approved KYB
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: blockingStatus,
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // No Redis cooldown active for KYB
          mockTtl.mockResolvedValue(-2);

          // KYC should be blocked
          const kycResult = await checkSubmissionCooldown(vendorId, 'kyc');
          expect(kycResult.allowed).toBe(false);
          expect(kycResult.reason).toBe('pending_submission');

          // KYB should be allowed (no pending status, no cooldown)
          const kybResult = await checkSubmissionCooldown(vendorId, 'kyb');
          expect(kybResult.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('requires_review status blocks just like pending status', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        verificationTypeArb,
        elapsedTimeArb,
        async (vendorId, verificationType, elapsedSeconds) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor has "requires_review" status for the requested type
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: verificationType === 'kyc' ? 'requires_review' : 'approved',
            kybStatus: verificationType === 'kyb' ? 'requires_review' : 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Redis state should not matter
          if (elapsedSeconds < 86400) {
            mockTtl.mockResolvedValue(86400 - elapsedSeconds);
          } else {
            mockTtl.mockResolvedValue(-2);
          }

          const result = await checkSubmissionCooldown(vendorId, verificationType);

          expect(result.allowed).toBe(false);
          expect(result.reason).toBe('pending_submission');
        }
      ),
      { numRuns: 100 }
    );
  });
});
