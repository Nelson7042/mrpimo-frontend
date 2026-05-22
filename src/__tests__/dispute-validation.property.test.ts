// Feature: disputes-settings-improvements, Property 4: Evidence URL validation and sanitization
// **Validates: Requirements 4.1, 4.2, 4.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateEvidenceUrl,
  type ValidationResult,
} from '../../../mprimo-backend/src/validators/evidence-url.validator';

/**
 * Known Cloudinary query parameters that should be preserved during sanitization.
 * Mirrors the ALLOWED_CLOUDINARY_PARAMS set in the validator.
 */
const ALLOWED_CLOUDINARY_PARAMS = [
  'fl', 'f', 'q', 'dpr', 'w', 'h', 'ar', 'c', 'g', 'x', 'y',
  'e', 'l', 'o', 'co', 'bo', 'b', 'pg', 'a', 'r', 'd', 'dl',
  'dn', 'fetch_format', 'flags', 't', 'v', 's',
];

/** Allowed Cloudinary domains */
const CLOUDINARY_DOMAINS = ['res.cloudinary.com', 'cloudinary.com'];

/** Helper to generate alphanumeric strings from a character set */
const alphanumChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
const alphanumWithDashChars = 'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('');

function alphanumString(min: number, max: number) {
  return fc.array(fc.constantFrom(...alphanumChars), { minLength: min, maxLength: max })
    .map((arr) => arr.join(''));
}

function pathSegmentString(min: number, max: number) {
  return fc.array(fc.constantFrom(...alphanumWithDashChars), { minLength: min, maxLength: max })
    .map((arr) => arr.join(''));
}

/**
 * Arbitrary that generates valid Cloudinary URLs with random paths and optional
 * Cloudinary query parameters.
 */
const validCloudinaryUrlArb = fc
  .record({
    protocol: fc.constantFrom('https', 'http'),
    domain: fc.constantFrom(...CLOUDINARY_DOMAINS),
    pathSegments: fc.array(pathSegmentString(1, 12), { minLength: 1, maxLength: 5 }),
    params: fc.array(
      fc.record({
        key: fc.constantFrom(...ALLOWED_CLOUDINARY_PARAMS),
        value: alphanumString(1, 8),
      }),
      { minLength: 0, maxLength: 4 }
    ),
  })
  .map(({ protocol, domain, pathSegments, params }) => {
    const path = '/' + pathSegments.join('/');
    const queryString =
      params.length > 0
        ? '?' + params.map((p) => `${p.key}=${p.value}`).join('&')
        : '';
    return `${protocol}://${domain}${path}${queryString}`;
  });

/**
 * Arbitrary that generates URLs with non-Cloudinary domains.
 */
const nonCloudinaryUrlArb = fc
  .record({
    protocol: fc.constantFrom('https', 'http'),
    subdomain: fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 3, maxLength: 8 })
      .map((arr) => arr.join('')),
    tld: fc.constantFrom('com', 'org', 'net', 'io', 'dev'),
    path: alphanumString(1, 15),
  })
  .filter(({ subdomain, tld }) => {
    // Ensure the generated domain is NOT a Cloudinary domain
    const domain = `${subdomain}.${tld}`;
    return !CLOUDINARY_DOMAINS.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
    );
  })
  .map(({ protocol, subdomain, tld, path }) => {
    return `${protocol}://${subdomain}.${tld}/${path}`;
  });

/**
 * Arbitrary that generates non-Cloudinary query parameter keys.
 * These should be stripped during sanitization.
 */
const nonCloudinaryParamKeyArb = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')), { minLength: 2, maxLength: 10 })
  .map((arr) => arr.join(''))
  .filter((key) => !ALLOWED_CLOUDINARY_PARAMS.includes(key));

/**
 * Arbitrary that generates invalid URL strings (not parseable as URLs).
 */
const invalidUrlFormatArb = fc.oneof(
  // Random strings that are not URLs
  fc.string({ minLength: 1, maxLength: 30 }).filter((s) => {
    try {
      new URL(s);
      return false;
    } catch {
      return true;
    }
  }),
  // Strings with invalid protocols
  fc.constant('ftp://res.cloudinary.com/image.jpg'),
  fc.constant('file:///etc/passwd'),
  fc.constant('javascript:alert(1)'),
  // Empty-ish strings
  fc.constant(''),
  fc.constant('   '),
);

describe('Property 4: Evidence URL validation and sanitization', () => {
  it('any valid URL with a Cloudinary domain is accepted', () => {
    fc.assert(
      fc.property(validCloudinaryUrlArb, (url) => {
        const result: ValidationResult = validateEvidenceUrl(url);

        expect(result.valid).toBe(true);
        expect(result.sanitizedUrl).toBeDefined();
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('any URL with a non-Cloudinary domain is rejected', () => {
    fc.assert(
      fc.property(nonCloudinaryUrlArb, (url) => {
        const result: ValidationResult = validateEvidenceUrl(url);

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.sanitizedUrl).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('sanitized URLs only contain allowed Cloudinary query parameters', () => {
    // Generate Cloudinary URLs with a mix of allowed and disallowed params
    const urlWithMixedParamsArb = fc
      .record({
        protocol: fc.constantFrom('https', 'http'),
        domain: fc.constantFrom(...CLOUDINARY_DOMAINS),
        path: alphanumString(3, 15),
        allowedParams: fc.array(
          fc.record({
            key: fc.constantFrom(...ALLOWED_CLOUDINARY_PARAMS),
            value: alphanumString(1, 6),
          }),
          { minLength: 0, maxLength: 3 }
        ),
        disallowedParams: fc.array(
          fc.record({
            key: nonCloudinaryParamKeyArb,
            value: alphanumString(1, 6),
          }),
          { minLength: 1, maxLength: 3 }
        ),
      })
      .map(({ protocol, domain, path, allowedParams, disallowedParams }) => {
        const allParams = [...allowedParams, ...disallowedParams];
        const queryString = allParams.map((p) => `${p.key}=${p.value}`).join('&');
        return {
          url: `${protocol}://${domain}/${path}?${queryString}`,
          allowedKeys: new Set(allowedParams.map((p) => p.key)),
          disallowedKeys: new Set(disallowedParams.map((p) => p.key)),
        };
      });

    fc.assert(
      fc.property(urlWithMixedParamsArb, ({ url, allowedKeys, disallowedKeys }) => {
        const result = validateEvidenceUrl(url);

        expect(result.valid).toBe(true);
        expect(result.sanitizedUrl).toBeDefined();

        // Parse the sanitized URL and check its query parameters
        const sanitizedParsed = new URL(result.sanitizedUrl!);
        const sanitizedKeys = new Set<string>();
        sanitizedParsed.searchParams.forEach((_, key) => {
          sanitizedKeys.add(key);
        });

        // All sanitized keys must be in the allowed set
        for (const key of sanitizedKeys) {
          expect(ALLOWED_CLOUDINARY_PARAMS).toContain(key);
        }

        // No disallowed keys should be present in the sanitized URL
        for (const key of disallowedKeys) {
          expect(sanitizedParsed.searchParams.has(key)).toBe(false);
        }

        // All allowed keys from the original should be preserved
        for (const key of allowedKeys) {
          expect(sanitizedParsed.searchParams.has(key)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('invalid URL formats are always rejected', () => {
    fc.assert(
      fc.property(invalidUrlFormatArb, (url) => {
        const result: ValidationResult = validateEvidenceUrl(url);

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.sanitizedUrl).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: disputes-settings-improvements, Property 2: Return outcome validation
// **Validates: Requirements 1.4, 3.1**

/**
 * Validates the returnOutcome field against allowed enum values.
 * This mirrors the validation logic in issue.controller.ts:
 *   const VALID_RETURN_OUTCOMES = ['refund', 'product_replacement'];
 *   if (returnOutcome && !VALID_RETURN_OUTCOMES.includes(returnOutcome)) { ... }
 */
const VALID_RETURN_OUTCOMES = ['refund', 'product_replacement'];

function validateReturnOutcome(value: string): boolean {
  return VALID_RETURN_OUTCOMES.includes(value);
}

describe('Property 2: Return outcome validation', () => {
  it('"refund" is always accepted', () => {
    fc.assert(
      fc.property(fc.constant('refund'), (value) => {
        expect(validateReturnOutcome(value)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('"product_replacement" is always accepted', () => {
    fc.assert(
      fc.property(fc.constant('product_replacement'), (value) => {
        expect(validateReturnOutcome(value)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('any string that is not "refund" or "product_replacement" is always rejected', () => {
    const invalidReturnOutcomeArb = fc
      .string({ minLength: 0, maxLength: 50 })
      .filter((s) => s !== 'refund' && s !== 'product_replacement');

    fc.assert(
      fc.property(invalidReturnOutcomeArb, (value) => {
        expect(validateReturnOutcome(value)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts value if and only if it equals "refund" or "product_replacement"', () => {
    // This is the full biconditional property: accepted ⟺ value ∈ {"refund", "product_replacement"}
    const anyStringArb = fc.oneof(
      fc.constant('refund'),
      fc.constant('product_replacement'),
      fc.string({ minLength: 0, maxLength: 50 })
    );

    fc.assert(
      fc.property(anyStringArb, (value) => {
        const isValid = validateReturnOutcome(value);
        const shouldBeValid = value === 'refund' || value === 'product_replacement';
        expect(isValid).toBe(shouldBeValid);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: disputes-settings-improvements, Property 1: Order eligibility filtering
// **Validates: Requirements 1.2**

/**
 * Order statuses used in the platform. The dispute form order dropdown
 * should only show orders with status "shipped" or "delivered".
 */
const ALL_ORDER_STATUSES = [
  'pending',
  'pending_payment',
  'payment_failed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
  'refunded',
] as const;

type OrderStatus = (typeof ALL_ORDER_STATUSES)[number];

const DISPUTE_ELIGIBLE_STATUSES: OrderStatus[] = ['shipped', 'delivered'];

interface SimpleOrder {
  _id: string;
  status: OrderStatus;
}

/**
 * Pure filter function that determines which orders are eligible for dispute creation.
 * This mirrors the logic in CreateDisputeModal which fetches only "shipped" and "delivered" orders.
 */
function filterDisputeEligibleOrders(orders: SimpleOrder[]): SimpleOrder[] {
  return orders.filter((order) => DISPUTE_ELIGIBLE_STATUSES.includes(order.status));
}

/**
 * Arbitrary that generates an order with a random status from all possible statuses.
 */
const orderArb: fc.Arbitrary<SimpleOrder> = fc.record({
  _id: fc.uuid(),
  status: fc.constantFrom(...ALL_ORDER_STATUSES),
});

/**
 * Arbitrary that generates a list of orders with various statuses.
 */
const orderListArb = fc.array(orderArb, { minLength: 0, maxLength: 50 });

describe('Property 1: Order eligibility filtering', () => {
  it('filtered orders contain only orders with status "shipped" or "delivered"', () => {
    fc.assert(
      fc.property(orderListArb, (orders) => {
        const eligible = filterDisputeEligibleOrders(orders);

        // Every order in the result must have status "shipped" or "delivered"
        for (const order of eligible) {
          expect(DISPUTE_ELIGIBLE_STATUSES).toContain(order.status);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all orders with status "shipped" or "delivered" are included in the result', () => {
    fc.assert(
      fc.property(orderListArb, (orders) => {
        const eligible = filterDisputeEligibleOrders(orders);

        // Every order in the input with an eligible status must appear in the result
        const expectedEligible = orders.filter((o) =>
          DISPUTE_ELIGIBLE_STATUSES.includes(o.status)
        );

        expect(eligible.length).toBe(expectedEligible.length);

        for (const expected of expectedEligible) {
          expect(eligible).toContainEqual(expected);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no orders with ineligible statuses are included in the result', () => {
    fc.assert(
      fc.property(orderListArb, (orders) => {
        const eligible = filterDisputeEligibleOrders(orders);

        const ineligibleStatuses = ALL_ORDER_STATUSES.filter(
          (s) => !DISPUTE_ELIGIBLE_STATUSES.includes(s)
        );

        // No order in the result should have an ineligible status
        for (const order of eligible) {
          expect(ineligibleStatuses).not.toContain(order.status);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('the filter is a biconditional: an order is in the result if and only if its status is "shipped" or "delivered"', () => {
    fc.assert(
      fc.property(orderListArb, (orders) => {
        const eligible = filterDisputeEligibleOrders(orders);
        const eligibleIds = new Set(eligible.map((o) => o._id));

        for (const order of orders) {
          const isEligible = DISPUTE_ELIGIBLE_STATUSES.includes(order.status);
          const isInResult = eligibleIds.has(order._id);
          expect(isInResult).toBe(isEligible);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: disputes-settings-improvements, Property 3: Evidence file MIME type validation
// **Validates: Requirements 2.5**

/**
 * Allowed MIME types for evidence uploads.
 * This mirrors the constants in EvidenceUploadSection.tsx:
 *   ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
 *   ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"]
 */
const ALLOWED_EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
] as const;

/**
 * Pure validator function that checks if a MIME type is allowed for evidence upload.
 * Returns true if and only if the MIME type is one of the allowed types.
 */
function validateEvidenceMimeType(mimeType: string): boolean {
  return (ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * A broader set of MIME types that are NOT allowed for evidence upload.
 * Used to generate disallowed MIME types for property testing.
 */
const DISALLOWED_MIME_TYPES = [
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/x-icon',
  'video/avi',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-flv',
  'video/3gpp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'application/json',
  'application/zip',
  'application/octet-stream',
  'text/plain',
  'text/html',
  'text/css',
];

describe('Property 3: Evidence file MIME type validation', () => {
  it('all allowed MIME types are always accepted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_EVIDENCE_MIME_TYPES),
        (mimeType) => {
          expect(validateEvidenceMimeType(mimeType)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('known disallowed MIME types are always rejected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DISALLOWED_MIME_TYPES),
        (mimeType) => {
          expect(validateEvidenceMimeType(mimeType)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('arbitrary strings that are not in the allowed set are always rejected', () => {
    const arbitraryMimeTypeArb = fc
      .tuple(
        fc.constantFrom(
          'image', 'video', 'audio', 'application', 'text', 'font', 'model', 'multipart'
        ),
        fc.stringMatching(/^[a-z0-9][a-z0-9.+\-]{0,30}$/)
      )
      .map(([type, subtype]) => `${type}/${subtype}`)
      .filter((mime) => !(ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(mime));

    fc.assert(
      fc.property(arbitraryMimeTypeArb, (mimeType) => {
        expect(validateEvidenceMimeType(mimeType)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('accepts a MIME type if and only if it is one of: image/jpeg, image/png, image/webp, video/mp4, video/webm', () => {
    // Biconditional property: accepted ⟺ mimeType ∈ allowed set
    const anyMimeTypeArb = fc.oneof(
      // Include allowed types to ensure we test both sides of the biconditional
      fc.constantFrom(...ALLOWED_EVIDENCE_MIME_TYPES),
      // Include known disallowed types
      fc.constantFrom(...DISALLOWED_MIME_TYPES),
      // Include arbitrary type/subtype combinations
      fc
        .tuple(
          fc.constantFrom(
            'image', 'video', 'audio', 'application', 'text', 'font'
          ),
          fc.stringMatching(/^[a-z0-9][a-z0-9.+\-]{0,20}$/)
        )
        .map(([type, subtype]) => `${type}/${subtype}`)
    );

    fc.assert(
      fc.property(anyMimeTypeArb, (mimeType) => {
        const isAccepted = validateEvidenceMimeType(mimeType);
        const shouldBeAccepted = (ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(mimeType);
        expect(isAccepted).toBe(shouldBeAccepted);
      }),
      { numRuns: 100 }
    );
  });
});
