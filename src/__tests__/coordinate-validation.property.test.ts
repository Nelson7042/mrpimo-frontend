// Feature: vendor-dispute-settings, Property 12: Coordinate validation range enforcement
// **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCoordinates } from '../../../mprimo-backend/src/validators/coordinate.validator';

describe('Property 12: Coordinate validation range enforcement', () => {
  it('accepts coordinate pairs iff latitude ∈ [-90, 90] AND longitude ∈ [-180, 180] AND both provided', () => {
    const coordinatePairArb = fc.record({
      latitude: fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true }),
      longitude: fc.double({ min: -400, max: 400, noNaN: true, noDefaultInfinity: true }),
    });

    fc.assert(
      fc.property(coordinatePairArb, ({ latitude, longitude }) => {
        const result = validateCoordinates(latitude, longitude);

        const latInRange = latitude >= -90 && latitude <= 90;
        const lngInRange = longitude >= -180 && longitude <= 180;
        const shouldBeValid = latInRange && lngInRange;

        expect(result.valid).toBe(shouldBeValid);

        if (!shouldBeValid) {
          expect(result.errors.length).toBeGreaterThan(0);
        } else {
          expect(result.errors).toHaveLength(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('accepts valid coordinate pairs within exact bounds', () => {
    const validLatArb = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
    const validLngArb = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });

    fc.assert(
      fc.property(validLatArb, validLngArb, (latitude, longitude) => {
        const result = validateCoordinates(latitude, longitude);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects coordinates with latitude outside [-90, 90]', () => {
    const invalidLatArb = fc.oneof(
      fc.double({ min: 90.0001, max: 200, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: -200, max: -90.0001, noNaN: true, noDefaultInfinity: true })
    );
    const anyLngArb = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });

    fc.assert(
      fc.property(invalidLatArb, anyLngArb, (latitude, longitude) => {
        const result = validateCoordinates(latitude, longitude);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.toLowerCase().includes('latitude'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects coordinates with longitude outside [-180, 180]', () => {
    const anyLatArb = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
    const invalidLngArb = fc.oneof(
      fc.double({ min: 180.0001, max: 400, noNaN: true, noDefaultInfinity: true }),
      fc.double({ min: -400, max: -180.0001, noNaN: true, noDefaultInfinity: true })
    );

    fc.assert(
      fc.property(anyLatArb, invalidLngArb, (latitude, longitude) => {
        const result = validateCoordinates(latitude, longitude);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.toLowerCase().includes('longitude'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('partial submissions with only latitude are always rejected', () => {
    const anyLatArb = fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true });
    const missingLngArb = fc.constantFrom(undefined, null);

    fc.assert(
      fc.property(anyLatArb, missingLngArb, (latitude, longitude) => {
        const result = validateCoordinates(latitude, longitude as undefined | null);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.toLowerCase().includes('both'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('partial submissions with only longitude are always rejected', () => {
    const missingLatArb = fc.constantFrom(undefined, null);
    const anyLngArb = fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true });

    fc.assert(
      fc.property(missingLatArb, anyLngArb, (latitude, longitude) => {
        const result = validateCoordinates(latitude as undefined | null, longitude);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.toLowerCase().includes('both'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('neither coordinate provided is accepted (no coordinates submitted)', () => {
    const missingArb = fc.constantFrom(undefined, null);

    fc.assert(
      fc.property(missingArb, missingArb, (latitude, longitude) => {
        const result = validateCoordinates(
          latitude as undefined | null,
          longitude as undefined | null
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});
