// Feature: vendor-dispute-settings, Property 6: Vendor authorization ownership check
// **Validates: Requirements 8.1, 8.2**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * We test the verifyVendorOwnership middleware by mocking the Vendor model
 * and verifying the ownership check logic:
 * - Access granted (next() called) iff req.userId matches vendor.userId
 * - 403 returned when userId does not match vendor.userId
 * - 404 returned when no vendor exists for the given userId
 */

// Mock the Vendor model
const mockFindOne = vi.fn();
vi.mock('../../../mprimo-backend/src/models/vendor.model', () => ({
  default: {
    findOne: (...args: any[]) => mockFindOne(...args),
  },
}));

// Mock the LoggerService
vi.mock('../../../mprimo-backend/src/services/logger.service', () => ({
  LoggerService: {
    getInstance: () => ({
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

import { verifyVendorOwnership } from '../../../mprimo-backend/src/middlewares/vendor-auth.middleware';

/**
 * Helper to create a mock Express request with a userId.
 */
function createMockReq(userId: string) {
  return {
    userId,
    path: '/test-path',
  } as any;
}

/**
 * Helper to create a mock Express response with json and status methods.
 */
function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Arbitrary that generates MongoDB-like ObjectId strings (24 hex characters).
 */
const objectIdArb = fc
  .array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 24, maxLength: 24 })
  .map((arr) => arr.join(''));

/**
 * Arbitrary that generates a pair of distinct ObjectId strings (guaranteed non-matching).
 */
const distinctObjectIdPairArb = fc
  .tuple(objectIdArb, objectIdArb)
  .filter(([a, b]) => a !== b);

describe('Property 6: Vendor authorization ownership check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('access is granted (next() called) when userId matches vendor.userId', async () => {
    await fc.assert(
      fc.asyncProperty(objectIdArb, async (userId) => {
        mockFindOne.mockReset();
        // Mock: vendor exists and userId matches
        mockFindOne.mockResolvedValue({ userId: userId });

        const req = createMockReq(userId);
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('403 is returned when userId does not match vendor.userId', async () => {
    await fc.assert(
      fc.asyncProperty(distinctObjectIdPairArb, async ([requestUserId, vendorUserId]) => {
        mockFindOne.mockReset();
        // Mock: vendor exists but userId does NOT match
        mockFindOne.mockResolvedValue({ userId: vendorUserId });

        const req = createMockReq(requestUserId);
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      }),
      { numRuns: 100 }
    );
  });

  it('404 is returned when no vendor exists for the given userId', async () => {
    await fc.assert(
      fc.asyncProperty(objectIdArb, async (userId) => {
        mockFindOne.mockReset();
        // Mock: no vendor found
        mockFindOne.mockResolvedValue(null);

        const req = createMockReq(userId);
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      }),
      { numRuns: 100 }
    );
  });

  it('access granted iff userId matches vendor.userId (biconditional)', async () => {
    // Generate scenarios where userId may or may not match
    const scenarioArb = fc.tuple(objectIdArb, objectIdArb, fc.boolean()).map(
      ([id1, id2, shouldMatch]) => ({
        requestUserId: id1,
        vendorUserId: shouldMatch ? id1 : id2,
      })
    );

    await fc.assert(
      fc.asyncProperty(scenarioArb, async ({ requestUserId, vendorUserId }) => {
        mockFindOne.mockReset();
        // Mock: vendor exists with the given vendorUserId
        mockFindOne.mockResolvedValue({ userId: vendorUserId });

        const req = createMockReq(requestUserId);
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        const accessGranted = next.mock.calls.length > 0;
        const idsMatch = requestUserId === vendorUserId;

        // Access is granted if and only if the IDs match
        expect(accessGranted).toBe(idsMatch);

        if (!idsMatch) {
          expect(res.status).toHaveBeenCalledWith(403);
        }
      }),
      { numRuns: 100 }
    );
  });
});
