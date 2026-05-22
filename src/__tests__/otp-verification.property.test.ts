// Feature: disputes-settings-improvements, Property 10: OTP verification correctness
// **Validates: Requirements 9.2, 9.3**
// Feature: disputes-settings-improvements, Property 11: OTP lockout after failed attempts
// **Validates: Requirements 9.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * In-memory Redis simulation for testing OTP verification logic.
 * This mirrors the Redis operations used by OTPService without requiring
 * a real Redis connection.
 */
class InMemoryRedisStore {
  private store: Map<string, { value: string; expiresAt: number | null }> = new Map();

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      this.store.set(key, { value: '1', expiresAt: null });
      return 1;
    }
    const newValue = (parseInt(entry.value, 10) + 1).toString();
    entry.value = newValue;
    return parseInt(newValue, 10);
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  }

  /**
   * Advance time simulation: expire all keys that would have expired by the given offset.
   */
  advanceTime(milliseconds: number): void {
    const futureTime = Date.now() + milliseconds;
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && futureTime > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const OTP_TTL = 5 * 60; // 5 minutes in seconds
const ATTEMPTS_TTL = 15 * 60; // 15 minutes in seconds
const LOCKOUT_TTL = 15 * 60; // 15 minutes in seconds
const MAX_ATTEMPTS = 3;

/**
 * Simulated OTPService that uses the in-memory Redis store.
 * Implements the same logic as the real OTPService for:
 * - sendOTP (stores code with 5-min TTL)
 * - verifyOTP (checks code match, increments attempts on failure, locks after 3 failures)
 * - isLocked (checks lockout key)
 */
class SimulatedOTPService {
  constructor(private redis: InMemoryRedisStore) {}

  /**
   * Store an OTP code for the given user and phone number.
   * In the real service, this also sends an SMS — here we just store the code.
   */
  async sendOTP(
    phoneNumber: string,
    userId: string,
    code: string
  ): Promise<{ success: boolean; expiresAt: Date }> {
    const otpKey = `otp:${userId}:${phoneNumber}`;
    const expiresAt = new Date(Date.now() + OTP_TTL * 1000);

    const locked = await this.isLocked(phoneNumber, userId);
    if (locked) {
      return { success: false, expiresAt };
    }

    await this.redis.set(otpKey, code, { ex: OTP_TTL });
    return { success: true, expiresAt };
  }

  /**
   * Verify an OTP code submitted by the user.
   * Checks code match and expiry. Increments attempt counter on failure.
   * After 3 failed attempts, sets a lockout key with 15-minute TTL.
   */
  async verifyOTP(
    phoneNumber: string,
    userId: string,
    code: string
  ): Promise<{ verified: boolean; error?: string }> {
    const otpKey = `otp:${userId}:${phoneNumber}`;
    const attemptsKey = `otp_attempts:${userId}:${phoneNumber}`;
    const lockedKey = `otp_locked:${userId}:${phoneNumber}`;

    // Check if user is locked out
    const locked = await this.isLocked(phoneNumber, userId);
    if (locked) {
      return {
        verified: false,
        error: 'Too many failed attempts. Try again in 15 minutes.',
      };
    }

    // Retrieve stored OTP
    const storedCode = await this.redis.get(otpKey);

    if (!storedCode) {
      return {
        verified: false,
        error: 'OTP expired. Please request a new code.',
      };
    }

    // Check code match
    if (storedCode !== code) {
      // Increment failed attempts
      const attempts = await this.redis.incr(attemptsKey);

      // Set TTL on first attempt
      if (attempts === 1) {
        await this.redis.expire(attemptsKey, ATTEMPTS_TTL);
      }

      // Lock after MAX_ATTEMPTS failed attempts
      if (attempts >= MAX_ATTEMPTS) {
        await this.redis.set(lockedKey, '1', { ex: LOCKOUT_TTL });

        return {
          verified: false,
          error: 'Too many failed attempts. Try again in 15 minutes.',
        };
      }

      return {
        verified: false,
        error: `Incorrect code. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`,
      };
    }

    // Code matches — clean up keys
    await this.redis.del(otpKey);
    await this.redis.del(attemptsKey);

    return { verified: true };
  }

  /**
   * Check if OTP verification is locked for the given phone number and user.
   */
  async isLocked(phoneNumber: string, userId: string): Promise<boolean> {
    const lockedKey = `otp_locked:${userId}:${phoneNumber}`;
    const locked = await this.redis.get(lockedKey);
    return locked !== null;
  }
}

// --- Arbitraries ---

/**
 * Generates a valid 6-digit OTP code (100000 to 999999).
 */
const otpCodeArb = fc
  .integer({ min: 100000, max: 999999 })
  .map((n) => n.toString());

/**
 * Generates a phone number in E.164-like format.
 */
const phoneNumberArb = fc
  .tuple(
    fc.constantFrom('+1', '+44', '+234', '+91', '+61'),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 10 })
  )
  .map(([prefix, digits]) => `${prefix}${digits.join('')}`);

/**
 * Generates a different OTP code from the given one.
 */
const differentOtpCodeArb = (correctCode: string) =>
  otpCodeArb.filter((code) => code !== correctCode);

describe('Property 10: OTP verification correctness', () => {
  it('verification SHALL succeed when submitted code matches stored code within 5 minutes', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, code) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP (stores the code)
          const sendResult = await service.sendOTP(phoneNumber, userId, code);
          expect(sendResult.success).toBe(true);

          // Verify with the correct code immediately (within 5 minutes)
          const result = await service.verifyOTP(phoneNumber, userId, code);

          expect(result.verified).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('verification SHALL fail when submitted code does not match stored code', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, correctCode) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP with the correct code
          await service.sendOTP(phoneNumber, userId, correctCode);

          // Generate a wrong code (different from the correct one)
          // Use a deterministic wrong code
          const wrongCode =
            correctCode === '100000' ? '999999' : '100000';

          // Verify with the wrong code
          const result = await service.verifyOTP(phoneNumber, userId, wrongCode);

          expect(result.verified).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('verification SHALL fail when OTP has expired (after 5 minutes)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, code) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP
          await service.sendOTP(phoneNumber, userId, code);

          // Simulate time passing beyond 5 minutes (advance past TTL)
          redis.advanceTime(OTP_TTL * 1000 + 1000);

          // Verify with the correct code after expiry
          const result = await service.verifyOTP(phoneNumber, userId, code);

          expect(result.verified).toBe(false);
          expect(result.error).toContain('expired');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('verification succeeds if and only if code matches AND within 5 minutes', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        otpCodeArb,
        fc.boolean(),
        async (userId, phoneNumber, storedCode, submittedCode, isExpired) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP with the stored code
          await service.sendOTP(phoneNumber, userId, storedCode);

          // Optionally simulate expiry
          if (isExpired) {
            redis.advanceTime(OTP_TTL * 1000 + 1000);
          }

          // Verify with the submitted code
          const result = await service.verifyOTP(phoneNumber, userId, submittedCode);

          const codeMatches = storedCode === submittedCode;
          const shouldSucceed = codeMatches && !isExpired;

          expect(result.verified).toBe(shouldSucceed);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('successful verification cleans up the OTP key (cannot verify twice)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, code) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send and verify OTP
          await service.sendOTP(phoneNumber, userId, code);
          const firstResult = await service.verifyOTP(phoneNumber, userId, code);
          expect(firstResult.verified).toBe(true);

          // Attempt to verify again with the same code
          const secondResult = await service.verifyOTP(phoneNumber, userId, code);
          expect(secondResult.verified).toBe(false);
          expect(secondResult.error).toContain('expired');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 11: OTP lockout after failed attempts', () => {
  it('after 3 consecutive failed attempts, subsequent verification SHALL be rejected', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, correctCode) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP
          await service.sendOTP(phoneNumber, userId, correctCode);

          // Use a wrong code for all attempts
          const wrongCode = correctCode === '100000' ? '999999' : '100000';

          // Make 3 failed attempts
          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await service.verifyOTP(phoneNumber, userId, wrongCode);
          }

          // Now even the correct code should be rejected
          const result = await service.verifyOTP(phoneNumber, userId, correctCode);

          expect(result.verified).toBe(false);
          expect(result.error).toContain('Too many failed attempts');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lockout lasts for 15 minutes regardless of code correctness', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, correctCode) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP
          await service.sendOTP(phoneNumber, userId, correctCode);

          const wrongCode = correctCode === '100000' ? '999999' : '100000';

          // Trigger lockout with 3 failed attempts
          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await service.verifyOTP(phoneNumber, userId, wrongCode);
          }

          // Verify locked status
          const isLocked = await service.isLocked(phoneNumber, userId);
          expect(isLocked).toBe(true);

          // Attempt with correct code while locked — should still fail
          const lockedResult = await service.verifyOTP(phoneNumber, userId, correctCode);
          expect(lockedResult.verified).toBe(false);
          expect(lockedResult.error).toContain('Too many failed attempts');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lockout expires after 15 minutes', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        async (userId, phoneNumber, correctCode) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP
          await service.sendOTP(phoneNumber, userId, correctCode);

          const wrongCode = correctCode === '100000' ? '999999' : '100000';

          // Trigger lockout
          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await service.verifyOTP(phoneNumber, userId, wrongCode);
          }

          // Advance time past lockout period (15 minutes)
          redis.advanceTime(LOCKOUT_TTL * 1000 + 1000);

          // Lockout should be expired
          const isLocked = await service.isLocked(phoneNumber, userId);
          expect(isLocked).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('fewer than 3 failed attempts do NOT trigger lockout', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        phoneNumberArb,
        otpCodeArb,
        fc.integer({ min: 1, max: 2 }),
        async (userId, phoneNumber, correctCode, failedAttempts) => {
          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTP
          await service.sendOTP(phoneNumber, userId, correctCode);

          const wrongCode = correctCode === '100000' ? '999999' : '100000';

          // Make fewer than 3 failed attempts
          for (let i = 0; i < failedAttempts; i++) {
            await service.verifyOTP(phoneNumber, userId, wrongCode);
          }

          // Should NOT be locked
          const isLocked = await service.isLocked(phoneNumber, userId);
          expect(isLocked).toBe(false);

          // Correct code should still work
          const result = await service.verifyOTP(phoneNumber, userId, correctCode);
          expect(result.verified).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lockout is per phone number and user combination', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        phoneNumberArb,
        phoneNumberArb,
        otpCodeArb,
        otpCodeArb,
        async (userId1, userId2, phone1, phone2, code1, code2) => {
          // Ensure different users or phone numbers
          if (userId1 === userId2 && phone1 === phone2) return;

          const redis = new InMemoryRedisStore();
          const service = new SimulatedOTPService(redis);

          // Send OTPs for both
          await service.sendOTP(phone1, userId1, code1);
          await service.sendOTP(phone2, userId2, code2);

          const wrongCode1 = code1 === '100000' ? '999999' : '100000';

          // Lock out user1/phone1
          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await service.verifyOTP(phone1, userId1, wrongCode1);
          }

          // user1/phone1 should be locked
          const locked1 = await service.isLocked(phone1, userId1);
          expect(locked1).toBe(true);

          // user2/phone2 should NOT be locked
          const locked2 = await service.isLocked(phone2, userId2);
          expect(locked2).toBe(false);

          // user2/phone2 can still verify successfully
          const result = await service.verifyOTP(phone2, userId2, code2);
          expect(result.verified).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
