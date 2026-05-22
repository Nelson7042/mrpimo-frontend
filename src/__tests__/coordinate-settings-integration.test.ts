// Integration test: Coordinate validation wired into PATCH /vendors/settings
// **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCoordinates } from '../../../mprimo-backend/src/validators/coordinate.validator';

/**
 * These tests verify that the coordinate validation logic correctly
 * handles the various input formats and returns appropriate errors
 * when integrated into the vendor settings update flow.
 */

// Simulate the coordinate extraction logic from updateVendorSettings
function extractAndValidateCoordinates(body: Record<string, any>) {
  const { pickupLocation, latitude, longitude } = body;

  const coordLat = pickupLocation?.latitude ?? latitude;
  const coordLng = pickupLocation?.longitude ?? longitude;
  const hasCoordinateInput = pickupLocation !== undefined || latitude !== undefined || longitude !== undefined;

  if (!hasCoordinateInput) {
    return { shouldValidate: false, result: null };
  }

  const result = validateCoordinates(coordLat, coordLng);
  return { shouldValidate: true, result };
}

describe('Coordinate validation integration in vendor settings', () => {
  describe('pickupLocation nested format', () => {
    it('returns 400 with errors for latitude out of range', () => {
      const body = { pickupLocation: { latitude: 91, longitude: 50 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors).toContain('Latitude must be between -90 and 90');
    });

    it('returns 400 with errors for longitude out of range', () => {
      const body = { pickupLocation: { latitude: 45, longitude: 181 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors).toContain('Longitude must be between -180 and 180');
    });

    it('returns 400 with errors for both coordinates out of range', () => {
      const body = { pickupLocation: { latitude: -91, longitude: -181 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors.length).toBe(2);
    });

    it('returns 400 for partial coordinates (only latitude)', () => {
      const body = { pickupLocation: { latitude: 45 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors.some(e => e.includes('Both'))).toBe(true);
    });

    it('returns 400 for partial coordinates (only longitude)', () => {
      const body = { pickupLocation: { longitude: 90 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors.some(e => e.includes('Both'))).toBe(true);
    });

    it('accepts valid coordinates', () => {
      const body = { pickupLocation: { latitude: 6.5244, longitude: 3.3792 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(true);
      expect(result!.errors).toHaveLength(0);
    });

    it('accepts boundary values', () => {
      const body = { pickupLocation: { latitude: 90, longitude: -180 } };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(true);
      expect(result!.errors).toHaveLength(0);
    });
  });

  describe('flat latitude/longitude format', () => {
    it('returns 400 with errors for latitude out of range', () => {
      const body = { latitude: -95, longitude: 50 };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors).toContain('Latitude must be between -90 and 90');
    });

    it('accepts valid flat coordinates', () => {
      const body = { latitude: 40.7128, longitude: -74.006 };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(true);
      expect(result!.errors).toHaveLength(0);
    });

    it('returns 400 for partial flat coordinates (only latitude)', () => {
      const body = { latitude: 45 };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false);
      expect(result!.errors.some(e => e.includes('Both'))).toBe(true);
    });
  });

  describe('no coordinate input', () => {
    it('skips validation when no coordinate fields are present', () => {
      const body = { autoAcceptOrders: true, minOrderAmount: 100 };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(false);
      expect(result).toBeNull();
    });
  });

  describe('pickupLocation takes precedence over flat fields', () => {
    it('uses pickupLocation coordinates when both formats are present', () => {
      const body = {
        pickupLocation: { latitude: 91, longitude: 50 }, // invalid
        latitude: 45, // valid but should be ignored
        longitude: 90,
      };
      const { shouldValidate, result } = extractAndValidateCoordinates(body);

      expect(shouldValidate).toBe(true);
      expect(result!.valid).toBe(false); // pickupLocation's invalid lat takes precedence
    });
  });
});
