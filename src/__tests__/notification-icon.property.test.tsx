/**
 * @vitest-environment jsdom
 */
// Feature: smart-notification-routing, Property 3: NotificationIcon returns non-null for known types
// **Validates: Requirements 13.3**

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';

// Mock lucide-react icons to return simple span elements
vi.mock('lucide-react', () => {
  const createIcon = (name: string) => {
    const Icon = (props: any) => React.createElement('span', { 'data-testid': `icon-${name}`, ...props });
    Icon.displayName = name;
    return Icon;
  };
  return {
    X: createIcon('X'),
    Box: createIcon('Box'),
    ShoppingBag: createIcon('ShoppingBag'),
    MessageSquare: createIcon('MessageSquare'),
    CheckCircle: createIcon('CheckCircle'),
    CreditCard: createIcon('CreditCard'),
    Tag: createIcon('Tag'),
    Wallet: createIcon('Wallet'),
    AlertTriangle: createIcon('AlertTriangle'),
    RefreshCw: createIcon('RefreshCw'),
    ArrowDownCircle: createIcon('ArrowDownCircle'),
    Shield: createIcon('Shield'),
    Megaphone: createIcon('Megaphone'),
    AlertOctagon: createIcon('AlertOctagon'),
    Truck: createIcon('Truck'),
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', props),
}));

// Mock NotificationContext
vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

import { NotificationIcon } from '@/app/vendor/dashboard/(components)/NotifiicationModal';

const KNOWN_NOTIFICATION_TYPES = [
  'review',
  'order',
  'payment',
  'product-listed',
  'message',
  'offer',
  'bid',
  'wallet',
  'dispute',
  'subscription',
  'payout',
  'refund',
  'withdrawal',
  'verification',
  'advertisement',
  'product',
  'account-warning',
  'shipping',
] as const;

describe('Property 3: NotificationIcon returns a non-null icon for every known notification type', () => {
  it('should render a non-null element for any known NotificationType', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_NOTIFICATION_TYPES),
        (type) => {
          const { container } = render(
            React.createElement(NotificationIcon, { type })
          );
          // The component should render something (not null)
          expect(container.firstChild).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
