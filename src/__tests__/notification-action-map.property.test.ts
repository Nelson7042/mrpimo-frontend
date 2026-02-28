// Feature: smart-notification-routing, Property 4: Contextual action map returns correct labels for all mapped type/case combinations
// **Validates: Requirements 16.2–16.15**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  NOTIFICATION_ACTION_MAP,
  getNotificationAction,
} from '@/utils/notification-action-map';

// Extract all known keys from the action map and split into type/case pairs
const KNOWN_ENTRIES = Object.keys(NOTIFICATION_ACTION_MAP).map((key) => {
  const [type, ...rest] = key.split(':');
  return { type, notifCase: rest.join(':') };
});

describe('Property 4: Contextual action map returns correct labels for all mapped type/case combinations', () => {
  it('should return a non-null object with a non-empty label and a getUrl function returning a non-empty string for any mapped entry', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_ENTRIES),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        ({ type, notifCase }, redirectUrl, entityId) => {
          const action = getNotificationAction(type, notifCase);

          // Action must not be null for known entries
          expect(action).not.toBeNull();
          expect(action).toBeDefined();

          // Label must be a non-empty string
          expect(typeof action!.label).toBe('string');
          expect(action!.label.length).toBeGreaterThan(0);

          // getUrl must be a function that returns a non-empty string
          expect(typeof action!.getUrl).toBe('function');

          const url = action!.getUrl({
            data: { redirectUrl, entityId },
          });

          expect(typeof url).toBe('string');
          expect(url.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: smart-notification-routing, Property 5: Unmapped action map entries return null
// **Validates: Requirements 16.16**

describe('Property 5: Unmapped action map entries return null', () => {
  // Collect all known keys from the action map for filtering
  const KNOWN_KEYS = new Set(Object.keys(NOTIFICATION_ACTION_MAP));

  it('should return null for any type:case combination NOT in the action map', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (type, notifCase) => {
          const key = `${type}:${notifCase}`;

          // Skip if this randomly generated combo happens to match a known key
          fc.pre(!KNOWN_KEYS.has(key));

          const action = getNotificationAction(type, notifCase);

          expect(action).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
