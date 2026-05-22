// Feature: vendor-dispute-settings, Property 4: Dispute metrics calculation correctness
// **Validates: Requirements 5.2, 5.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Valid dispute statuses in the system.
 */
const DISPUTE_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

/**
 * Valid resolution outcomes in the system.
 */
const RESOLUTION_OUTCOMES = [
  'full_refund',
  'partial_refund',
  'product_replacement',
  'dispute_rejected',
] as const;
type ResolutionOutcome = (typeof RESOLUTION_OUTCOMES)[number];

/**
 * A dispute object with the fields relevant to metrics calculation.
 */
interface Dispute {
  status: DisputeStatus;
  createdAt: Date;
  vendorRespondedAt?: Date;
  resolutionOutcome?: ResolutionOutcome;
}

/**
 * The metrics result shape matching the backend VendorMetricsResponse.
 */
interface DisputeMetrics {
  totalDisputes: number;
  byStatus: { open: number; inProgress: number; resolved: number; closed: number };
  averageResponseTimeHours: number;
  resolutionOutcomes: {
    fullRefund: number;
    partialRefund: number;
    productReplacement: number;
    disputeRejected: number;
  };
}

/**
 * Pure function that computes dispute metrics from an array of disputes.
 * This mirrors the logic in the backend's getVendorDisputeMetrics aggregation pipeline.
 */
function computeDisputeMetrics(disputes: Dispute[]): DisputeMetrics {
  // Total disputes count
  const totalDisputes = disputes.length;

  // By status counts
  const byStatus = {
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };
  for (const dispute of disputes) {
    switch (dispute.status) {
      case 'open':
        byStatus.open++;
        break;
      case 'in-progress':
        byStatus.inProgress++;
        break;
      case 'resolved':
        byStatus.resolved++;
        break;
      case 'closed':
        byStatus.closed++;
        break;
    }
  }

  // Average response time in hours
  // Only considers disputes that have a vendorRespondedAt timestamp
  const disputesWithResponse = disputes.filter(
    (d) => d.vendorRespondedAt !== undefined
  );
  let averageResponseTimeHours = 0;
  if (disputesWithResponse.length > 0) {
    const totalResponseTimeMs = disputesWithResponse.reduce((sum, d) => {
      return sum + (d.vendorRespondedAt!.getTime() - d.createdAt.getTime());
    }, 0);
    const avgMs = totalResponseTimeMs / disputesWithResponse.length;
    averageResponseTimeHours = avgMs / (1000 * 60 * 60);
  }

  // Resolution outcome breakdown
  const resolutionOutcomes = {
    fullRefund: 0,
    partialRefund: 0,
    productReplacement: 0,
    disputeRejected: 0,
  };
  const outcomeKeyMap: Record<string, keyof typeof resolutionOutcomes> = {
    full_refund: 'fullRefund',
    partial_refund: 'partialRefund',
    product_replacement: 'productReplacement',
    dispute_rejected: 'disputeRejected',
  };
  for (const dispute of disputes) {
    if (dispute.resolutionOutcome) {
      const key = outcomeKeyMap[dispute.resolutionOutcome];
      if (key) {
        resolutionOutcomes[key]++;
      }
    }
  }

  return {
    totalDisputes,
    byStatus,
    averageResponseTimeHours,
    resolutionOutcomes,
  };
}

/**
 * Arbitrary that generates a timestamp within a reasonable range (2020-2025).
 */
const timestampArb = fc.date({
  min: new Date('2020-01-01T00:00:00Z'),
  max: new Date('2025-12-31T23:59:59Z'),
});

/**
 * Arbitrary that generates a dispute object with random status, timestamps, and outcome.
 */
const disputeArb: fc.Arbitrary<Dispute> = fc
  .record({
    status: fc.constantFrom(...DISPUTE_STATUSES),
    createdAt: timestampArb,
    hasResponse: fc.boolean(),
    responseDelayMs: fc.integer({ min: 1000, max: 30 * 24 * 60 * 60 * 1000 }), // 1s to 30 days
    hasOutcome: fc.boolean(),
    resolutionOutcome: fc.constantFrom(...RESOLUTION_OUTCOMES),
  })
  .map(({ status, createdAt, hasResponse, responseDelayMs, hasOutcome, resolutionOutcome }) => {
    const dispute: Dispute = {
      status,
      createdAt,
    };

    if (hasResponse) {
      dispute.vendorRespondedAt = new Date(createdAt.getTime() + responseDelayMs);
    }

    if (hasOutcome) {
      dispute.resolutionOutcome = resolutionOutcome;
    }

    return dispute;
  });

/**
 * Arbitrary that generates a list of disputes.
 */
const disputeListArb = fc.array(disputeArb, { minLength: 0, maxLength: 50 });

describe('Property 4: Dispute metrics calculation correctness', () => {
  it('totalDisputes equals the array length', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);
        expect(metrics.totalDisputes).toBe(disputes.length);
      }),
      { numRuns: 100 }
    );
  });

  it('byStatus counts match the actual count of each status in the array', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);

        const expectedOpen = disputes.filter((d) => d.status === 'open').length;
        const expectedInProgress = disputes.filter((d) => d.status === 'in-progress').length;
        const expectedResolved = disputes.filter((d) => d.status === 'resolved').length;
        const expectedClosed = disputes.filter((d) => d.status === 'closed').length;

        expect(metrics.byStatus.open).toBe(expectedOpen);
        expect(metrics.byStatus.inProgress).toBe(expectedInProgress);
        expect(metrics.byStatus.resolved).toBe(expectedResolved);
        expect(metrics.byStatus.closed).toBe(expectedClosed);
      }),
      { numRuns: 100 }
    );
  });

  it('sum of byStatus counts equals totalDisputes', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);

        const statusSum =
          metrics.byStatus.open +
          metrics.byStatus.inProgress +
          metrics.byStatus.resolved +
          metrics.byStatus.closed;

        expect(statusSum).toBe(metrics.totalDisputes);
      }),
      { numRuns: 100 }
    );
  });

  it('averageResponseTimeHours equals the arithmetic mean of (vendorRespondedAt - createdAt) in hours for disputes with vendorRespondedAt', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);

        const disputesWithResponse = disputes.filter(
          (d) => d.vendorRespondedAt !== undefined
        );

        if (disputesWithResponse.length === 0) {
          expect(metrics.averageResponseTimeHours).toBe(0);
        } else {
          const totalMs = disputesWithResponse.reduce((sum, d) => {
            return sum + (d.vendorRespondedAt!.getTime() - d.createdAt.getTime());
          }, 0);
          const expectedAvgHours = totalMs / disputesWithResponse.length / (1000 * 60 * 60);

          expect(metrics.averageResponseTimeHours).toBeCloseTo(expectedAvgHours, 10);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('averageResponseTimeHours is 0 when no disputes have vendorRespondedAt', () => {
    const disputesWithoutResponseArb = fc.array(
      disputeArb.map((d) => ({ ...d, vendorRespondedAt: undefined })),
      { minLength: 0, maxLength: 30 }
    );

    fc.assert(
      fc.property(disputesWithoutResponseArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);
        expect(metrics.averageResponseTimeHours).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('averageResponseTimeHours is always non-negative (since vendorRespondedAt > createdAt)', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);
        expect(metrics.averageResponseTimeHours).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('resolutionOutcomes counts match actual counts of each outcome in the array', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);

        const expectedFullRefund = disputes.filter(
          (d) => d.resolutionOutcome === 'full_refund'
        ).length;
        const expectedPartialRefund = disputes.filter(
          (d) => d.resolutionOutcome === 'partial_refund'
        ).length;
        const expectedProductReplacement = disputes.filter(
          (d) => d.resolutionOutcome === 'product_replacement'
        ).length;
        const expectedDisputeRejected = disputes.filter(
          (d) => d.resolutionOutcome === 'dispute_rejected'
        ).length;

        expect(metrics.resolutionOutcomes.fullRefund).toBe(expectedFullRefund);
        expect(metrics.resolutionOutcomes.partialRefund).toBe(expectedPartialRefund);
        expect(metrics.resolutionOutcomes.productReplacement).toBe(expectedProductReplacement);
        expect(metrics.resolutionOutcomes.disputeRejected).toBe(expectedDisputeRejected);
      }),
      { numRuns: 100 }
    );
  });

  it('sum of resolutionOutcomes counts equals the number of disputes with a resolutionOutcome', () => {
    fc.assert(
      fc.property(disputeListArb, (disputes) => {
        const metrics = computeDisputeMetrics(disputes);

        const outcomesSum =
          metrics.resolutionOutcomes.fullRefund +
          metrics.resolutionOutcomes.partialRefund +
          metrics.resolutionOutcomes.productReplacement +
          metrics.resolutionOutcomes.disputeRejected;

        const disputesWithOutcome = disputes.filter(
          (d) => d.resolutionOutcome !== undefined
        ).length;

        expect(outcomesSum).toBe(disputesWithOutcome);
      }),
      { numRuns: 100 }
    );
  });
});
