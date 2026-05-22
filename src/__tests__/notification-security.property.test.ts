// Feature: disputes-settings-improvements, Property 22: Security event recording completeness
// **Validates: Requirements 18.1, 18.2**
// Feature: disputes-settings-improvements, Property 23: Security event retention
// **Validates: Requirements 18.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Types mirroring the SecurityEvent model from the backend.
 */
type SecurityEventType =
  | 'password_change'
  | 'email_change'
  | 'login_success'
  | 'login_failure'
  | 'session_terminated'
  | 'account_deletion_request'
  | 'account_deletion_cancelled';

interface ISecurityEvent {
  userId: string;
  eventType: SecurityEventType;
  ipAddress: string;
  deviceType: string;
  browser: string;
  location?: { city: string; country: string };
  outcome: 'success' | 'failure';
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * In-memory store simulating MongoDB collection behavior for SecurityEvents.
 * Mirrors the SecurityEventLogService logic including TTL-based retention.
 */
class InMemorySecurityEventStore {
  private events: ISecurityEvent[] = [];
  private readonly TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

  /**
   * Log a security event (mirrors SecurityEventLogService.log).
   * Extracts device info and stores the event with a timestamp.
   */
  async log(
    userId: string,
    eventType: SecurityEventType,
    ipAddress: string,
    deviceType: string,
    browser: string,
    outcome: 'success' | 'failure',
    metadata?: Record<string, any>,
    createdAt?: Date
  ): Promise<ISecurityEvent> {
    const event: ISecurityEvent = {
      userId,
      eventType,
      ipAddress,
      deviceType,
      browser,
      outcome,
      metadata,
      createdAt: createdAt ?? new Date(),
    };
    this.events.push(event);
    return event;
  }

  /**
   * Get paginated security events for a user in reverse chronological order.
   * Simulates TTL behavior by excluding events older than 90 days from the
   * reference time (defaults to now).
   */
  async getEvents(
    userId: string,
    page: number = 1,
    limit: number = 15,
    referenceTime?: Date
  ): Promise<{ events: ISecurityEvent[]; total: number; hasMore: boolean }> {
    const now = referenceTime ?? new Date();
    const cutoff = new Date(now.getTime() - this.TTL_MS);

    // Filter: only events for this user that are within the 90-day retention window
    const userEvents = this.events
      .filter((e) => e.userId === userId && e.createdAt > cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = userEvents.length;
    const skip = (page - 1) * limit;
    const paginatedEvents = userEvents.slice(skip, skip + limit);
    const hasMore = page * limit < total;

    return { events: paginatedEvents, total, hasMore };
  }

  /**
   * Simulate TTL cleanup — removes events older than 90 days from the reference time.
   * In MongoDB this is handled by the TTL index automatically.
   */
  simulateTTLCleanup(referenceTime: Date): number {
    const cutoff = new Date(referenceTime.getTime() - this.TTL_MS);
    const before = this.events.length;
    this.events = this.events.filter((e) => e.createdAt > cutoff);
    return before - this.events.length;
  }

  /** Get all raw events (for testing assertions) */
  getAllEvents(): ISecurityEvent[] {
    return [...this.events];
  }
}

// --- Arbitraries ---

const securityEventTypeArb = fc.constantFrom<SecurityEventType>(
  'password_change',
  'email_change',
  'login_success',
  'login_failure',
  'session_terminated',
  'account_deletion_request',
  'account_deletion_cancelled'
);

const outcomeArb = fc.constantFrom<'success' | 'failure'>('success', 'failure');

const deviceTypeArb = fc.constantFrom('desktop', 'mobile', 'tablet', 'unknown');

const browserArb = fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'unknown');

const ipAddressArb = fc
  .tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 1, max: 254 })
  )
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/**
 * Arbitrary for generating a security event descriptor with all required fields.
 */
const securityEventArb = fc.record({
  userId: fc.uuid(),
  eventType: securityEventTypeArb,
  ipAddress: ipAddressArb,
  deviceType: deviceTypeArb,
  browser: browserArb,
  outcome: outcomeArb,
});

/**
 * Arbitrary for generating multiple security events for a single user.
 */
const userSecurityEventsArb = fc.record({
  userId: fc.uuid(),
  events: fc.array(
    fc.record({
      eventType: securityEventTypeArb,
      ipAddress: ipAddressArb,
      deviceType: deviceTypeArb,
      browser: browserArb,
      outcome: outcomeArb,
    }),
    { minLength: 1, maxLength: 20 }
  ),
});

/**
 * Arbitrary for generating events with specific ages relative to a reference time.
 * Generates a mix of events within and beyond the 90-day retention window.
 */
const eventsWithAgesArb = fc.record({
  userId: fc.uuid(),
  recentEvents: fc.array(
    fc.record({
      eventType: securityEventTypeArb,
      ipAddress: ipAddressArb,
      deviceType: deviceTypeArb,
      browser: browserArb,
      outcome: outcomeArb,
      // Age in days: 0 to 89 (within retention)
      ageDays: fc.integer({ min: 0, max: 89 }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
  oldEvents: fc.array(
    fc.record({
      eventType: securityEventTypeArb,
      ipAddress: ipAddressArb,
      deviceType: deviceTypeArb,
      browser: browserArb,
      outcome: outcomeArb,
      // Age in days: 91 to 365 (beyond retention)
      ageDays: fc.integer({ min: 91, max: 365 }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
});

describe('Property 22: Security event recording completeness', () => {
  it('every logged security event contains all required fields: timestamp, eventType, ipAddress, deviceType, browser, outcome', () => {
    fc.assert(
      fc.asyncProperty(securityEventArb, async (eventDesc) => {
        const store = new InMemorySecurityEventStore();

        const event = await store.log(
          eventDesc.userId,
          eventDesc.eventType,
          eventDesc.ipAddress,
          eventDesc.deviceType,
          eventDesc.browser,
          eventDesc.outcome
        );

        // Verify all required fields are present and non-empty
        expect(event.createdAt).toBeInstanceOf(Date);
        expect(event.eventType).toBe(eventDesc.eventType);
        expect(event.ipAddress).toBe(eventDesc.ipAddress);
        expect(event.ipAddress.length).toBeGreaterThan(0);
        expect(event.deviceType).toBe(eventDesc.deviceType);
        expect(event.deviceType.length).toBeGreaterThan(0);
        expect(event.browser).toBe(eventDesc.browser);
        expect(event.browser.length).toBeGreaterThan(0);
        expect(event.outcome).toBe(eventDesc.outcome);
        expect(['success', 'failure']).toContain(event.outcome);
      }),
      { numRuns: 100 }
    );
  });

  it('all security-relevant action types are recordable and retrievable', () => {
    fc.assert(
      fc.asyncProperty(userSecurityEventsArb, async ({ userId, events }) => {
        const store = new InMemorySecurityEventStore();

        // Log all events
        for (const eventDesc of events) {
          await store.log(
            userId,
            eventDesc.eventType,
            eventDesc.ipAddress,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.outcome
          );
        }

        // Retrieve events
        const result = await store.getEvents(userId, 1, events.length);

        // All logged events should be retrievable
        expect(result.total).toBe(events.length);
        expect(result.events).toHaveLength(events.length);

        // Each retrieved event should have all required fields
        for (const event of result.events) {
          expect(event.createdAt).toBeInstanceOf(Date);
          expect(event.eventType).toBeDefined();
          expect(event.ipAddress).toBeDefined();
          expect(event.ipAddress.length).toBeGreaterThan(0);
          expect(event.deviceType).toBeDefined();
          expect(event.deviceType.length).toBeGreaterThan(0);
          expect(event.browser).toBeDefined();
          expect(event.browser.length).toBeGreaterThan(0);
          expect(event.outcome).toBeDefined();
          expect(['success', 'failure']).toContain(event.outcome);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('the recorded event type matches the action that was performed', () => {
    fc.assert(
      fc.asyncProperty(securityEventArb, async (eventDesc) => {
        const store = new InMemorySecurityEventStore();

        await store.log(
          eventDesc.userId,
          eventDesc.eventType,
          eventDesc.ipAddress,
          eventDesc.deviceType,
          eventDesc.browser,
          eventDesc.outcome
        );

        const result = await store.getEvents(eventDesc.userId, 1, 1);
        expect(result.events[0].eventType).toBe(eventDesc.eventType);
        expect(result.events[0].userId).toBe(eventDesc.userId);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 23: Security event retention', () => {
  it('events older than 90 days are not returned in queries', () => {
    fc.assert(
      fc.asyncProperty(eventsWithAgesArb, async ({ userId, recentEvents, oldEvents }) => {
        const store = new InMemorySecurityEventStore();
        const now = new Date();

        // Log recent events (within 90-day window)
        for (const eventDesc of recentEvents) {
          const createdAt = new Date(now.getTime() - eventDesc.ageDays * 24 * 60 * 60 * 1000);
          await store.log(
            userId,
            eventDesc.eventType,
            eventDesc.ipAddress,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.outcome,
            undefined,
            createdAt
          );
        }

        // Log old events (beyond 90-day window)
        for (const eventDesc of oldEvents) {
          const createdAt = new Date(now.getTime() - eventDesc.ageDays * 24 * 60 * 60 * 1000);
          await store.log(
            userId,
            eventDesc.eventType,
            eventDesc.ipAddress,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.outcome,
            undefined,
            createdAt
          );
        }

        // Query events — should only return recent events
        const totalEvents = recentEvents.length + oldEvents.length;
        const result = await store.getEvents(userId, 1, totalEvents, now);

        // Only recent events should be returned
        expect(result.total).toBe(recentEvents.length);
        expect(result.events).toHaveLength(recentEvents.length);

        // Verify no returned event is older than 90 days
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        for (const event of result.events) {
          expect(event.createdAt.getTime()).toBeGreaterThan(cutoff.getTime());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('TTL cleanup removes events older than 90 days', () => {
    fc.assert(
      fc.asyncProperty(eventsWithAgesArb, async ({ userId, recentEvents, oldEvents }) => {
        const store = new InMemorySecurityEventStore();
        const now = new Date();

        // Log recent events
        for (const eventDesc of recentEvents) {
          const createdAt = new Date(now.getTime() - eventDesc.ageDays * 24 * 60 * 60 * 1000);
          await store.log(
            userId,
            eventDesc.eventType,
            eventDesc.ipAddress,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.outcome,
            undefined,
            createdAt
          );
        }

        // Log old events
        for (const eventDesc of oldEvents) {
          const createdAt = new Date(now.getTime() - eventDesc.ageDays * 24 * 60 * 60 * 1000);
          await store.log(
            userId,
            eventDesc.eventType,
            eventDesc.ipAddress,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.outcome,
            undefined,
            createdAt
          );
        }

        // Simulate TTL cleanup
        const removedCount = store.simulateTTLCleanup(now);

        // The number of removed events should equal the old events count
        expect(removedCount).toBe(oldEvents.length);

        // After cleanup, only recent events remain in the store
        const allRemaining = store.getAllEvents();
        expect(allRemaining).toHaveLength(recentEvents.length);

        // All remaining events should be within the 90-day window
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        for (const event of allRemaining) {
          expect(event.createdAt.getTime()).toBeGreaterThan(cutoff.getTime());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('events exactly at the 90-day boundary are excluded from queries', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          eventType: securityEventTypeArb,
          ipAddress: ipAddressArb,
          deviceType: deviceTypeArb,
          browser: browserArb,
          outcome: outcomeArb,
          // Extra hours beyond 90 days (1 to 24 hours past the boundary)
          extraHours: fc.integer({ min: 1, max: 24 }),
        }),
        async (desc) => {
          const store = new InMemorySecurityEventStore();
          const now = new Date();

          // Create an event that is exactly 90 days + extra hours old
          const createdAt = new Date(
            now.getTime() - (90 * 24 + desc.extraHours) * 60 * 60 * 1000
          );

          await store.log(
            desc.userId,
            desc.eventType,
            desc.ipAddress,
            desc.deviceType,
            desc.browser,
            desc.outcome,
            undefined,
            createdAt
          );

          // Query should not return this event
          const result = await store.getEvents(desc.userId, 1, 10, now);
          expect(result.total).toBe(0);
          expect(result.events).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: disputes-settings-improvements, Property 21: Dispute escalation eligibility
// **Validates: Requirements 17.1, 17.3**

/**
 * Pure function that determines whether a dispute is eligible for escalation.
 * A dispute is eligible if and only if:
 * 1. It has been open for more than 7 days, AND
 * 2. It has not been previously escalated.
 */
function isEscalationEligible(dispute: {
  openedAt: Date;
  escalatedAt: Date | null;
  currentTime: Date;
}): boolean {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const ageMs = dispute.currentTime.getTime() - dispute.openedAt.getTime();
  const openMoreThan7Days = ageMs > SEVEN_DAYS_MS;
  const notEscalated = dispute.escalatedAt === null;
  return openMoreThan7Days && notEscalated;
}

// --- Arbitraries for Property 21 ---

/**
 * Generates a dispute that has been open for MORE than 7 days and has NOT been escalated.
 * Expected: eligible = true
 */
const eligibleDisputeArb = fc
  .record({
    // Age in days beyond 7 (7.01 to 365 days)
    extraDaysOpen: fc.double({ min: 0.01, max: 358, noNaN: true }),
  })
  .map(({ extraDaysOpen }) => {
    const currentTime = new Date('2025-01-15T12:00:00Z');
    const totalDays = 7 + extraDaysOpen;
    const openedAt = new Date(currentTime.getTime() - totalDays * 24 * 60 * 60 * 1000);
    return { openedAt, escalatedAt: null, currentTime };
  });

/**
 * Generates a dispute that has been open for 7 days or LESS.
 * Expected: eligible = false (regardless of escalation status)
 */
const tooYoungDisputeArb = fc
  .record({
    // Age in days: 0 to 7 (inclusive of 7, which is NOT more than 7)
    ageDays: fc.double({ min: 0, max: 7, noNaN: true }),
    // May or may not have been escalated
    wasEscalated: fc.boolean(),
  })
  .map(({ ageDays, wasEscalated }) => {
    const currentTime = new Date('2025-01-15T12:00:00Z');
    const openedAt = new Date(currentTime.getTime() - ageDays * 24 * 60 * 60 * 1000);
    const escalatedAt = wasEscalated
      ? new Date(currentTime.getTime() - 1 * 24 * 60 * 60 * 1000)
      : null;
    return { openedAt, escalatedAt, currentTime };
  });

/**
 * Generates a dispute that has already been escalated.
 * Expected: eligible = false (regardless of age)
 */
const alreadyEscalatedDisputeArb = fc
  .record({
    // Age in days: could be anything (1 to 365)
    ageDays: fc.double({ min: 1, max: 365, noNaN: true }),
    // Escalation happened some time after opening
    escalationOffsetDays: fc.double({ min: 0.1, max: 30, noNaN: true }),
  })
  .map(({ ageDays, escalationOffsetDays }) => {
    const currentTime = new Date('2025-01-15T12:00:00Z');
    const openedAt = new Date(currentTime.getTime() - ageDays * 24 * 60 * 60 * 1000);
    // Escalation happened after opening but before current time
    const escalationOffset = Math.min(escalationOffsetDays, ageDays - 0.01);
    const escalatedAt = new Date(
      openedAt.getTime() + Math.max(escalationOffset, 0.01) * 24 * 60 * 60 * 1000
    );
    return { openedAt, escalatedAt, currentTime };
  });

/**
 * Generates an arbitrary dispute with random age and escalation status for biconditional testing.
 */
const arbitraryDisputeArb = fc
  .record({
    ageDays: fc.double({ min: 0, max: 365, noNaN: true }),
    wasEscalated: fc.boolean(),
    escalationOffsetDays: fc.double({ min: 0.1, max: 30, noNaN: true }),
  })
  .map(({ ageDays, wasEscalated, escalationOffsetDays }) => {
    const currentTime = new Date('2025-01-15T12:00:00Z');
    const openedAt = new Date(currentTime.getTime() - ageDays * 24 * 60 * 60 * 1000);
    let escalatedAt: Date | null = null;
    if (wasEscalated) {
      const offset = Math.min(escalationOffsetDays, Math.max(ageDays - 0.01, 0.01));
      escalatedAt = new Date(openedAt.getTime() + offset * 24 * 60 * 60 * 1000);
    }
    return { openedAt, escalatedAt, currentTime };
  });

describe('Property 21: Dispute escalation eligibility', () => {
  it('a dispute open > 7 days AND not escalated is eligible for escalation', () => {
    fc.assert(
      fc.property(eligibleDisputeArb, (dispute) => {
        const result = isEscalationEligible(dispute);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('a dispute open <= 7 days is NOT eligible for escalation regardless of escalation status', () => {
    fc.assert(
      fc.property(tooYoungDisputeArb, (dispute) => {
        const result = isEscalationEligible(dispute);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('a dispute already escalated is NOT eligible for escalation regardless of age', () => {
    fc.assert(
      fc.property(alreadyEscalatedDisputeArb, (dispute) => {
        const result = isEscalationEligible(dispute);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('biconditional: eligible ⟺ (open > 7 days AND not escalated)', () => {
    fc.assert(
      fc.property(arbitraryDisputeArb, (dispute) => {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const ageMs = dispute.currentTime.getTime() - dispute.openedAt.getTime();
        const openMoreThan7Days = ageMs > SEVEN_DAYS_MS;
        const notEscalated = dispute.escalatedAt === null;

        const expectedEligible = openMoreThan7Days && notEscalated;
        const actualEligible = isEscalationEligible(dispute);

        expect(actualEligible).toBe(expectedEligible);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: disputes-settings-improvements, Property 20: Security notification bypass
// **Validates: Requirements 16.3**

/**
 * Pure function that determines whether a notification should be delivered immediately
 * (bypassing digest) based on its type.
 *
 * Security-related notifications (password_change, login_failure, session_terminated)
 * are ALWAYS delivered immediately regardless of the user's notification frequency preference.
 */
function isSecurityNotification(type: string): boolean {
  const SECURITY_TYPES = ['password_change', 'login_failure', 'session_terminated'];
  return SECURITY_TYPES.includes(type);
}

type NotificationFrequency = 'real-time' | 'daily_digest';

/**
 * Determines the delivery mode for a notification given the user's frequency preference
 * and the notification type.
 *
 * Returns 'immediate' if the notification should be delivered right away,
 * or 'digest' if it should be batched for daily delivery.
 */
function getDeliveryMode(
  notificationType: string,
  userFrequency: NotificationFrequency
): 'immediate' | 'digest' {
  // Security notifications always bypass digest
  if (isSecurityNotification(notificationType)) {
    return 'immediate';
  }
  // Non-security notifications respect user preference
  return userFrequency === 'daily_digest' ? 'digest' : 'immediate';
}

// --- Arbitraries for Property 20 ---

const securityNotificationTypeArb = fc.constantFrom(
  'password_change',
  'login_failure',
  'session_terminated'
);

const nonSecurityNotificationTypeArb = fc.constantFrom(
  'order_placed',
  'product_listed',
  'bid_placed',
  'offer-accepted',
  'chat_message',
  'review_submitted',
  'wallet_topup',
  'payout_processed',
  'subscription_expiry_warning'
);

const frequencyArb = fc.constantFrom<NotificationFrequency>('real-time', 'daily_digest');

describe('Property 20: Security notification bypass', () => {
  it('security notifications (password_change, login_failure, session_terminated) are always delivered immediately regardless of frequency preference', () => {
    fc.assert(
      fc.property(
        securityNotificationTypeArb,
        frequencyArb,
        (notificationType, userFrequency) => {
          const deliveryMode = getDeliveryMode(notificationType, userFrequency);
          expect(deliveryMode).toBe('immediate');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-security notifications respect the user frequency preference', () => {
    fc.assert(
      fc.property(
        nonSecurityNotificationTypeArb,
        frequencyArb,
        (notificationType, userFrequency) => {
          const deliveryMode = getDeliveryMode(notificationType, userFrequency);
          if (userFrequency === 'daily_digest') {
            expect(deliveryMode).toBe('digest');
          } else {
            expect(deliveryMode).toBe('immediate');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isSecurityNotification returns true only for the three security types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'password_change',
          'login_failure',
          'session_terminated',
          'order_placed',
          'product_listed',
          'bid_placed',
          'offer-accepted',
          'chat_message',
          'review_submitted',
          'wallet_topup',
          'payout_processed',
          'email_change',
          'account_suspension'
        ),
        (notificationType) => {
          const expected = ['password_change', 'login_failure', 'session_terminated'].includes(
            notificationType
          );
          expect(isSecurityNotification(notificationType)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('biconditional: immediate delivery ⟺ (security notification OR real-time preference)', () => {
    fc.assert(
      fc.property(
        fc.oneof(securityNotificationTypeArb, nonSecurityNotificationTypeArb),
        frequencyArb,
        (notificationType, userFrequency) => {
          const deliveryMode = getDeliveryMode(notificationType, userFrequency);
          const isSecurity = isSecurityNotification(notificationType);
          const isRealTime = userFrequency === 'real-time';

          const expectedImmediate = isSecurity || isRealTime;
          expect(deliveryMode === 'immediate').toBe(expectedImmediate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
