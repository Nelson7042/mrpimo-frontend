// Feature: disputes-settings-improvements, Property 14: Chat message pagination correctness
// **Validates: Requirements 12.3, 12.4**
// Feature: disputes-settings-improvements, Property 15: Chat rate limit enforcement
// **Validates: Requirements 13.1, 13.3**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// In-memory Chat Message Store (simulates MongoDB chat collection)
// ============================================================================

interface IChatMessage {
  id: string;
  disputeId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

interface PaginationMetadata {
  total: number;
  currentPage: number;
  hasMore: boolean;
}

interface PaginatedChatResponse {
  messages: IChatMessage[];
  metadata: PaginationMetadata;
}

/**
 * Simulated chat message store implementing pagination logic.
 * Messages are stored and retrieved in reverse chronological order
 * with page/limit-based pagination as specified in Requirements 12.3, 12.4.
 */
class InMemoryChatStore {
  private messages: IChatMessage[] = [];
  private idCounter = 0;

  /**
   * Adds a message to the store.
   */
  async addMessage(
    disputeId: string,
    userId: string,
    content: string,
    createdAt?: Date
  ): Promise<IChatMessage> {
    const message: IChatMessage = {
      id: `msg_${++this.idCounter}`,
      disputeId,
      userId,
      content,
      createdAt: createdAt ?? new Date(),
    };
    this.messages.push(message);
    return message;
  }

  /**
   * Retrieves paginated chat messages for a dispute in reverse chronological order.
   * Implements the pagination logic specified in the design:
   * - page P with limit L returns messages at indices [(P-1)*L, min(P*L, N))
   * - metadata reports total=N, currentPage=P, hasMore=(P*L < N)
   */
  async getMessages(
    disputeId: string,
    page: number,
    limit: number
  ): Promise<PaginatedChatResponse> {
    // Get all messages for this dispute sorted in reverse chronological order
    const disputeMessages = this.messages
      .filter((m) => m.disputeId === disputeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = disputeMessages.length;
    const skip = (page - 1) * limit;
    const messages = disputeMessages.slice(skip, skip + limit);

    return {
      messages,
      metadata: {
        total,
        currentPage: page,
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Returns total message count for a dispute.
   */
  async getMessageCount(disputeId: string): Promise<number> {
    return this.messages.filter((m) => m.disputeId === disputeId).length;
  }
}

// ============================================================================
// In-memory Rate Limiter (simulates Redis-based per-user per-chat rate limiting)
// ============================================================================

const RATE_LIMIT_MAX_MESSAGES = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until the window resets
}

/**
 * Simulated rate limiter using the Redis key pattern `chat_rate:{userId}:{chatId}`.
 * Implements per-user per-chat rate limiting:
 * - Max 10 messages within any 60-second window
 * - Rate limiting in one chat does not affect another chat
 */
class InMemoryRateLimiter {
  // Key: `${userId}:${chatId}`, Value: array of timestamps (message send times)
  private windows: Map<string, number[]> = new Map();

  /**
   * Checks if a message can be sent and records it if allowed.
   * Returns whether the message is allowed and retry info if not.
   */
  checkAndRecord(userId: string, chatId: string, now?: number): RateLimitResult {
    const currentTime = now ?? Date.now();
    const key = `${userId}:${chatId}`;
    const windowStart = currentTime - RATE_LIMIT_WINDOW_SECONDS * 1000;

    // Get existing timestamps for this user+chat, filter to current window
    let timestamps = this.windows.get(key) ?? [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
      // Rate limited — calculate when the oldest message in the window expires
      const oldestInWindow = Math.min(...timestamps);
      const retryAfter = Math.ceil(
        (oldestInWindow + RATE_LIMIT_WINDOW_SECONDS * 1000 - currentTime) / 1000
      );
      this.windows.set(key, timestamps);
      return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
    }

    // Allowed — record this message timestamp
    timestamps.push(currentTime);
    this.windows.set(key, timestamps);
    return { allowed: true };
  }

  /**
   * Returns the current message count in the window for a user+chat.
   */
  getCount(userId: string, chatId: string, now?: number): number {
    const currentTime = now ?? Date.now();
    const key = `${userId}:${chatId}`;
    const windowStart = currentTime - RATE_LIMIT_WINDOW_SECONDS * 1000;
    const timestamps = this.windows.get(key) ?? [];
    return timestamps.filter((t) => t > windowStart).length;
  }
}

// ============================================================================
// Arbitraries
// ============================================================================

/**
 * Arbitrary for generating a set of chat messages for a dispute.
 */
const chatMessageBatchArb = fc.record({
  disputeId: fc.uuid(),
  userId: fc.uuid(),
  messageCount: fc.integer({ min: 1, max: 100 }),
});

/**
 * Arbitrary for pagination parameters.
 */
const paginationParamsArb = fc.record({
  page: fc.integer({ min: 1, max: 20 }),
  limit: fc.integer({ min: 1, max: 50 }),
});

/**
 * Arbitrary for generating a dispute chat scenario with messages and pagination request.
 */
const chatPaginationScenarioArb = fc.record({
  disputeId: fc.uuid(),
  userId: fc.uuid(),
  messageCount: fc.integer({ min: 0, max: 100 }),
  page: fc.integer({ min: 1, max: 20 }),
  limit: fc.integer({ min: 1, max: 50 }),
});

/**
 * Arbitrary for rate limit testing — generates a user, chat, and number of messages to send.
 */
const rateLimitScenarioArb = fc.record({
  userId: fc.uuid(),
  chatId: fc.uuid(),
  messageCount: fc.integer({ min: 1, max: 20 }),
});

/**
 * Arbitrary for cross-chat isolation testing.
 */
const crossChatScenarioArb = fc.record({
  userId: fc.uuid(),
  chatId1: fc.uuid(),
  chatId2: fc.uuid(),
  messagesInChat1: fc.integer({ min: 0, max: 15 }),
  messagesInChat2: fc.integer({ min: 0, max: 15 }),
});

// ============================================================================
// Property 14: Chat message pagination correctness
// ============================================================================

describe('Property 14: Chat message pagination correctness', () => {
  it('requesting page P with limit L returns messages at indices [(P-1)*L, min(P*L, N)) in reverse chronological order', () => {
    fc.assert(
      fc.asyncProperty(chatPaginationScenarioArb, async ({ disputeId, userId, messageCount, page, limit }) => {
        const store = new InMemoryChatStore();

        // Add messages with incrementing timestamps
        const baseTime = Date.now();
        for (let i = 0; i < messageCount; i++) {
          await store.addMessage(
            disputeId,
            userId,
            `Message ${i}`,
            new Date(baseTime + i * 1000)
          );
        }

        const N = messageCount;
        const result = await store.getMessages(disputeId, page, limit);

        // Calculate expected slice indices
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(page * limit, N);
        const expectedCount = Math.max(0, endIndex - startIndex);

        // Verify correct number of messages returned
        expect(result.messages.length).toBe(expectedCount);

        // Verify reverse chronological order
        for (let i = 0; i < result.messages.length - 1; i++) {
          expect(result.messages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            result.messages[i + 1].createdAt.getTime()
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('metadata accurately reports total=N, currentPage=P, and hasMore=(P*L < N)', () => {
    fc.assert(
      fc.asyncProperty(chatPaginationScenarioArb, async ({ disputeId, userId, messageCount, page, limit }) => {
        const store = new InMemoryChatStore();

        // Add messages
        const baseTime = Date.now();
        for (let i = 0; i < messageCount; i++) {
          await store.addMessage(
            disputeId,
            userId,
            `Message ${i}`,
            new Date(baseTime + i * 1000)
          );
        }

        const N = messageCount;
        const result = await store.getMessages(disputeId, page, limit);

        // Verify metadata
        expect(result.metadata.total).toBe(N);
        expect(result.metadata.currentPage).toBe(page);
        expect(result.metadata.hasMore).toBe(page * limit < N);
      }),
      { numRuns: 100 }
    );
  });

  it('all pages together contain all messages without duplicates or gaps', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          disputeId: fc.uuid(),
          userId: fc.uuid(),
          messageCount: fc.integer({ min: 1, max: 50 }),
          limit: fc.integer({ min: 1, max: 20 }),
        }),
        async ({ disputeId, userId, messageCount, limit }) => {
          const store = new InMemoryChatStore();

          // Add messages
          const baseTime = Date.now();
          for (let i = 0; i < messageCount; i++) {
            await store.addMessage(
              disputeId,
              userId,
              `Message ${i}`,
              new Date(baseTime + i * 1000)
            );
          }

          // Fetch all pages
          const totalPages = Math.ceil(messageCount / limit);
          const allMessages: IChatMessage[] = [];

          for (let p = 1; p <= totalPages; p++) {
            const result = await store.getMessages(disputeId, p, limit);
            allMessages.push(...result.messages);
          }

          // All messages should be collected
          expect(allMessages.length).toBe(messageCount);

          // No duplicate IDs
          const ids = allMessages.map((m) => m.id);
          expect(new Set(ids).size).toBe(messageCount);

          // Entire collection should be in reverse chronological order
          for (let i = 0; i < allMessages.length - 1; i++) {
            expect(allMessages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              allMessages[i + 1].createdAt.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('requesting a page beyond available messages returns empty array with correct metadata', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          disputeId: fc.uuid(),
          userId: fc.uuid(),
          messageCount: fc.integer({ min: 1, max: 30 }),
          limit: fc.integer({ min: 1, max: 10 }),
        }),
        async ({ disputeId, userId, messageCount, limit }) => {
          const store = new InMemoryChatStore();

          // Add messages
          const baseTime = Date.now();
          for (let i = 0; i < messageCount; i++) {
            await store.addMessage(
              disputeId,
              userId,
              `Message ${i}`,
              new Date(baseTime + i * 1000)
            );
          }

          // Request a page that's beyond the available data
          const totalPages = Math.ceil(messageCount / limit);
          const beyondPage = totalPages + 1;

          const result = await store.getMessages(disputeId, beyondPage, limit);

          // Should return empty messages
          expect(result.messages.length).toBe(0);

          // Metadata should still be accurate
          expect(result.metadata.total).toBe(messageCount);
          expect(result.metadata.currentPage).toBe(beyondPage);
          expect(result.metadata.hasMore).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty chat returns zero messages with total=0 and hasMore=false', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        paginationParamsArb,
        async (disputeId, { page, limit }) => {
          const store = new InMemoryChatStore();

          const result = await store.getMessages(disputeId, page, limit);

          expect(result.messages.length).toBe(0);
          expect(result.metadata.total).toBe(0);
          expect(result.metadata.currentPage).toBe(page);
          expect(result.metadata.hasMore).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 15: Chat rate limit enforcement
// ============================================================================

describe('Property 15: Chat rate limit enforcement', () => {
  it('allows at most 10 messages within any 60-second window', () => {
    fc.assert(
      fc.property(rateLimitScenarioArb, ({ userId, chatId, messageCount }) => {
        const limiter = new InMemoryRateLimiter();
        const now = Date.now();

        let allowedCount = 0;
        let rejectedCount = 0;

        // Send all messages at the same time (within the same window)
        for (let i = 0; i < messageCount; i++) {
          const result = limiter.checkAndRecord(userId, chatId, now + i); // slight offset to avoid exact same timestamp
          if (result.allowed) {
            allowedCount++;
          } else {
            rejectedCount++;
          }
        }

        // At most 10 should be allowed
        expect(allowedCount).toBeLessThanOrEqual(RATE_LIMIT_MAX_MESSAGES);

        // If we sent more than 10, the excess should be rejected
        if (messageCount > RATE_LIMIT_MAX_MESSAGES) {
          expect(allowedCount).toBe(RATE_LIMIT_MAX_MESSAGES);
          expect(rejectedCount).toBe(messageCount - RATE_LIMIT_MAX_MESSAGES);
        } else {
          expect(allowedCount).toBe(messageCount);
          expect(rejectedCount).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('rate limiting in one chat does not affect message sending in a different chat', () => {
    fc.assert(
      fc.property(crossChatScenarioArb, ({ userId, chatId1, chatId2, messagesInChat1, messagesInChat2 }) => {
        // Ensure chat IDs are different
        if (chatId1 === chatId2) return;

        const limiter = new InMemoryRateLimiter();
        const now = Date.now();

        // Send messages in chat 1
        let chat1Allowed = 0;
        for (let i = 0; i < messagesInChat1; i++) {
          const result = limiter.checkAndRecord(userId, chatId1, now + i);
          if (result.allowed) chat1Allowed++;
        }

        // Send messages in chat 2
        let chat2Allowed = 0;
        for (let i = 0; i < messagesInChat2; i++) {
          const result = limiter.checkAndRecord(userId, chatId2, now + i);
          if (result.allowed) chat2Allowed++;
        }

        // Chat 2 allowance should be independent of chat 1
        const expectedChat2Allowed = Math.min(messagesInChat2, RATE_LIMIT_MAX_MESSAGES);
        expect(chat2Allowed).toBe(expectedChat2Allowed);

        // Chat 1 allowance should also be correct independently
        const expectedChat1Allowed = Math.min(messagesInChat1, RATE_LIMIT_MAX_MESSAGES);
        expect(chat1Allowed).toBe(expectedChat1Allowed);
      }),
      { numRuns: 100 }
    );
  });

  it('messages are allowed again after the 60-second window expires', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          chatId: fc.uuid(),
          additionalMessages: fc.integer({ min: 1, max: 10 }),
        }),
        ({ userId, chatId, additionalMessages }) => {
          const limiter = new InMemoryRateLimiter();
          const now = Date.now();

          // Fill up the rate limit window
          for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES; i++) {
            const result = limiter.checkAndRecord(userId, chatId, now + i);
            expect(result.allowed).toBe(true);
          }

          // Verify the next message is rejected
          const rejectedResult = limiter.checkAndRecord(userId, chatId, now + RATE_LIMIT_MAX_MESSAGES);
          expect(rejectedResult.allowed).toBe(false);

          // After 60 seconds, messages should be allowed again
          const afterWindow = now + RATE_LIMIT_WINDOW_SECONDS * 1000 + 1;
          for (let i = 0; i < additionalMessages; i++) {
            const result = limiter.checkAndRecord(userId, chatId, afterWindow + i);
            expect(result.allowed).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejected messages include a positive retryAfter value', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          chatId: fc.uuid(),
        }),
        ({ userId, chatId }) => {
          const limiter = new InMemoryRateLimiter();
          const now = Date.now();

          // Fill up the rate limit
          for (let i = 0; i < RATE_LIMIT_MAX_MESSAGES; i++) {
            limiter.checkAndRecord(userId, chatId, now + i * 100);
          }

          // The next message should be rejected with retryAfter
          const result = limiter.checkAndRecord(userId, chatId, now + RATE_LIMIT_MAX_MESSAGES * 100);
          expect(result.allowed).toBe(false);
          expect(result.retryAfter).toBeDefined();
          expect(result.retryAfter!).toBeGreaterThan(0);
          expect(result.retryAfter!).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_SECONDS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('different users in the same chat have independent rate limits', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId1: fc.uuid(),
          userId2: fc.uuid(),
          chatId: fc.uuid(),
          messagesUser1: fc.integer({ min: 1, max: 15 }),
          messagesUser2: fc.integer({ min: 1, max: 15 }),
        }),
        ({ userId1, userId2, chatId, messagesUser1, messagesUser2 }) => {
          // Ensure user IDs are different
          if (userId1 === userId2) return;

          const limiter = new InMemoryRateLimiter();
          const now = Date.now();

          // User 1 sends messages
          let user1Allowed = 0;
          for (let i = 0; i < messagesUser1; i++) {
            const result = limiter.checkAndRecord(userId1, chatId, now + i);
            if (result.allowed) user1Allowed++;
          }

          // User 2 sends messages
          let user2Allowed = 0;
          for (let i = 0; i < messagesUser2; i++) {
            const result = limiter.checkAndRecord(userId2, chatId, now + i);
            if (result.allowed) user2Allowed++;
          }

          // Each user's allowance should be independent
          expect(user1Allowed).toBe(Math.min(messagesUser1, RATE_LIMIT_MAX_MESSAGES));
          expect(user2Allowed).toBe(Math.min(messagesUser2, RATE_LIMIT_MAX_MESSAGES));
        }
      ),
      { numRuns: 100 }
    );
  });
});
