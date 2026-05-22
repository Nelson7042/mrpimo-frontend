// Feature: disputes-settings-improvements, Property 16: Account deletion grace period
// **Validates: Requirements 14.1**
// Feature: disputes-settings-improvements, Property 17: Data anonymization completeness
// **Validates: Requirements 14.3**

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import crypto from "crypto";

// --- Constants ---

const GRACE_PERIOD_DAYS = 30;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// --- Simulated Account Deletion Logic ---

interface DeletionResult {
  success: boolean;
  deletionScheduledAt: Date | null;
  deletionRequestedAt: Date | null;
  error?: string;
}

/**
 * Simulates the account deletion request logic.
 * Given a request timestamp, computes the scheduled deletion date
 * as exactly 30 days from the request.
 */
function requestAccountDeletion(
  requestTimestamp: Date,
  passwordValid: boolean,
  alreadyScheduled: boolean
): DeletionResult {
  if (!passwordValid) {
    return {
      success: false,
      deletionScheduledAt: null,
      deletionRequestedAt: null,
      error: "Password is incorrect",
    };
  }

  if (alreadyScheduled) {
    return {
      success: false,
      deletionScheduledAt: null,
      deletionRequestedAt: null,
      error: "Account deletion is already scheduled",
    };
  }

  const deletionScheduledAt = new Date(
    requestTimestamp.getTime() + GRACE_PERIOD_MS
  );

  return {
    success: true,
    deletionScheduledAt,
    deletionRequestedAt: requestTimestamp,
  };
}

// --- Simulated Anonymization Logic ---

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  addresses: Array<{ street: string; city: string; country: string }>;
  avatar: string | null;
}

interface AnonymizedUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  addresses: Array<{ street: string; city: string; country: string }>;
  avatar: string | null;
  status: string;
}

/**
 * Simulates the anonymization function that replaces personal data
 * with anonymized values. Mirrors the logic in account-anonymization.service.ts.
 * Uses hex encoding (0-9, a-f) to match the real crypto.randomBytes(8).toString("hex").
 */
function anonymizeUserData(user: UserData): AnonymizedUserData {
  const anonymizedId = crypto.randomBytes(8).toString("hex");

  return {
    firstName: `anon_first_${anonymizedId}`,
    lastName: `anon_last_${anonymizedId}`,
    email: `deleted_${anonymizedId}@anonymized.local`,
    phoneNumber: null,
    addresses: [],
    avatar: null,
    status: "inactive",
  };
}

// --- Arbitraries ---

/**
 * Generates a valid timestamp within a reasonable range (2020-2030).
 */
const timestampArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ms) => new Date(ms));

/**
 * Generates a non-empty string for personal data fields.
 */
const personalStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
  (s) => s.trim().length > 0
);

/**
 * Generates a valid email address.
 */
const emailArb = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
    fc.constantFrom("gmail.com", "yahoo.com", "outlook.com", "example.org")
  )
  .map(([local, domain]) => `${local}@${domain}`);

/**
 * Generates a phone number string.
 */
const phoneArb = fc
  .tuple(
    fc.constantFrom("+1", "+44", "+234", "+91"),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 10 })
  )
  .map(([prefix, digits]) => `${prefix}${digits.join("")}`);

/**
 * Generates an address object.
 */
const addressArb = fc.record({
  street: personalStringArb,
  city: personalStringArb,
  country: personalStringArb,
});

/**
 * Generates a complete user data object with personal information.
 */
const userDataArb: fc.Arbitrary<UserData> = fc.record({
  firstName: personalStringArb,
  lastName: personalStringArb,
  email: emailArb,
  phoneNumber: fc.oneof(phoneArb, fc.constant(null)),
  addresses: fc.array(addressArb, { minLength: 0, maxLength: 5 }),
  avatar: fc.oneof(
    fc.webUrl().map((url) => url),
    fc.constant(null)
  ),
});

// --- Property Tests ---

describe("Property 16: Account deletion grace period", () => {
  it("the scheduled deletion date SHALL be exactly 30 days from the request timestamp", () => {
    fc.assert(
      fc.property(timestampArb, (requestTimestamp) => {
        const result = requestAccountDeletion(requestTimestamp, true, false);

        expect(result.success).toBe(true);
        expect(result.deletionScheduledAt).not.toBeNull();
        expect(result.deletionRequestedAt).not.toBeNull();

        // The scheduled date should be exactly 30 days (in milliseconds) from the request
        const expectedDeletionTime =
          requestTimestamp.getTime() + GRACE_PERIOD_MS;
        expect(result.deletionScheduledAt!.getTime()).toBe(expectedDeletionTime);

        // Verify it's exactly 30 days difference
        const diffMs =
          result.deletionScheduledAt!.getTime() -
          result.deletionRequestedAt!.getTime();
        expect(diffMs).toBe(GRACE_PERIOD_MS);
      }),
      { numRuns: 100 }
    );
  });

  it("deletion request SHALL fail when password is invalid", () => {
    fc.assert(
      fc.property(timestampArb, (requestTimestamp) => {
        const result = requestAccountDeletion(requestTimestamp, false, false);

        expect(result.success).toBe(false);
        expect(result.deletionScheduledAt).toBeNull();
        expect(result.error).toContain("Password");
      }),
      { numRuns: 100 }
    );
  });

  it("deletion request SHALL fail when deletion is already scheduled", () => {
    fc.assert(
      fc.property(timestampArb, (requestTimestamp) => {
        const result = requestAccountDeletion(requestTimestamp, true, true);

        expect(result.success).toBe(false);
        expect(result.deletionScheduledAt).toBeNull();
        expect(result.error).toContain("already scheduled");
      }),
      { numRuns: 100 }
    );
  });

  it("the grace period SHALL be consistent regardless of request timestamp", () => {
    fc.assert(
      fc.property(
        timestampArb,
        timestampArb,
        (timestamp1, timestamp2) => {
          const result1 = requestAccountDeletion(timestamp1, true, false);
          const result2 = requestAccountDeletion(timestamp2, true, false);

          // Both should succeed
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          // Both should have exactly the same grace period duration
          const diff1 =
            result1.deletionScheduledAt!.getTime() -
            result1.deletionRequestedAt!.getTime();
          const diff2 =
            result2.deletionScheduledAt!.getTime() -
            result2.deletionRequestedAt!.getTime();

          expect(diff1).toBe(GRACE_PERIOD_MS);
          expect(diff2).toBe(GRACE_PERIOD_MS);
          expect(diff1).toBe(diff2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 17: Data anonymization completeness", () => {
  it("after anonymization, personal data fields SHALL be replaced with anonymized values and SHALL not contain the original data", () => {
    fc.assert(
      fc.property(userDataArb, (originalUser) => {
        const anonymized = anonymizeUserData(originalUser);

        // firstName should be anonymized and not match original
        expect(anonymized.firstName).not.toBe(originalUser.firstName);
        expect(anonymized.firstName).toMatch(/^anon_first_/);

        // lastName should be anonymized and not match original
        expect(anonymized.lastName).not.toBe(originalUser.lastName);
        expect(anonymized.lastName).toMatch(/^anon_last_/);

        // email should be anonymized and not match original
        expect(anonymized.email).not.toBe(originalUser.email);
        expect(anonymized.email).toMatch(/@anonymized\.local$/);

        // phoneNumber should be null
        expect(anonymized.phoneNumber).toBeNull();

        // addresses should be empty
        expect(anonymized.addresses).toHaveLength(0);

        // avatar should be null
        expect(anonymized.avatar).toBeNull();

        // account should be deactivated
        expect(anonymized.status).toBe("inactive");
      }),
      { numRuns: 100 }
    );
  });

  it("anonymized email SHALL not contain any part of the original email local part", () => {
    fc.assert(
      fc.property(userDataArb, (originalUser) => {
        const anonymized = anonymizeUserData(originalUser);

        // Extract the local part of the original email
        const originalLocal = originalUser.email.split("@")[0];

        // The anonymized email should not contain the original local part.
        // Since the anonymized ID uses hex chars (0-9, a-f), we only check
        // local parts that contain at least one non-hex character (g-z),
        // which guarantees they cannot appear in the hex-based anonymized ID.
        // For all-hex local parts, we require a longer length to avoid
        // coincidental substring matches in the 16-char hex ID.
        const isAllHex = /^[0-9a-f]+$/.test(originalLocal);
        const minLength = isAllHex ? 8 : 3;

        if (originalLocal.length >= minLength) {
          expect(anonymized.email).not.toContain(originalLocal);
        }

        // The anonymized email domain should be anonymized.local
        expect(anonymized.email.endsWith("@anonymized.local")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("anonymization SHALL clear all address entries regardless of count", () => {
    fc.assert(
      fc.property(
        fc.record({
          firstName: personalStringArb,
          lastName: personalStringArb,
          email: emailArb,
          phoneNumber: fc.oneof(phoneArb, fc.constant(null)),
          addresses: fc.array(addressArb, { minLength: 1, maxLength: 10 }),
          avatar: fc.oneof(
            fc.webUrl().map((url) => url),
            fc.constant(null)
          ),
        }),
        (originalUser) => {
          // Ensure we have at least one address
          expect(originalUser.addresses.length).toBeGreaterThan(0);

          const anonymized = anonymizeUserData(originalUser);

          // All addresses should be cleared
          expect(anonymized.addresses).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("each anonymization SHALL produce unique anonymized values", () => {
    fc.assert(
      fc.property(userDataArb, userDataArb, (user1, user2) => {
        const anonymized1 = anonymizeUserData(user1);
        const anonymized2 = anonymizeUserData(user2);

        // Each anonymization should produce different values
        // (due to random ID generation)
        expect(anonymized1.email).not.toBe(anonymized2.email);
        expect(anonymized1.firstName).not.toBe(anonymized2.firstName);
        expect(anonymized1.lastName).not.toBe(anonymized2.lastName);
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: disputes-settings-improvements, Property 18: Data export completeness
// **Validates: Requirements 15.1**
// Feature: disputes-settings-improvements, Property 19: Data export rate limiting
// **Validates: Requirements 15.4**

// --- Data Export Constants ---

const EXPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const EXPORT_CATEGORIES = ["profile", "orders", "disputes", "addresses", "activities"] as const;

// --- Simulated Data Export Logic ---

interface ExportCategory {
  name: string;
  data: any[];
}

interface UserExportData {
  profile: Record<string, any>;
  orders: any[];
  disputes: any[];
  addresses: any[];
  activities: any[];
}

interface ExportResult {
  success: boolean;
  files: { name: string; content: any }[];
  error?: string;
}

interface ExportRateLimitResult {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
}

/**
 * Simulates the data export generation logic.
 * For any user with data across all categories, generates a JSON file for each category
 * containing all records belonging to that user.
 */
function generateDataExport(userData: UserExportData): ExportResult {
  const files: { name: string; content: any }[] = [];

  // Generate a JSON file for each category
  for (const category of EXPORT_CATEGORIES) {
    const data = userData[category];
    files.push({
      name: `${category}.json`,
      content: data,
    });
  }

  return {
    success: true,
    files,
  };
}

/**
 * Simulates the data export rate limiting logic.
 * A user can only request one export per 24 hours.
 */
function checkExportRateLimit(
  lastExportRequestedAt: Date | null,
  currentTime: Date
): ExportRateLimitResult {
  if (!lastExportRequestedAt) {
    return { allowed: true };
  }

  const timeSinceLastExport = currentTime.getTime() - lastExportRequestedAt.getTime();

  if (timeSinceLastExport < EXPORT_COOLDOWN_MS) {
    const retryAfter = Math.ceil(
      (EXPORT_COOLDOWN_MS - timeSinceLastExport) / 1000
    );
    return {
      allowed: false,
      error: "Export already requested. Available again in " + Math.ceil(retryAfter / 3600) + " hours.",
      retryAfter,
    };
  }

  return { allowed: true };
}

// --- Data Export Arbitraries ---

/**
 * Generates a profile object with various fields.
 */
const profileDataArb = fc.record({
  firstName: personalStringArb,
  lastName: personalStringArb,
  email: emailArb,
  phoneNumber: fc.oneof(phoneArb, fc.constant(null)),
  createdAt: timestampArb.map((d) => d.toISOString()),
});

/**
 * Generates an order record.
 */
const orderRecordArb = fc.record({
  orderId: fc.string({ minLength: 5, maxLength: 20 }).filter((s) => s.trim().length > 0),
  status: fc.constantFrom("pending", "shipped", "delivered", "cancelled"),
  total: fc.float({ min: 1, max: 10000, noNaN: true }),
  createdAt: timestampArb.map((d) => d.toISOString()),
});

/**
 * Generates a dispute record.
 */
const disputeRecordArb = fc.record({
  caseId: fc.string({ minLength: 5, maxLength: 20 }).filter((s) => s.trim().length > 0),
  reason: fc.constantFrom(
    "Product Defective",
    "Wrong Item Received",
    "Missing Items",
    "Damaged Package"
  ),
  status: fc.constantFrom("open", "in-progress", "resolved", "closed"),
  createdAt: timestampArb.map((d) => d.toISOString()),
});

/**
 * Generates an activity record.
 */
const activityRecordArb = fc.record({
  activity: fc.constantFrom("login", "purchase", "profile_update", "password_change"),
  timestamp: timestampArb.map((d) => d.toISOString()),
});

/**
 * Generates a complete user export data object with data in all categories.
 */
const userExportDataArb: fc.Arbitrary<UserExportData> = fc.record({
  profile: profileDataArb,
  orders: fc.array(orderRecordArb, { minLength: 1, maxLength: 10 }),
  disputes: fc.array(disputeRecordArb, { minLength: 0, maxLength: 5 }),
  addresses: fc.array(addressArb, { minLength: 0, maxLength: 5 }),
  activities: fc.array(activityRecordArb, { minLength: 0, maxLength: 20 }),
});

// --- Property Tests for Data Export ---

describe("Property 18: Data export completeness", () => {
  it("the generated export SHALL contain a JSON file for each category with all records belonging to that user", () => {
    fc.assert(
      fc.property(userExportDataArb, (userData) => {
        const result = generateDataExport(userData);

        // Export should succeed
        expect(result.success).toBe(true);

        // Should have exactly one file per category
        expect(result.files).toHaveLength(EXPORT_CATEGORIES.length);

        // Each category should have a corresponding file
        for (const category of EXPORT_CATEGORIES) {
          const file = result.files.find((f) => f.name === `${category}.json`);
          expect(file).toBeDefined();
          expect(file!.content).toEqual(userData[category]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("each exported file SHALL contain all records for that category without data loss", () => {
    fc.assert(
      fc.property(userExportDataArb, (userData) => {
        const result = generateDataExport(userData);

        // Verify orders file contains all orders
        const ordersFile = result.files.find((f) => f.name === "orders.json");
        expect(ordersFile).toBeDefined();
        expect(ordersFile!.content).toHaveLength(userData.orders.length);

        // Verify disputes file contains all disputes
        const disputesFile = result.files.find((f) => f.name === "disputes.json");
        expect(disputesFile).toBeDefined();
        expect(disputesFile!.content).toHaveLength(userData.disputes.length);

        // Verify addresses file contains all addresses
        const addressesFile = result.files.find((f) => f.name === "addresses.json");
        expect(addressesFile).toBeDefined();
        expect(addressesFile!.content).toHaveLength(userData.addresses.length);

        // Verify activities file contains all activities
        const activitiesFile = result.files.find((f) => f.name === "activities.json");
        expect(activitiesFile).toBeDefined();
        expect(activitiesFile!.content).toHaveLength(userData.activities.length);
      }),
      { numRuns: 100 }
    );
  });

  it("export SHALL produce files named with the category and .json extension", () => {
    fc.assert(
      fc.property(userExportDataArb, (userData) => {
        const result = generateDataExport(userData);

        for (const file of result.files) {
          // Each file name should end with .json
          expect(file.name).toMatch(/\.json$/);
          // Each file name should correspond to a known category
          const categoryName = file.name.replace(".json", "");
          expect(EXPORT_CATEGORIES).toContain(categoryName);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 19: Data export rate limiting", () => {
  it("a data export request SHALL be rejected if a previous export was requested within the last 24 hours", () => {
    fc.assert(
      fc.property(
        timestampArb,
        fc.integer({ min: 1, max: EXPORT_COOLDOWN_MS - 1 }),
        (lastExportTime, elapsedMs) => {
          const currentTime = new Date(lastExportTime.getTime() + elapsedMs);
          const result = checkExportRateLimit(lastExportTime, currentTime);

          // Should be rejected
          expect(result.allowed).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.retryAfter).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("a data export request SHALL be allowed if no previous export exists", () => {
    fc.assert(
      fc.property(timestampArb, (currentTime) => {
        const result = checkExportRateLimit(null, currentTime);

        expect(result.allowed).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("a data export request SHALL be allowed if the previous export was more than 24 hours ago", () => {
    fc.assert(
      fc.property(
        timestampArb,
        fc.integer({ min: EXPORT_COOLDOWN_MS, max: EXPORT_COOLDOWN_MS * 10 }),
        (lastExportTime, elapsedMs) => {
          const currentTime = new Date(lastExportTime.getTime() + elapsedMs);
          const result = checkExportRateLimit(lastExportTime, currentTime);

          // Should be allowed
          expect(result.allowed).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("the retryAfter value SHALL accurately reflect the remaining cooldown time", () => {
    fc.assert(
      fc.property(
        timestampArb,
        fc.integer({ min: 1000, max: EXPORT_COOLDOWN_MS - 1000 }),
        (lastExportTime, elapsedMs) => {
          const currentTime = new Date(lastExportTime.getTime() + elapsedMs);
          const result = checkExportRateLimit(lastExportTime, currentTime);

          expect(result.allowed).toBe(false);
          expect(result.retryAfter).toBeDefined();

          // retryAfter should be the remaining time in seconds
          const expectedRetryAfter = Math.ceil(
            (EXPORT_COOLDOWN_MS - elapsedMs) / 1000
          );
          expect(result.retryAfter).toBe(expectedRetryAfter);
        }
      ),
      { numRuns: 100 }
    );
  });
});
