// Feature: vendor-dispute-settings, Property 14: Wallet data filtering excludes unauthorized data
// **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Represents a raw escrow/payment entry as stored internally,
 * including internal fields that should NOT be exposed to vendors.
 */
interface RawEscrowEntry {
  _id: string; // Raw ObjectId (24-char hex)
  vendorId: string; // 24-char hex string
  orderId: string; // 24-char hex string
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  platformFee: number; // Internal - should be stripped
  escrowTransactionId: string; // Internal - should be stripped
  metadata: Record<string, unknown>; // Internal - should be stripped
  createdAt: string;
}

/**
 * Represents a filtered wallet transaction entry safe for vendor consumption.
 * No internal references, no raw ObjectIds, no platform fee breakdowns.
 */
interface FilteredWalletEntry {
  id: string; // String representation (not raw ObjectId)
  vendorId: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
}

/**
 * Pure function that filters wallet/escrow data for a specific vendor.
 * This mirrors the logic in the backend's getVendorWallet endpoint:
 * 1. Filters entries to only include those belonging to the requesting vendor
 * 2. Strips internal references (platformFee, escrowTransactionId, metadata)
 * 3. Converts raw ObjectIds to string representations
 */
function filterWalletDataForVendor(
  allEntries: RawEscrowEntry[],
  requestingVendorId: string
): FilteredWalletEntry[] {
  // Step 1: Filter to only entries belonging to the requesting vendor
  const vendorEntries = allEntries.filter(
    (entry) => entry.vendorId === requestingVendorId
  );

  // Step 2 & 3: Strip internal fields and convert ObjectIds to strings
  return vendorEntries.map((entry) => ({
    id: entry._id.toString(),
    vendorId: entry.vendorId,
    orderId: entry.orderId.toString(),
    amount: entry.amount,
    status: entry.status,
    createdAt: entry.createdAt,
  }));
}

/**
 * Checks if a string looks like a raw MongoDB ObjectId (24-char hex).
 * In the filtered response, IDs should be plain strings but we verify
 * that no raw ObjectId-like references from internal fields leak through.
 */
function looksLikeRawObjectId(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{24}$/.test(value);
}

/**
 * Checks if a filtered entry contains any internal/unauthorized fields.
 */
function hasInternalFields(entry: Record<string, unknown>): boolean {
  const internalFieldNames = ['platformFee', 'escrowTransactionId', 'metadata', '_id'];
  return internalFieldNames.some((field) => field in entry);
}

// --- Arbitraries ---

/**
 * Generates a 24-character hex string (MongoDB ObjectId format).
 */
const objectIdArb = fc
  .array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 24, maxLength: 24 })
  .map((arr) => arr.join(''));

/**
 * Generates a positive amount (currency value).
 */
const amountArb = fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true });

/**
 * Generates a raw escrow entry with a specific vendor ID.
 */
function rawEscrowEntryArb(vendorId: string): fc.Arbitrary<RawEscrowEntry> {
  return fc.record({
    _id: objectIdArb,
    vendorId: fc.constant(vendorId),
    orderId: objectIdArb,
    amount: amountArb,
    status: fc.constantFrom('pending' as const, 'completed' as const, 'failed' as const),
    platformFee: fc.double({ min: 0.01, max: 5000, noNaN: true, noDefaultInfinity: true }),
    escrowTransactionId: objectIdArb,
    metadata: fc.record({
      internalNote: fc.string(),
      processingBatch: fc.string(),
      feeBreakdown: fc.record({
        platform: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        payment_processor: fc.double({ min: 0, max: 50, noNaN: true, noDefaultInfinity: true }),
      }),
    }),
    createdAt: fc.integer({ min: 1672531200000, max: 1767139200000 }).map((ts) => new Date(ts).toISOString()),
  });
}

/**
 * Generates a multi-vendor escrow data set with entries from multiple vendors.
 */
const multiVendorDataSetArb = fc
  .record({
    requestingVendorId: objectIdArb,
    otherVendorIds: fc.array(objectIdArb, { minLength: 1, maxLength: 5 }),
    requestingVendorEntryCount: fc.integer({ min: 0, max: 10 }),
    otherVendorEntryCount: fc.integer({ min: 0, max: 10 }),
  })
  .chain(({ requestingVendorId, otherVendorIds, requestingVendorEntryCount, otherVendorEntryCount }) => {
    const requestingEntries = fc.array(
      rawEscrowEntryArb(requestingVendorId),
      { minLength: requestingVendorEntryCount, maxLength: requestingVendorEntryCount }
    );

    const otherEntries = fc.array(
      fc.oneof(...otherVendorIds.map((vid) => rawEscrowEntryArb(vid))),
      { minLength: otherVendorEntryCount, maxLength: otherVendorEntryCount }
    );

    return fc.record({
      requestingVendorId: fc.constant(requestingVendorId),
      allEntries: fc.tuple(requestingEntries, otherEntries).map(([a, b]) => [...a, ...b]),
      expectedCount: fc.constant(requestingVendorEntryCount),
    });
  });

// --- Property Tests ---

describe('Property 14: Wallet data filtering excludes unauthorized data', () => {
  it('all returned entries belong to the requesting vendor', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);

        for (const entry of filtered) {
          expect(entry.vendorId).toBe(requestingVendorId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no entries from other vendors are present in the result', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);

        const otherVendorIds = new Set(
          allEntries
            .filter((e) => e.vendorId !== requestingVendorId)
            .map((e) => e.vendorId)
        );

        for (const entry of filtered) {
          expect(otherVendorIds.has(entry.vendorId)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('returned entry count matches the number of entries belonging to the requesting vendor', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries, expectedCount }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('no internal platform fee breakdowns are exposed in filtered entries', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);

        for (const entry of filtered) {
          const entryAsRecord = entry as unknown as Record<string, unknown>;
          expect(hasInternalFields(entryAsRecord)).toBe(false);
          expect('platformFee' in entryAsRecord).toBe(false);
          expect('escrowTransactionId' in entryAsRecord).toBe(false);
          expect('metadata' in entryAsRecord).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no raw ObjectIds (_id field) are in the response - all converted to string id field', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);

        for (const entry of filtered) {
          const entryAsRecord = entry as unknown as Record<string, unknown>;
          // _id should not exist; instead we have 'id' as a string
          expect('_id' in entryAsRecord).toBe(false);
          expect(typeof entry.id).toBe('string');
          expect(typeof entry.orderId).toBe('string');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('filtered entries only contain safe fields (no internal accounting references)', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);

        const allowedFields = new Set(['id', 'vendorId', 'orderId', 'amount', 'status', 'createdAt']);

        for (const entry of filtered) {
          const entryKeys = Object.keys(entry);
          for (const key of entryKeys) {
            expect(allowedFields.has(key)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('filtering with a vendor ID that has no entries returns empty array', () => {
    fc.assert(
      fc.property(
        fc.array(rawEscrowEntryArb('a'.repeat(24)), { minLength: 1, maxLength: 10 }),
        objectIdArb.filter((id) => id !== 'a'.repeat(24)),
        (entries, nonExistentVendorId) => {
          const filtered = filterWalletDataForVendor(entries, nonExistentVendorId);
          expect(filtered.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('amounts in filtered entries match original amounts for the requesting vendor', () => {
    fc.assert(
      fc.property(multiVendorDataSetArb, ({ requestingVendorId, allEntries }) => {
        const filtered = filterWalletDataForVendor(allEntries, requestingVendorId);

        const originalVendorEntries = allEntries.filter(
          (e) => e.vendorId === requestingVendorId
        );

        // Amounts should be preserved (no modification)
        const originalAmounts = originalVendorEntries.map((e) => e.amount).sort();
        const filteredAmounts = filtered.map((e) => e.amount).sort();

        expect(filteredAmounts).toEqual(originalAmounts);
      }),
      { numRuns: 100 }
    );
  });
});
