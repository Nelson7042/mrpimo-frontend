// Integration test: Vendor authorization middleware enforced on all specified routes
// **Validates: Requirements 8.3, 8.4, 8.5**

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * These tests verify that the verifyVendorOwnership middleware is correctly
 * applied to all vendor-specific routes and produces the expected responses:
 * - 403 when the authenticated user doesn't own the vendor
 * - 404 when no vendor document exists for the user
 * - Access granted (next() called) when the user owns the vendor
 *
 * Routes under test:
 * - PATCH /vendors/settings (Requirement 8.3)
 * - PATCH /vendors/notification-preferences (Requirement 8.3)
 * - GET /vendors/profile (Requirement 8.3)
 * - GET /vendors/:vendorId/wallet (Requirement 8.4)
 * - POST /vendors/:vendorId/withdraw (Requirement 8.4)
 */

// Mock the Vendor model
const mockFindOne = vi.fn();
vi.mock('../../../mprimo-backend/src/models/vendor.model', () => ({
  default: {
    findOne: (...args: any[]) => mockFindOne(...args),
  },
}));

// Mock the LoggerService
vi.mock('../../../mprimo-backend/src/services/logger.service', () => ({
  LoggerService: {
    getInstance: () => ({
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

import { verifyVendorOwnership } from '../../../mprimo-backend/src/middlewares/vendor-auth.middleware';

/**
 * Helper to create a mock Express request simulating a specific route.
 */
function createMockReq(options: {
  userId?: string;
  path: string;
  method: string;
  params?: Record<string, string>;
  body?: Record<string, any>;
}) {
  return {
    userId: options.userId,
    path: options.path,
    method: options.method,
    params: options.params || {},
    body: options.body || {},
  } as any;
}

/**
 * Helper to create a mock Express response.
 */
function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// Define the routes that should enforce vendor ownership
const PROTECTED_ROUTES = [
  {
    name: 'PATCH /vendors/settings',
    method: 'PATCH',
    path: '/settings',
    params: {},
    body: { autoAcceptOrders: true },
    requirement: '8.3',
  },
  {
    name: 'PATCH /vendors/notification-preferences',
    method: 'PATCH',
    path: '/notification-preferences',
    params: {},
    body: { newOrder: true },
    requirement: '8.3',
  },
  {
    name: 'GET /vendors/profile',
    method: 'GET',
    path: '/profile',
    params: {},
    body: {},
    requirement: '8.3',
  },
  {
    name: 'GET /vendors/:vendorId/wallet',
    method: 'GET',
    path: '/vendor123/wallet',
    params: { vendorId: 'vendor123' },
    body: {},
    requirement: '8.4',
  },
  {
    name: 'POST /vendors/:vendorId/withdraw',
    method: 'POST',
    path: '/vendor123/withdraw',
    params: { vendorId: 'vendor123' },
    body: { amount: 100 },
    requirement: '8.4',
  },
];

describe('Vendor authorization integration on all routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('403 response for non-owner access attempts (Requirement 8.2)', () => {
    it.each(PROTECTED_ROUTES)(
      '$name returns 403 when authenticated user does not own the vendor',
      async (route) => {
        const requestUserId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
        const vendorUserId = 'bbbbbbbbbbbbbbbbbbbbbbbb';

        // Vendor exists but belongs to a different user
        mockFindOne.mockResolvedValue({ userId: vendorUserId });

        const req = createMockReq({
          userId: requestUserId,
          path: route.path,
          method: route.method,
          params: route.params,
          body: route.body,
        });
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Access denied: you do not own this vendor account',
          })
        );
      }
    );
  });

  describe('404 response when vendor document does not exist (Requirement 8.5)', () => {
    it.each(PROTECTED_ROUTES)(
      '$name returns 404 when no vendor exists for the authenticated user',
      async (route) => {
        const requestUserId = 'cccccccccccccccccccccccc';

        // No vendor found for this user
        mockFindOne.mockResolvedValue(null);

        const req = createMockReq({
          userId: requestUserId,
          path: route.path,
          method: route.method,
          params: route.params,
          body: route.body,
        });
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Vendor not found',
          })
        );
      }
    );
  });

  describe('Access granted when user owns the vendor (Requirements 8.1, 8.3, 8.4)', () => {
    it.each(PROTECTED_ROUTES)(
      '$name allows access when authenticated user owns the vendor',
      async (route) => {
        const userId = 'dddddddddddddddddddddddd';

        // Vendor exists and userId matches
        mockFindOne.mockResolvedValue({ userId });

        const req = createMockReq({
          userId,
          path: route.path,
          method: route.method,
          params: route.params,
          body: route.body,
        });
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        // Vendor should be attached to request for downstream use
        expect((req as any).vendor).toBeDefined();
        expect((req as any).vendor.userId).toBe(userId);
      }
    );
  });

  describe('401 response when no userId is present on request', () => {
    it.each(PROTECTED_ROUTES)(
      '$name returns 401 when request has no userId (unauthenticated)',
      async (route) => {
        const req = createMockReq({
          userId: undefined,
          path: route.path,
          method: route.method,
          params: route.params,
          body: route.body,
        });
        const res = createMockRes();
        const next = vi.fn();

        await verifyVendorOwnership(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: 'Unauthorized - No user ID',
          })
        );
      }
    );
  });

  describe('Middleware is applied to correct routes (route registration verification)', () => {
    it('verifyVendorOwnership is imported and used in vendor routes file', async () => {
      // Verify the routes file imports verifyVendorOwnership by reading the source
      const fs = await import('fs');
      const path = await import('path');
      const routesFilePath = path.resolve(
        __dirname,
        '../../../mprimo-backend/src/routes/vendor.routes.ts'
      );
      const routesContent = fs.readFileSync(routesFilePath, 'utf-8');

      // Verify the middleware is imported
      expect(routesContent).toContain('verifyVendorOwnership');
      expect(routesContent).toContain('vendor-auth.middleware');

      // Verify it's applied to all required routes by checking route definitions
      // PATCH /vendors/settings (Requirement 8.3)
      const settingsRouteSection = routesContent.slice(
        routesContent.indexOf('"/settings"')
      );
      expect(settingsRouteSection.slice(0, 200)).toContain('verifyVendorOwnership');

      // PATCH /vendors/notification-preferences (Requirement 8.3)
      const notifRouteSection = routesContent.slice(
        routesContent.indexOf('"/notification-preferences"')
      );
      expect(notifRouteSection.slice(0, 200)).toContain('verifyVendorOwnership');

      // GET /vendors/profile (Requirement 8.3)
      const profileRouteSection = routesContent.slice(
        routesContent.indexOf('"/profile"')
      );
      expect(profileRouteSection.slice(0, 200)).toContain('verifyVendorOwnership');

      // GET /vendors/:vendorId/wallet (Requirement 8.4)
      const walletRouteSection = routesContent.slice(
        routesContent.indexOf('"/:vendorId/wallet"')
      );
      expect(walletRouteSection.slice(0, 200)).toContain('verifyVendorOwnership');

      // POST /vendors/:vendorId/withdraw (Requirement 8.4)
      const withdrawRouteSection = routesContent.slice(
        routesContent.indexOf('"/:vendorId/withdraw"')
      );
      expect(withdrawRouteSection.slice(0, 200)).toContain('verifyVendorOwnership');
    });
  });

  describe('Middleware handles server errors gracefully', () => {
    it('returns 500 when Vendor.findOne throws an error', async () => {
      const userId = 'eeeeeeeeeeeeeeeeeeeeeeee';

      mockFindOne.mockRejectedValue(new Error('Database connection failed'));

      const req = createMockReq({
        userId,
        path: '/settings',
        method: 'PATCH',
      });
      const res = createMockRes();
      const next = vi.fn();

      await verifyVendorOwnership(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Server error',
        })
      );
    });
  });
});
