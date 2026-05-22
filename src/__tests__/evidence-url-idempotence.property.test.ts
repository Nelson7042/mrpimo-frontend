// Feature: vendor-dispute-settings, Property 2: Evidence URL validation-sanitization idempotence
// **Validates: Requirements 3.3, 3.4**

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

/** Helper to generate alphanumeric strings */
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
 * Arbitrary that generates non-Cloudinary query parameter keys.
 * These should be stripped during sanitization.
 */
const nonCloudinaryParamKeyArb = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')), { minLength: 2, maxLength: 10 })
  .map((arr) => arr.join(''))
  .filter((key) => !ALLOWED_CLOUDINARY_PARAMS.includes(key));

/**
 * Arbitrary that generates valid Cloudinary URLs with only allowed query parameters.
 */
const validCloudinaryUrlWithAllowedParamsArb = fc
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
 * Arbitrary that generates valid Cloudinary URLs with a mix of allowed
 * and non-allowed query parameters. The non-allowed params should be
 * stripped on first sanitization pass.
 */
const validCloudinaryUrlWithMixedParamsArb = fc
  .record({
    protocol: fc.constantFrom('https', 'http'),
    domain: fc.constantFrom(...CLOUDINARY_DOMAINS),
    pathSegments: fc.array(pathSegmentString(1, 12), { minLength: 1, maxLength: 5 }),
    allowedParams: fc.array(
      fc.record({
        key: fc.constantFrom(...ALLOWED_CLOUDINARY_PARAMS),
        value: alphanumString(1, 8),
      }),
      { minLength: 0, maxLength: 3 }
    ),
    disallowedParams: fc.array(
      fc.record({
        key: nonCloudinaryParamKeyArb,
        value: alphanumString(1, 8),
      }),
      { minLength: 0, maxLength: 3 }
    ),
  })
  .map(({ protocol, domain, pathSegments, allowedParams, disallowedParams }) => {
    const path = '/' + pathSegments.join('/');
    const allParams = [...allowedParams, ...disallowedParams];
    const queryString =
      allParams.length > 0
        ? '?' + allParams.map((p) => `${p.key}=${p.value}`).join('&')
        : '';
    return `${protocol}://${domain}${path}${queryString}`;
  });

describe('Property 2: Evidence URL validation-sanitization idempotence', () => {
  it('validate→sanitize→validate produces the same result as the first pass (URLs with only allowed params)', () => {
    fc.assert(
      fc.property(validCloudinaryUrlWithAllowedParamsArb, (url) => {
        // First pass: validate and get sanitized URL
        const firstResult: ValidationResult = validateEvidenceUrl(url);
        expect(firstResult.valid).toBe(true);
        expect(firstResult.sanitizedUrl).toBeDefined();

        // Second pass: validate the sanitized URL from the first pass
        const secondResult: ValidationResult = validateEvidenceUrl(firstResult.sanitizedUrl!);
        expect(secondResult.valid).toBe(true);
        expect(secondResult.sanitizedUrl).toBeDefined();

        // Idempotence: the sanitized URL from the second pass must equal the first
        expect(secondResult.sanitizedUrl).toBe(firstResult.sanitizedUrl);
      }),
      { numRuns: 100 }
    );
  });

  it('validate→sanitize→validate produces the same result as the first pass (URLs with mixed params)', () => {
    fc.assert(
      fc.property(validCloudinaryUrlWithMixedParamsArb, (url) => {
        // First pass: validate and get sanitized URL (non-allowed params stripped)
        const firstResult: ValidationResult = validateEvidenceUrl(url);
        expect(firstResult.valid).toBe(true);
        expect(firstResult.sanitizedUrl).toBeDefined();

        // Second pass: validate the already-sanitized URL
        const secondResult: ValidationResult = validateEvidenceUrl(firstResult.sanitizedUrl!);
        expect(secondResult.valid).toBe(true);
        expect(secondResult.sanitizedUrl).toBeDefined();

        // Idempotence: second sanitization produces identical output
        expect(secondResult.sanitizedUrl).toBe(firstResult.sanitizedUrl);
      }),
      { numRuns: 100 }
    );
  });

  it('multiple rounds of validate→sanitize converge to a fixed point', () => {
    fc.assert(
      fc.property(validCloudinaryUrlWithMixedParamsArb, (url) => {
        // First pass
        const firstResult = validateEvidenceUrl(url);
        expect(firstResult.valid).toBe(true);

        // Second pass
        const secondResult = validateEvidenceUrl(firstResult.sanitizedUrl!);
        expect(secondResult.valid).toBe(true);

        // Third pass
        const thirdResult = validateEvidenceUrl(secondResult.sanitizedUrl!);
        expect(thirdResult.valid).toBe(true);

        // All subsequent passes produce the same sanitized URL as the first pass
        expect(secondResult.sanitizedUrl).toBe(firstResult.sanitizedUrl);
        expect(thirdResult.sanitizedUrl).toBe(firstResult.sanitizedUrl);
      }),
      { numRuns: 100 }
    );
  });
});
