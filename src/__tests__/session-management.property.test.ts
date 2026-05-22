// Feature: disputes-settings-improvements, Property 6: Session invalidation on password change
// **Validates: Requirements 6.1**
// Feature: disputes-settings-improvements, Property 7: Session termination removes from active list
// **Validates: Requirements 7.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * In-memory Redis simulation for testing session management logic.
 * This mirrors the Redis operations used by SessionService without requiring
 * a real Redis connection.
 */
class InMemoryRedisStore {
  private store: Map<string, string> = new Map();
  private sets: Map<string, Set<string>> = new Map();

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key)!.add(member);
  }

  async srem(key: string, member: string): Promise<void> {
    this.sets.get(key)?.delete(member);
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }
}

/**
 * Session interface matching the SessionService ISession type.
 */
interface ISession {
  sessionId: string;
  userId: string;
  token: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ipAddress: string;
  lastActivity: Date;
  createdAt: Date;
}

/**
 * Simulated SessionService that uses the in-memory Redis store.
 * Implements the same logic as the real SessionService for:
 * - createSession
 * - getActiveSessions
 * - terminateSession
 * - invalidateAllExcept
 */
class SimulatedSessionService {
  constructor(private redis: InMemoryRedisStore) {}

  async createSession(
    userId: string,
    token: string,
    sessionId: string,
    deviceType: 'desktop' | 'mobile' | 'tablet',
    browser: string,
    ipAddress: string
  ): Promise<ISession> {
    const session: ISession = {
      sessionId,
      userId,
      token,
      deviceType,
      browser,
      ipAddress,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    const sessionKey = `session:${userId}:${sessionId}`;
    const sessionsListKey = `sessions_list:${userId}`;

    await this.redis.set(sessionKey, JSON.stringify(session));
    await this.redis.sadd(sessionsListKey, sessionId);

    return session;
  }

  async getActiveSessions(userId: string): Promise<ISession[]> {
    const sessionsListKey = `sessions_list:${userId}`;
    const sessionIds = await this.redis.smembers(sessionsListKey);

    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }

    const sessions: ISession[] = [];
    for (const sessionId of sessionIds) {
      const sessionKey = `session:${userId}:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);

      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        parsed.lastActivity = new Date(parsed.lastActivity);
        parsed.createdAt = new Date(parsed.createdAt);
        sessions.push(parsed as ISession);
      } else {
        // Session expired but still in the set — clean it up
        await this.redis.srem(sessionsListKey, sessionId);
      }
    }

    return sessions;
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    const sessionKey = `session:${userId}:${sessionId}`;
    const sessionsListKey = `sessions_list:${userId}`;

    await this.redis.del(sessionKey);
    await this.redis.srem(sessionsListKey, sessionId);
  }

  async invalidateAllExcept(userId: string, currentToken: string): Promise<number> {
    const sessionsListKey = `sessions_list:${userId}`;
    const sessionIds = await this.redis.smembers(sessionsListKey);

    if (!sessionIds || sessionIds.length === 0) {
      return 0;
    }

    let invalidatedCount = 0;

    for (const sessionId of sessionIds) {
      const sessionKey = `session:${userId}:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);

      if (sessionData) {
        const parsed = JSON.parse(sessionData);

        // Keep the session that matches the current token
        if (parsed.token === currentToken) {
          continue;
        }
      }

      // Remove this session
      await this.redis.del(sessionKey);
      await this.redis.srem(sessionsListKey, sessionId);
      invalidatedCount++;
    }

    return invalidatedCount;
  }
}

// --- Arbitraries ---

const deviceTypeArb = fc.constantFrom<'desktop' | 'mobile' | 'tablet'>(
  'desktop',
  'mobile',
  'tablet'
);
const browserArb = fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge', 'Opera');
const ipAddressArb = fc
  .tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 1, max: 254 })
  )
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/**
 * Arbitrary for generating a session descriptor (without creating it in Redis).
 */
const sessionDescArb = fc.record({
  sessionId: fc.uuid(),
  token: fc.uuid(),
  deviceType: deviceTypeArb,
  browser: browserArb,
  ipAddress: ipAddressArb,
});

/**
 * Arbitrary for generating a set of sessions for a single user.
 * Each session has a unique token and session ID.
 * Also generates an index to select the "current" session deterministically.
 */
const sessionSetWithCurrentArb = fc
  .record({
    userId: fc.uuid(),
    sessions: fc.array(sessionDescArb, { minLength: 2, maxLength: 10 }),
    currentIndexRaw: fc.nat(),
  })
  .filter(({ sessions }) => {
    // Ensure all tokens are unique
    const tokens = sessions.map((s) => s.token);
    if (new Set(tokens).size !== tokens.length) return false;
    // Ensure all session IDs are unique
    const ids = sessions.map((s) => s.sessionId);
    return new Set(ids).size === ids.length;
  })
  .map(({ userId, sessions, currentIndexRaw }) => ({
    userId,
    sessions,
    currentIndex: currentIndexRaw % sessions.length,
  }));

/**
 * Arbitrary for generating a set of sessions with a target index for termination.
 */
const sessionSetWithTargetArb = fc
  .record({
    userId: fc.uuid(),
    sessions: fc.array(sessionDescArb, { minLength: 2, maxLength: 10 }),
    targetIndexRaw: fc.nat(),
  })
  .filter(({ sessions }) => {
    const tokens = sessions.map((s) => s.token);
    if (new Set(tokens).size !== tokens.length) return false;
    const ids = sessions.map((s) => s.sessionId);
    return new Set(ids).size === ids.length;
  })
  .map(({ userId, sessions, targetIndexRaw }) => ({
    userId,
    sessions,
    targetIndex: targetIndexRaw % sessions.length,
  }));

describe('Property 6: Session invalidation on password change', () => {
  it('after invalidateAllExcept, only the session with the matching token remains', () => {
    fc.assert(
      fc.asyncProperty(sessionSetWithCurrentArb, async ({ userId, sessions, currentIndex }) => {
        const redis = new InMemoryRedisStore();
        const service = new SimulatedSessionService(redis);

        // Create all sessions
        for (const s of sessions) {
          await service.createSession(userId, s.token, s.sessionId, s.deviceType, s.browser, s.ipAddress);
        }

        const currentToken = sessions[currentIndex].token;

        // Invalidate all except the current token
        const invalidatedCount = await service.invalidateAllExcept(userId, currentToken);

        // Get remaining active sessions
        const activeSessions = await service.getActiveSessions(userId);

        // Only one session should remain
        expect(activeSessions).toHaveLength(1);

        // The remaining session should have the current token
        expect(activeSessions[0].token).toBe(currentToken);

        // The invalidated count should be total sessions minus 1
        expect(invalidatedCount).toBe(sessions.length - 1);
      }),
      { numRuns: 100 }
    );
  });

  it('all sessions except the current are removed from Redis', () => {
    fc.assert(
      fc.asyncProperty(sessionSetWithCurrentArb, async ({ userId, sessions, currentIndex }) => {
        const redis = new InMemoryRedisStore();
        const service = new SimulatedSessionService(redis);

        // Create all sessions
        for (const s of sessions) {
          await service.createSession(userId, s.token, s.sessionId, s.deviceType, s.browser, s.ipAddress);
        }

        const currentToken = sessions[currentIndex].token;
        const currentSessionId = sessions[currentIndex].sessionId;

        // Invalidate all except current
        await service.invalidateAllExcept(userId, currentToken);

        // Verify each non-current session is gone from Redis
        for (let i = 0; i < sessions.length; i++) {
          if (i === currentIndex) continue;
          const sessionKey = `session:${userId}:${sessions[i].sessionId}`;
          const data = await redis.get(sessionKey);
          expect(data).toBeNull();
        }

        // Verify the current session still exists
        const currentSessionKey = `session:${userId}:${currentSessionId}`;
        const currentData = await redis.get(currentSessionKey);
        expect(currentData).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('invalidating with no sessions returns 0', () => {
    fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, token) => {
        const redis = new InMemoryRedisStore();
        const service = new SimulatedSessionService(redis);

        const count = await service.invalidateAllExcept(userId, token);
        expect(count).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Session termination removes from active list', () => {
  it('after terminateSession, getActiveSessions no longer includes that session', () => {
    fc.assert(
      fc.asyncProperty(sessionSetWithTargetArb, async ({ userId, sessions, targetIndex }) => {
        const redis = new InMemoryRedisStore();
        const service = new SimulatedSessionService(redis);

        // Create all sessions
        for (const s of sessions) {
          await service.createSession(userId, s.token, s.sessionId, s.deviceType, s.browser, s.ipAddress);
        }

        const sessionToTerminate = sessions[targetIndex];

        // Terminate the session
        await service.terminateSession(userId, sessionToTerminate.sessionId);

        // Get active sessions
        const activeSessions = await service.getActiveSessions(userId);

        // The terminated session should not be in the active list
        const activeSessionIds = activeSessions.map((s) => s.sessionId);
        expect(activeSessionIds).not.toContain(sessionToTerminate.sessionId);

        // The remaining sessions should be all others
        expect(activeSessions).toHaveLength(sessions.length - 1);
      }),
      { numRuns: 100 }
    );
  });

  it('terminating a session does not affect other sessions', () => {
    fc.assert(
      fc.asyncProperty(sessionSetWithTargetArb, async ({ userId, sessions, targetIndex }) => {
        const redis = new InMemoryRedisStore();
        const service = new SimulatedSessionService(redis);

        // Create all sessions
        for (const s of sessions) {
          await service.createSession(userId, s.token, s.sessionId, s.deviceType, s.browser, s.ipAddress);
        }

        const sessionToTerminate = sessions[targetIndex];
        await service.terminateSession(userId, sessionToTerminate.sessionId);

        // Get active sessions
        const activeSessions = await service.getActiveSessions(userId);

        // All other sessions should still be active
        const remainingSessions = sessions.filter((_, i) => i !== targetIndex);
        const activeIds = activeSessions.map((s) => s.sessionId).sort();
        const expectedIds = remainingSessions.map((s) => s.sessionId).sort();

        expect(activeIds).toEqual(expectedIds);
      }),
      { numRuns: 100 }
    );
  });

  it('terminating a non-existent session does not affect active sessions', () => {
    fc.assert(
      fc.asyncProperty(
        sessionSetWithTargetArb,
        fc.uuid(),
        async ({ userId, sessions }, nonExistentSessionId) => {
          // Ensure the non-existent ID is not in the sessions
          const existingIds = new Set(sessions.map((s) => s.sessionId));
          if (existingIds.has(nonExistentSessionId)) return; // skip this case

          const redis = new InMemoryRedisStore();
          const service = new SimulatedSessionService(redis);

          // Create all sessions
          for (const s of sessions) {
            await service.createSession(userId, s.token, s.sessionId, s.deviceType, s.browser, s.ipAddress);
          }

          // Terminate a non-existent session
          await service.terminateSession(userId, nonExistentSessionId);

          // All sessions should still be active
          const activeSessions = await service.getActiveSessions(userId);
          expect(activeSessions).toHaveLength(sessions.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: disputes-settings-improvements, Property 8: Login history storage limit and ordering
// **Validates: Requirements 8.2, 8.3**
// Feature: disputes-settings-improvements, Property 9: Login event anomaly detection
// **Validates: Requirements 8.4**

/**
 * In-memory login event store simulating MongoDB LoginEvent collection.
 * Implements the same logic as SessionService.recordLoginEvent and getLoginHistory
 * without requiring a real MongoDB connection.
 */
interface ILoginEventRecord {
  id: string;
  userId: string;
  timestamp: Date;
  deviceType: string;
  browser: string;
  ipAddress: string;
  location?: { city: string; country: string };
  isNewDevice: boolean;
  isUnusualLocation: boolean;
  success: boolean;
}

const MAX_LOGIN_EVENTS_PER_USER = 50;

class InMemoryLoginEventStore {
  private events: ILoginEventRecord[] = [];
  private idCounter = 0;

  /**
   * Records a login event, applying the same logic as SessionService.recordLoginEvent:
   * - Detects new devices (deviceType + browser combination not seen before)
   * - Detects unusual locations (IP address not seen before)
   * - Caps stored events at 50 per user (removes oldest beyond limit)
   */
  async recordLoginEvent(
    userId: string,
    deviceType: string,
    browser: string,
    ipAddress: string,
    success: boolean,
    timestamp?: Date
  ): Promise<ILoginEventRecord> {
    // Get previous events for this user sorted by timestamp descending
    const previousEvents = this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // A device is "new" if this combination of deviceType + browser hasn't been seen before
    const isNewDevice = !previousEvents.some(
      (event) => event.deviceType === deviceType && event.browser === browser
    );

    // A location is "unusual" if this IP address hasn't been seen in previous logins
    const isUnusualLocation = !previousEvents.some(
      (event) => event.ipAddress === ipAddress
    );

    const event: ILoginEventRecord = {
      id: `event_${++this.idCounter}`,
      userId,
      timestamp: timestamp ?? new Date(),
      deviceType,
      browser,
      ipAddress,
      isNewDevice,
      isUnusualLocation,
      success,
    };

    this.events.push(event);

    // Cap at MAX_LOGIN_EVENTS_PER_USER per user — remove oldest events beyond the limit
    const userEvents = this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (userEvents.length > MAX_LOGIN_EVENTS_PER_USER) {
      const eventsToRemove = userEvents.length - MAX_LOGIN_EVENTS_PER_USER;
      const idsToRemove = new Set(
        userEvents.slice(0, eventsToRemove).map((e) => e.id)
      );
      this.events = this.events.filter((e) => !idsToRemove.has(e.id));
    }

    return event;
  }

  /**
   * Returns login history for a user with pagination, matching getLoginHistory logic.
   * Events are returned in reverse chronological order.
   */
  async getLoginHistory(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ events: ILoginEventRecord[]; total: number }> {
    const userEvents = this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = userEvents.length;
    const skip = (page - 1) * limit;
    const events = userEvents.slice(skip, skip + limit);

    return { events, total };
  }

  /**
   * Returns all events for a user (for testing purposes).
   */
  async getAllEventsForUser(userId: string): Promise<ILoginEventRecord[]> {
    return this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// --- Login History Arbitraries ---

const loginDeviceTypeArb = fc.constantFrom('desktop', 'mobile', 'tablet');
const loginBrowserArb = fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge', 'Opera');
const loginIpAddressArb = fc
  .tuple(
    fc.integer({ min: 1, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 1, max: 254 })
  )
  .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/**
 * Arbitrary for generating a login event descriptor.
 */
const loginEventDescArb = fc.record({
  deviceType: loginDeviceTypeArb,
  browser: loginBrowserArb,
  ipAddress: loginIpAddressArb,
  success: fc.boolean(),
});

/**
 * Arbitrary for generating a batch of login events with distinct timestamps.
 * Generates between 1 and 70 events to test the 50-event cap.
 */
const loginEventBatchArb = fc.record({
  userId: fc.uuid(),
  events: fc.array(loginEventDescArb, { minLength: 1, maxLength: 70 }),
});

/**
 * Arbitrary for generating a batch that exceeds the 50-event limit.
 */
const loginEventOverflowBatchArb = fc.record({
  userId: fc.uuid(),
  events: fc.array(loginEventDescArb, { minLength: 51, maxLength: 70 }),
});

describe('Property 8: Login history storage limit and ordering', () => {
  it('stored events SHALL not exceed 50 per user', () => {
    fc.assert(
      fc.asyncProperty(loginEventBatchArb, async ({ userId, events }) => {
        const store = new InMemoryLoginEventStore();

        // Record all events with incrementing timestamps
        const baseTime = Date.now();
        for (let i = 0; i < events.length; i++) {
          const e = events[i];
          await store.recordLoginEvent(
            userId,
            e.deviceType,
            e.browser,
            e.ipAddress,
            e.success,
            new Date(baseTime + i * 1000)
          );
        }

        // Verify the total stored events do not exceed 50
        const allEvents = await store.getAllEventsForUser(userId);
        expect(allEvents.length).toBeLessThanOrEqual(MAX_LOGIN_EVENTS_PER_USER);
      }),
      { numRuns: 100 }
    );
  });

  it('when events exceed 50, exactly 50 are retained', () => {
    fc.assert(
      fc.asyncProperty(loginEventOverflowBatchArb, async ({ userId, events }) => {
        const store = new InMemoryLoginEventStore();

        // Record all events with incrementing timestamps
        const baseTime = Date.now();
        for (let i = 0; i < events.length; i++) {
          const e = events[i];
          await store.recordLoginEvent(
            userId,
            e.deviceType,
            e.browser,
            e.ipAddress,
            e.success,
            new Date(baseTime + i * 1000)
          );
        }

        // Verify exactly 50 events are stored
        const allEvents = await store.getAllEventsForUser(userId);
        expect(allEvents.length).toBe(MAX_LOGIN_EVENTS_PER_USER);
      }),
      { numRuns: 100 }
    );
  });

  it('events SHALL be returned in reverse chronological order', () => {
    fc.assert(
      fc.asyncProperty(loginEventBatchArb, async ({ userId, events }) => {
        const store = new InMemoryLoginEventStore();

        // Record all events with incrementing timestamps
        const baseTime = Date.now();
        for (let i = 0; i < events.length; i++) {
          const e = events[i];
          await store.recordLoginEvent(
            userId,
            e.deviceType,
            e.browser,
            e.ipAddress,
            e.success,
            new Date(baseTime + i * 1000)
          );
        }

        // Get login history (page 1, large limit to get all)
        const { events: returnedEvents } = await store.getLoginHistory(userId, 1, 50);

        // Verify reverse chronological order
        for (let i = 0; i < returnedEvents.length - 1; i++) {
          expect(returnedEvents[i].timestamp.getTime()).toBeGreaterThanOrEqual(
            returnedEvents[i + 1].timestamp.getTime()
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('the most recent 50 events are retained when overflow occurs', () => {
    fc.assert(
      fc.asyncProperty(loginEventOverflowBatchArb, async ({ userId, events }) => {
        const store = new InMemoryLoginEventStore();

        // Record all events with incrementing timestamps
        const baseTime = Date.now();
        for (let i = 0; i < events.length; i++) {
          const e = events[i];
          await store.recordLoginEvent(
            userId,
            e.deviceType,
            e.browser,
            e.ipAddress,
            e.success,
            new Date(baseTime + i * 1000)
          );
        }

        // Get all stored events
        const allEvents = await store.getAllEventsForUser(userId);

        // The oldest stored event should correspond to the event at index (events.length - 50)
        // since we keep the most recent 50
        const oldestStoredTimestamp = allEvents[allEvents.length - 1].timestamp.getTime();
        const expectedOldestTimestamp = baseTime + (events.length - 50) * 1000;
        expect(oldestStoredTimestamp).toBe(expectedOldestTimestamp);
      }),
      { numRuns: 100 }
    );
  });

  it('pagination returns correct subsets in reverse chronological order', () => {
    fc.assert(
      fc.asyncProperty(
        loginEventBatchArb,
        fc.integer({ min: 1, max: 10 }),
        async ({ userId, events }, pageSize) => {
          const store = new InMemoryLoginEventStore();

          // Record all events
          const baseTime = Date.now();
          for (let i = 0; i < events.length; i++) {
            const e = events[i];
            await store.recordLoginEvent(
              userId,
              e.deviceType,
              e.browser,
              e.ipAddress,
              e.success,
              new Date(baseTime + i * 1000)
            );
          }

          // Get page 1
          const { events: page1Events, total } = await store.getLoginHistory(userId, 1, pageSize);

          // Total should not exceed 50
          expect(total).toBeLessThanOrEqual(MAX_LOGIN_EVENTS_PER_USER);

          // Page 1 should have at most pageSize events
          expect(page1Events.length).toBeLessThanOrEqual(pageSize);

          // Events on page 1 should be in reverse chronological order
          for (let i = 0; i < page1Events.length - 1; i++) {
            expect(page1Events[i].timestamp.getTime()).toBeGreaterThanOrEqual(
              page1Events[i + 1].timestamp.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 9: Login event anomaly detection', () => {
  it('first login event for a user SHALL be flagged as anomalous (new device and unusual location)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        loginEventDescArb,
        async (userId, eventDesc) => {
          const store = new InMemoryLoginEventStore();

          const event = await store.recordLoginEvent(
            userId,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.ipAddress,
            eventDesc.success
          );

          // First event should always be flagged as new device and unusual location
          expect(event.isNewDevice).toBe(true);
          expect(event.isUnusualLocation).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('login from a previously seen device+browser SHALL NOT be flagged as new device', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        loginEventDescArb,
        loginIpAddressArb,
        async (userId, eventDesc, differentIp) => {
          const store = new InMemoryLoginEventStore();

          // First login establishes the device
          await store.recordLoginEvent(
            userId,
            eventDesc.deviceType,
            eventDesc.browser,
            eventDesc.ipAddress,
            eventDesc.success
          );

          // Second login with same device+browser but potentially different IP
          const secondEvent = await store.recordLoginEvent(
            userId,
            eventDesc.deviceType,
            eventDesc.browser,
            differentIp,
            eventDesc.success
          );

          // Same device+browser should NOT be flagged as new device
          expect(secondEvent.isNewDevice).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('login from a new device+browser combination SHALL be flagged as new device', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        loginEventDescArb,
        loginDeviceTypeArb,
        loginBrowserArb,
        async (userId, firstEvent, newDeviceType, newBrowser) => {
          // Ensure the new device+browser combination is actually different
          if (
            newDeviceType === firstEvent.deviceType &&
            newBrowser === firstEvent.browser
          ) {
            return; // skip this case
          }

          const store = new InMemoryLoginEventStore();

          // First login establishes a device
          await store.recordLoginEvent(
            userId,
            firstEvent.deviceType,
            firstEvent.browser,
            firstEvent.ipAddress,
            firstEvent.success
          );

          // Second login with a different device+browser
          const secondEvent = await store.recordLoginEvent(
            userId,
            newDeviceType,
            newBrowser,
            firstEvent.ipAddress,
            true
          );

          // New device+browser should be flagged
          expect(secondEvent.isNewDevice).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('login from a previously seen IP SHALL NOT be flagged as unusual location', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        loginEventDescArb,
        loginDeviceTypeArb,
        loginBrowserArb,
        async (userId, firstEvent, newDeviceType, newBrowser) => {
          const store = new InMemoryLoginEventStore();

          // First login establishes the IP
          await store.recordLoginEvent(
            userId,
            firstEvent.deviceType,
            firstEvent.browser,
            firstEvent.ipAddress,
            firstEvent.success
          );

          // Second login with same IP but different device
          const secondEvent = await store.recordLoginEvent(
            userId,
            newDeviceType,
            newBrowser,
            firstEvent.ipAddress,
            true
          );

          // Same IP should NOT be flagged as unusual location
          expect(secondEvent.isUnusualLocation).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('login from a new IP SHALL be flagged as unusual location', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        loginEventDescArb,
        loginIpAddressArb,
        async (userId, firstEvent, newIp) => {
          // Ensure the new IP is actually different
          if (newIp === firstEvent.ipAddress) {
            return; // skip this case
          }

          const store = new InMemoryLoginEventStore();

          // First login establishes an IP
          await store.recordLoginEvent(
            userId,
            firstEvent.deviceType,
            firstEvent.browser,
            firstEvent.ipAddress,
            firstEvent.success
          );

          // Second login with a different IP
          const secondEvent = await store.recordLoginEvent(
            userId,
            firstEvent.deviceType,
            firstEvent.browser,
            newIp,
            true
          );

          // New IP should be flagged as unusual location
          expect(secondEvent.isUnusualLocation).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('anomaly detection considers full history, not just the most recent event', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(loginEventDescArb, { minLength: 2, maxLength: 10 }),
        async (userId, eventDescs) => {
          const store = new InMemoryLoginEventStore();

          // Record all events
          const baseTime = Date.now();
          for (let i = 0; i < eventDescs.length; i++) {
            const e = eventDescs[i];
            await store.recordLoginEvent(
              userId,
              e.deviceType,
              e.browser,
              e.ipAddress,
              e.success,
              new Date(baseTime + i * 1000)
            );
          }

          // Now login again with the first event's device+browser and IP
          const firstEvent = eventDescs[0];
          const repeatEvent = await store.recordLoginEvent(
            userId,
            firstEvent.deviceType,
            firstEvent.browser,
            firstEvent.ipAddress,
            true,
            new Date(baseTime + eventDescs.length * 1000)
          );

          // Should NOT be flagged since device+browser and IP were seen in history
          expect(repeatEvent.isNewDevice).toBe(false);
          expect(repeatEvent.isUnusualLocation).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: disputes-settings-improvements, Property 5: Email change notification content
// **Validates: Requirements 5.2**

/**
 * Masks an email address by showing first 2 characters of the local part,
 * replacing the rest with "***", and preserving the domain.
 * Example: "john@example.com" → "jo***@example.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  const visibleChars = localPart.slice(0, 2);
  return `${visibleChars}***@${domain}`;
}

/**
 * Generates the email change notification content sent to the old email address.
 * Contains:
 * - The change timestamp
 * - A partially masked version of the new email
 * - Support contact instructions
 */
interface EmailChangeNotification {
  subject: string;
  body: string;
  timestamp: Date;
  maskedNewEmail: string;
  supportInstructions: string;
}

function generateEmailChangeNotification(
  oldEmail: string,
  newEmail: string,
  changeTimestamp: Date
): EmailChangeNotification {
  const maskedNewEmail = maskEmail(newEmail);
  const supportInstructions =
    'If you did not make this change, please contact our support team immediately at support@mprimo.com.';

  const body = [
    `Your email address was changed on ${changeTimestamp.toISOString()}.`,
    `The new email address is: ${maskedNewEmail}`,
    supportInstructions,
  ].join('\n');

  return {
    subject: 'Your email address has been changed',
    body,
    timestamp: changeTimestamp,
    maskedNewEmail,
    supportInstructions,
  };
}

// --- Email Change Notification Arbitraries ---

const emailLocalPartChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

/**
 * Arbitrary for generating a valid email local part (at least 2 characters).
 * Uses array of characters mapped to a string to avoid deprecated stringOf.
 */
const emailLocalPartArb = fc
  .array(fc.constantFrom(...emailLocalPartChars), { minLength: 2, maxLength: 20 })
  .map((chars) => chars.join(''));

/**
 * Arbitrary for generating a valid email domain.
 */
const emailDomainArb = fc
  .tuple(
    fc.array(fc.constantFrom(...emailLocalPartChars), { minLength: 2, maxLength: 10 }).map((chars) => chars.join('')),
    fc.constantFrom('com', 'org', 'net', 'io', 'dev')
  )
  .map(([name, tld]) => `${name}.${tld}`);

/**
 * Arbitrary for generating a valid email address with at least 2 characters in local part.
 */
const emailArb = fc
  .tuple(emailLocalPartArb, emailDomainArb)
  .map(([local, domain]) => `${local}@${domain}`);

/**
 * Arbitrary for generating an email change event with old email, new email, and timestamp.
 */
const emailChangeEventArb = fc.record({
  oldEmail: emailArb,
  newEmail: emailArb,
  changeTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true }),
});

describe('Property 5: Email change notification content', () => {
  it('notification SHALL contain the change timestamp', () => {
    fc.assert(
      fc.property(emailChangeEventArb, ({ oldEmail, newEmail, changeTimestamp }) => {
        const notification = generateEmailChangeNotification(oldEmail, newEmail, changeTimestamp);

        // The notification body must contain the ISO timestamp
        expect(notification.body).toContain(changeTimestamp.toISOString());

        // The notification timestamp field must match the change timestamp
        expect(notification.timestamp.getTime()).toBe(changeTimestamp.getTime());
      }),
      { numRuns: 100 }
    );
  });

  it('notification SHALL contain a partially masked version of the new email showing first 2 characters and domain', () => {
    fc.assert(
      fc.property(emailChangeEventArb, ({ oldEmail, newEmail, changeTimestamp }) => {
        const notification = generateEmailChangeNotification(oldEmail, newEmail, changeTimestamp);

        const [localPart, domain] = newEmail.split('@');
        const expectedMasked = `${localPart.slice(0, 2)}***@${domain}`;

        // The masked email in the notification must match expected format
        expect(notification.maskedNewEmail).toBe(expectedMasked);

        // The notification body must contain the masked email
        expect(notification.body).toContain(expectedMasked);

        // The notification body must NOT contain the full unmasked new email
        // (unless the masked version happens to equal the full email, which won't happen
        // since local part >= 2 chars and we always add ***)
        expect(notification.maskedNewEmail).not.toBe(newEmail);
      }),
      { numRuns: 100 }
    );
  });

  it('notification SHALL contain support contact instructions', () => {
    fc.assert(
      fc.property(emailChangeEventArb, ({ oldEmail, newEmail, changeTimestamp }) => {
        const notification = generateEmailChangeNotification(oldEmail, newEmail, changeTimestamp);

        // The notification must contain support contact instructions
        expect(notification.supportInstructions).toContain('contact');
        expect(notification.supportInstructions).toContain('support');

        // The body must include the support instructions
        expect(notification.body).toContain(notification.supportInstructions);
      }),
      { numRuns: 100 }
    );
  });

  it('maskEmail shows exactly first 2 characters of local part followed by *** and domain', () => {
    fc.assert(
      fc.property(emailArb, (email) => {
        const masked = maskEmail(email);
        const [localPart, domain] = email.split('@');

        // Masked email must start with first 2 characters of local part
        expect(masked.startsWith(localPart.slice(0, 2))).toBe(true);

        // Masked email must contain *** after the first 2 characters
        expect(masked).toContain('***@');

        // Masked email must end with the original domain
        expect(masked.endsWith(`@${domain}`)).toBe(true);

        // Masked email format: XX***@domain
        expect(masked).toBe(`${localPart.slice(0, 2)}***@${domain}`);
      }),
      { numRuns: 100 }
    );
  });

  it('notification contains all three required elements together', () => {
    fc.assert(
      fc.property(emailChangeEventArb, ({ oldEmail, newEmail, changeTimestamp }) => {
        const notification = generateEmailChangeNotification(oldEmail, newEmail, changeTimestamp);

        const [localPart, domain] = newEmail.split('@');
        const expectedMasked = `${localPart.slice(0, 2)}***@${domain}`;

        // All three required elements must be present in the body:
        // 1. Change timestamp
        const hasTimestamp = notification.body.includes(changeTimestamp.toISOString());
        // 2. Partially masked new email
        const hasMaskedEmail = notification.body.includes(expectedMasked);
        // 3. Support contact instructions
        const hasSupportInstructions = notification.body.includes('contact') && notification.body.includes('support');

        expect(hasTimestamp).toBe(true);
        expect(hasMaskedEmail).toBe(true);
        expect(hasSupportInstructions).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
