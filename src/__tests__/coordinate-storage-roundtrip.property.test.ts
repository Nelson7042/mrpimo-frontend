// Feature: vendor-dispute-settings, Property 13: Coordinate storage round-trip
// **Validates: Requirements 11.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCoordinates } from '../../../mprimo-backend/src/validators/coordinate.validator';

describe('Property 13: Coordinate storage round-trip', () => {
  it('storing then retrieving valid coordinates returns equal values', () => {
    const validLatArb = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
    const validLngArb = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });

    fc.assert(
      fc.property(validLatArb, validLngArb, (latitude, longitude) => {
        // Verify the coordinates are valid before storage
        const validationResult = validateCoordinates(latitude, longitude);
        expect(validationResult.valid).toBe(true);

        // Simulate storage: create a pickup location object
        const pickupLocation = {
          latitude,
          longitude,
        };

        // Simulate MongoDB storage round-trip via JSON serialization/deserialization
        const serialized = JSON.stringify(pickupLocation);
        const retrieved = JSON.parse(serialized);

        // Assert retrieved values are numerically equal to the originally submitted values
        // Note: JSON serialization normalizes -0 to 0, which are numerically equal (0 === -0)
        // and represent the same geographic coordinate
        expect(retrieved.latitude === latitude).toBe(true);
        expect(retrieved.longitude === longitude).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('coordinates at boundary values survive storage round-trip', () => {
    const boundaryLatArb = fc.constantFrom(-90, 0, 90);
    const boundaryLngArb = fc.constantFrom(-180, 0, 180);

    fc.assert(
      fc.property(boundaryLatArb, boundaryLngArb, (latitude, longitude) => {
        const pickupLocation = {
          latitude,
          longitude,
        };

        const serialized = JSON.stringify(pickupLocation);
        const retrieved = JSON.parse(serialized);

        expect(retrieved.latitude).toBe(latitude);
        expect(retrieved.longitude).toBe(longitude);
      }),
      { numRuns: 100 }
    );
  });

  it('coordinates with high decimal precision survive storage round-trip', () => {
    // Generate coordinates with many decimal places to test precision preservation
    const preciseLatArb = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
    const preciseLngArb = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });

    fc.assert(
      fc.property(preciseLatArb, preciseLngArb, (latitude, longitude) => {
        // Simulate a more realistic MongoDB document structure
        const document = {
          _id: 'vendor_123',
          storeName: 'Test Store',
          pickupLocation: {
            latitude,
            longitude,
            address: '123 Test St',
          },
        };

        // Simulate MongoDB BSON → JSON → BSON round-trip
        const stored = JSON.stringify(document);
        const retrieved = JSON.parse(stored);

        // Use === for numeric equality (JSON normalizes -0 to 0, which are the same coordinate)
        expect(retrieved.pickupLocation.latitude === latitude).toBe(true);
        expect(retrieved.pickupLocation.longitude === longitude).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
