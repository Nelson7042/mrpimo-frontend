// Feature: vendor-dispute-settings, Property 9: KYC/KYB cooldown enforcement
// **Validates: Requirements 10.2**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 9: KYC/KYB cooldown enforcement
 *
 * For any vendor and verification type, a submission attempt SHALL be rejected
 * with reason "cooldown" if the time elapsed since the last submission of that
 * same type is less than 24 hours (86400 seconds). Submissions at or after
 * 24 hours SHALL be allowed (assuming no pending status).
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

const COOLDOWN_TTL_SECONDS = 86400; // 24 hours

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
 * Arbitrary: Elapsed time in seconds (0 to 172800 = 48 hours).
 * This covers both within-cooldown and past-cooldown scenarios.
 */
const elapsedTimeArb = fc.integer({ min: 0, max: 172800 });

describe('Property 9: KYC/KYB cooldown enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects submission with reason "cooldown" when elapsed time < 24 hours', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        verificationTypeArb,
        fc.integer({ min: 0, max: COOLDOWN_TTL_SECONDS - 1 }),
        async (vendorId, verificationType, elapsedSeconds) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending status (approved)
          const statusField = verificationType === 'kyc' ? 'kycStatus' : 'kybStatus';
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Redis TTL returns remaining cooldown time (86400 - elapsed)
          const remainingTtl = COOLDOWN_TTL_SECONDS - elapsedSeconds;
          mockTtl.mockResolvedValue(remainingTtl);

          const result = await checkSubmissionCooldown(vendorId, verificationType);

          expect(result.allowed).toBe(false);
          expect(result.reason).toBe('cooldown');
          expect(result.remainingSeconds).toBe(remainingTtl);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('allows submission when elapsed time >= 24 hours (no cooldown active)', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        verificationTypeArb,
        fc.integer({ min: COOLDOWN_TTL_SECONDS, max: 172800 }),
        async (vendorId, verificationType, elapsedSeconds) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending status (approved)
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Redis TTL returns -2 (key does not exist) when cooldown has expired
          mockTtl.mockResolvedValue(-2);

          const result = await checkSubmissionCooldown(vendorId, verificationType);

          expect(result.allowed).toBe(true);
          expect(result.reason).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cooldown enforcement applies consistently across all vendor IDs and verification types', async () => {
    await fc.assert(
      fc.asyncProperty(
        vendorIdArb,
        verificationTypeArb,
        elapsedTimeArb,
        async (vendorId, verificationType, elapsedSeconds) => {
          mockFindById.mockReset();
          mockTtl.mockReset();

          // Vendor exists with non-pending status
          const vendorDoc: any = {
            _id: vendorId,
            userId: 'user123',
            kycStatus: 'approved',
            kybStatus: 'approved',
          };
          mockFindById.mockReturnValue({ lean: () => Promise.resolve(vendorDoc) });

          // Simulate Redis TTL based on elapsed time
          if (elapsedSeconds < COOLDOWN_TTL_SECONDS) {
            // Key still exists with remaining TTL
            const remainingTtl = COOLDOWN_TTL_SECONDS - elapsedSeconds;
            mockTtl.mockResolvedValue(remainingTtl);
          } else {
            // Key expired or doesn't exist
            mockTtl.mockResolvedValue(-2);
          }

          const result = await checkSubmissionCooldown(vendorId, verificationType);

          if (elapsedSeconds < COOLDOWN_TTL_SECONDS) {
            // Should be rejected with cooldown reason
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.remainingSeconds).toBeGreaterThan(0);
          } else {
            // Should be allowed
            expect(result.allowed).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
