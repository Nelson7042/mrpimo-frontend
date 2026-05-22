// Feature: vendor-dispute-settings, Property 10: KYC/KYB type independence
// **Validates: Requirements 10.3**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 10: KYC/KYB type independence
 *
 * For any vendor, a KYC submission SHALL not affect the cooldown state of KYB
 * submissions, and vice versa. Submitting one type SHALL leave the other type's
 * cooldown unchanged.
 *
 * The key insight: Redis keys include the verification type
 * (`kyc_cooldown:{vendorId}:kyc` vs `kyc_cooldown:{vendorId}:kyb`),
 * so they are naturally independent.
 */

// Mock Redis service
const mockTtl = vi.fn();
const mockSet = vi.fn().mockResolvedValue('OK');
vi.mock('../../../mprimo-backend/src/services/redis.service', () => ({
  default: {
    redisClient: {
      ttl: (...args: any[]) => mockTtl(...args),
      set: (...args: any[]) => mockSet(...args),
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

import {
  checkSubmissionCooldown,
  recordSubmission,
} from '../../../mprimo-backend/src/services/kyc-cooldown.service';

const COOLDOWN_TTL_SECONDS = 86400; // 24 hours

/**
 * Arbitrary: MongoDB-like ObjectId strings (24 hex characters).
 */
const vendorIdArb = fc
  .array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 24, maxLength: 24 })
  .map((arr) => arr.join(''));

/**
 * Arbitrary: Remaining TTL for an active cooldown (1 to 86400 seconds).
 */
const activeTtlArb = fc.integer({ min: 1, max: COOLDOWN_TTL_SECONDS });

/**
 * Arbitrary: Cooldown state for a single type.
 * - active: has a remaining TTL (cooldown in effect)
 * - expired: TTL is -2 (key doesn't exist / cooldown expired)
 */
const cooldownStateArb = fc.oneof(
  activeTtlArb.map((ttl) => ({ active: true, ttl })),
  fc.constant({ active: false, ttl: -2 })
);

describe('Property 10: KYC/KYB type independence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('KYC cooldown does not affect KYB submission check', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        cooldownStateArb, // KYC cooldown state
        cooldownStateArb, // KYB cooldown state
        async (vendorId, kycState, kybState) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending statuses (approved)
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Redis TTL responds based on the key being queried
          mockTtl.mockImplementation((key: string) => {
            if (key === `kyc_cooldown:${vendorId}:kyc`) {
              return Promise.resolve(kycState.active ? kycState.ttl : -2);
            }
            if (key === `kyc_cooldown:${vendorId}:kyb`) {
              return Promise.resolve(kybState.active ? kybState.ttl : -2);
            }
            return Promise.resolve(-2);
          });

          // Check KYB cooldown — should only depend on KYB state, not KYC
          const kybResult = await checkSubmissionCooldown(vendorId, 'kyb');

          if (kybState.active) {
            expect(kybResult.allowed).toBe(false);
            expect(kybResult.reason).toBe('cooldown');
            expect(kybResult.remainingSeconds).toBe(kybState.ttl);
          } else {
            expect(kybResult.allowed).toBe(true);
          }

          // Verify the function checked the KYB key specifically
          expect(mockTtl).toHaveBeenCalledWith(`kyc_cooldown:${vendorId}:kyb`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('KYB cooldown does not affect KYC submission check', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        cooldownStateArb, // KYC cooldown state
        cooldownStateArb, // KYB cooldown state
        async (vendorId, kycState, kybState) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending statuses (approved)
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Redis TTL responds based on the key being queried
          mockTtl.mockImplementation((key: string) => {
            if (key === `kyc_cooldown:${vendorId}:kyc`) {
              return Promise.resolve(kycState.active ? kycState.ttl : -2);
            }
            if (key === `kyc_cooldown:${vendorId}:kyb`) {
              return Promise.resolve(kybState.active ? kybState.ttl : -2);
            }
            return Promise.resolve(-2);
          });

          // Check KYC cooldown — should only depend on KYC state, not KYB
          const kycResult = await checkSubmissionCooldown(vendorId, 'kyc');

          if (kycState.active) {
            expect(kycResult.allowed).toBe(false);
            expect(kycResult.reason).toBe('cooldown');
            expect(kycResult.remainingSeconds).toBe(kycState.ttl);
          } else {
            expect(kycResult.allowed).toBe(true);
          }

          // Verify the function checked the KYC key specifically
          expect(mockTtl).toHaveBeenCalledWith(`kyc_cooldown:${vendorId}:kyc`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('KYC submission in cooldown does not block KYB and vice versa', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        activeTtlArb, // Active cooldown TTL for one type
        async (vendorId, activeTtl) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending statuses
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Scenario: KYC has active cooldown, KYB does NOT
          mockTtl.mockImplementation((key: string) => {
            if (key === `kyc_cooldown:${vendorId}:kyc`) {
              return Promise.resolve(activeTtl); // KYC blocked
            }
            if (key === `kyc_cooldown:${vendorId}:kyb`) {
              return Promise.resolve(-2); // KYB not blocked
            }
            return Promise.resolve(-2);
          });

          const kycResult = await checkSubmissionCooldown(vendorId, 'kyc');
          const kybResult = await checkSubmissionCooldown(vendorId, 'kyb');

          // KYC should be blocked
          expect(kycResult.allowed).toBe(false);
          expect(kycResult.reason).toBe('cooldown');

          // KYB should be allowed (independent of KYC)
          expect(kybResult.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('KYB submission in cooldown does not block KYC and vice versa', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        activeTtlArb, // Active cooldown TTL for KYB
        async (vendorId, activeTtl) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending statuses
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Scenario: KYB has active cooldown, KYC does NOT
          mockTtl.mockImplementation((key: string) => {
            if (key === `kyc_cooldown:${vendorId}:kyc`) {
              return Promise.resolve(-2); // KYC not blocked
            }
            if (key === `kyc_cooldown:${vendorId}:kyb`) {
              return Promise.resolve(activeTtl); // KYB blocked
            }
            return Promise.resolve(-2);
          });

          const kybResult = await checkSubmissionCooldown(vendorId, 'kyb');
          const kycResult = await checkSubmissionCooldown(vendorId, 'kyc');

          // KYB should be blocked
          expect(kybResult.allowed).toBe(false);
          expect(kybResult.reason).toBe('cooldown');

          // KYC should be allowed (independent of KYB)
          expect(kycResult.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('recording a submission for one type uses the correct type-specific key', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        fc.constantFrom('kyc', 'kyb') as fc.Arbitrary<'kyc' | 'kyb'>,
        async (vendorId, verificationType) => {
          mockSet.mockReset();

          await recordSubmission(vendorId, verificationType);

          // Verify the correct type-specific key was used
          const expectedKey = `kyc_cooldown:${vendorId}:${verificationType}`;
          expect(mockSet).toHaveBeenCalledWith(
            expectedKey,
            expect.any(String),
            { ex: COOLDOWN_TTL_SECONDS }
          );

          // Verify the OTHER type's key was NOT touched
          const otherType = verificationType === 'kyc' ? 'kyb' : 'kyc';
          const otherKey = `kyc_cooldown:${vendorId}:${otherType}`;
          expect(mockSet).not.toHaveBeenCalledWith(
            otherKey,
            expect.any(String),
            expect.anything()
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
