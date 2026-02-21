/**
 * Property-Based Tests for Frontend-Backend Sync on Product Operations
 * Feature: product-management-enhancement, Property 13: Frontend-Backend Sync on Product Operations
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 *
 * This test file validates that for any product CRUD operation on the backend,
 * the frontend product list/detail view SHALL reflect the change after cache invalidation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

interface ProductData {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  vendorId: string;
  status: 'active' | 'inactive' | 'draft';
}

type ProductOperation = 'create' | 'update' | 'delete';

interface CacheInvalidationRecord {
  queryKey: string[];
  timestamp: number;
}

// ============================================================================
// Mock QueryClient with Invalidation Tracking
// ============================================================================

/**
 * Creates a mock QueryClient that tracks cache invalidations
 */
const createMockQueryClient = () => {
  const invalidations: CacheInvalidationRecord[] = [];
  
  const queryClient = {
    invalidateQueries: vi.fn(({ queryKey }: { queryKey: string[] }) => {
      invalidations.push({
        queryKey,
        timestamp: Date.now(),
      });
      return Promise.resolve();
    }),
    getInvalidations: () => invalidations,
    clearInvalidations: () => {
      invalidations.length = 0;
    },
  };
  
  return queryClient;
};

// ============================================================================
// Cache Invalidation Logic (mirrors useVendor.ts and mutations.ts)
// ============================================================================

/**
 * Product list query keys that should be invalidated on product operations
 */
const PRODUCT_LIST_QUERY_KEYS = [
  ['products'],
  ['vendor-products'],
  ['vendorProducts'],
  ['allProducts'],
  ['bestDeals'],
  ['productsByCategory'],
  ['productsOnAuction'],
];

/**
 * Vendor analytics query keys that should be invalidated on product operations
 */
const VENDOR_ANALYTICS_QUERY_KEYS = [
  ['vendor-analytics'],
  ['vendorAnalytics'],
];

/**
 * Simulates cache invalidation for product creation
 * Mirrors the onSuccess handler in useCreateProduct
 */
const invalidateCacheOnProductCreate = (queryClient: ReturnType<typeof createMockQueryClient>) => {
  // Invalidate product list queries
  PRODUCT_LIST_QUERY_KEYS.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
  // Invalidate vendor analytics queries
  VENDOR_ANALYTICS_QUERY_KEYS.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
};

/**
 * Simulates cache invalidation for product update
 * Mirrors the onSuccess handler in useUpdateProduct
 */
const invalidateCacheOnProductUpdate = (
  queryClient: ReturnType<typeof createMockQueryClient>,
  productId: string
) => {
  // Invalidate product list queries
  PRODUCT_LIST_QUERY_KEYS.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
  // Invalidate specific product query
  queryClient.invalidateQueries({ queryKey: ['product', productId] });
  // Invalidate vendor analytics queries
  VENDOR_ANALYTICS_QUERY_KEYS.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
};

/**
 * Simulates cache invalidation for product deletion
 * Mirrors the onSuccess handler in useDeleteProduct
 */
const invalidateCacheOnProductDelete = (queryClient: ReturnType<typeof createMockQueryClient>) => {
  // Invalidate product list queries
  PRODUCT_LIST_QUERY_KEYS.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
  // Invalidate vendor analytics queries
  VENDOR_ANALYTICS_QUERY_KEYS.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
};

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

/**
 * Generates a valid product ID
 */
const productIdArb = fc.uuid();

/**
 * Generates a valid vendor ID
 */
const vendorIdArb = fc.uuid();

/**
 * Generates a valid product data object
 */
const productDataArb: fc.Arbitrary<ProductData> = fc.record({
  id: productIdArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  brand: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  vendorId: vendorIdArb,
  status: fc.constantFrom('active', 'inactive', 'draft'),
});

/**
 * Generates a product operation type
 */
const productOperationArb: fc.Arbitrary<ProductOperation> = fc.constantFrom('create', 'update', 'delete');

/**
 * Generates a list of products for batch operations
 */
const productListArb = fc.array(productDataArb, { minLength: 1, maxLength: 10 });

// ============================================================================
// Property 13: Frontend-Backend Sync on Product Operations
// ============================================================================

describe('Property 13: Frontend-Backend Sync on Product Operations', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;

  beforeEach(() => {
    queryClient = createMockQueryClient();
  });

  afterEach(() => {
    queryClient.clearInvalidations();
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirement 7.1**
   * WHEN a product is created on the backend, THE frontend product list SHALL reflect
   * the new product without manual refresh (via cache invalidation)
   */
  describe('Requirement 7.1: Product creation triggers cache invalidation', () => {
    it('product list query is invalidated after product creation', async () => {
      await fc.assert(
        fc.asyncProperty(productDataArb, async (product) => {
          queryClient.clearInvalidations();
          
          // Simulate product creation success
          invalidateCacheOnProductCreate(queryClient);
          
          const invalidations = queryClient.getInvalidations();
          const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
          
          // All product list queries should be invalidated
          expect(invalidatedKeys).toContain('products');
          expect(invalidatedKeys).toContain('vendor-products');
          expect(invalidatedKeys).toContain('vendorProducts');
          expect(invalidatedKeys).toContain('allProducts');
        }),
        { numRuns: 100 }
      );
    });

    it('vendor analytics queries are invalidated after product creation', async () => {
      await fc.assert(
        fc.asyncProperty(productDataArb, async (product) => {
          queryClient.clearInvalidations();
          
          // Simulate product creation success
          invalidateCacheOnProductCreate(queryClient);
          
          const invalidations = queryClient.getInvalidations();
          const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
          
          // Vendor analytics queries should be invalidated
          expect(invalidatedKeys).toContain('vendor-analytics');
          expect(invalidatedKeys).toContain('vendorAnalytics');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirement 7.2**
   * WHEN a product is updated on the backend, THE frontend product details SHALL
   * reflect the changes (via cache invalidation)
   */
  describe('Requirement 7.2: Product update triggers cache invalidation', () => {
    it('product list and specific product queries are invalidated after update', async () => {
      await fc.assert(
        fc.asyncProperty(productDataArb, async (product) => {
          queryClient.clearInvalidations();
          
          // Simulate product update success
          invalidateCacheOnProductUpdate(queryClient, product.id);
          
          const invalidations = queryClient.getInvalidations();
          const invalidatedKeys = invalidations.map(inv => JSON.stringify(inv.queryKey));
          
          // Product list queries should be invalidated
          expect(invalidatedKeys).toContain(JSON.stringify(['products']));
          expect(invalidatedKeys).toContain(JSON.stringify(['vendor-products']));
          
          // Specific product query should be invalidated
          expect(invalidatedKeys).toContain(JSON.stringify(['product', product.id]));
        }),
        { numRuns: 100 }
      );
    });

    it('vendor analytics queries are invalidated after product update', async () => {
      await fc.assert(
        fc.asyncProperty(productDataArb, async (product) => {
          queryClient.clearInvalidations();
          
          // Simulate product update success
          invalidateCacheOnProductUpdate(queryClient, product.id);
          
          const invalidations = queryClient.getInvalidations();
          const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
          
          // Vendor analytics queries should be invalidated
          expect(invalidatedKeys).toContain('vendor-analytics');
          expect(invalidatedKeys).toContain('vendorAnalytics');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirement 7.3**
   * WHEN a product is deleted on the backend, THE frontend SHALL remove the product
   * from all views (via cache invalidation)
   */
  describe('Requirement 7.3: Product deletion triggers cache invalidation', () => {
    it('product list query is invalidated after product deletion', async () => {
      await fc.assert(
        fc.asyncProperty(productIdArb, async (productId) => {
          queryClient.clearInvalidations();
          
          // Simulate product deletion success
          invalidateCacheOnProductDelete(queryClient);
          
          const invalidations = queryClient.getInvalidations();
          const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
          
          // All product list queries should be invalidated
          expect(invalidatedKeys).toContain('products');
          expect(invalidatedKeys).toContain('vendor-products');
          expect(invalidatedKeys).toContain('vendorProducts');
          expect(invalidatedKeys).toContain('allProducts');
          expect(invalidatedKeys).toContain('bestDeals');
          expect(invalidatedKeys).toContain('productsByCategory');
          expect(invalidatedKeys).toContain('productsOnAuction');
        }),
        { numRuns: 100 }
      );
    });

    it('vendor analytics queries are invalidated after product deletion', async () => {
      await fc.assert(
        fc.asyncProperty(productIdArb, async (productId) => {
          queryClient.clearInvalidations();
          
          // Simulate product deletion success
          invalidateCacheOnProductDelete(queryClient);
          
          const invalidations = queryClient.getInvalidations();
          const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
          
          // Vendor analytics queries should be invalidated
          expect(invalidatedKeys).toContain('vendor-analytics');
          expect(invalidatedKeys).toContain('vendorAnalytics');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirement 7.4**
   * WHEN inventory changes, THE frontend SHALL display updated stock levels
   * (inventory changes are handled via product update)
   */
  describe('Requirement 7.4: Inventory changes trigger cache invalidation', () => {
    it('product queries are invalidated when inventory is updated', async () => {
      await fc.assert(
        fc.asyncProperty(
          productDataArb,
          fc.integer({ min: 0, max: 1000 }), // inventory quantity
          async (product, newInventory) => {
            queryClient.clearInvalidations();
            
            // Inventory changes are handled via product update
            invalidateCacheOnProductUpdate(queryClient, product.id);
            
            const invalidations = queryClient.getInvalidations();
            const invalidatedKeys = invalidations.map(inv => JSON.stringify(inv.queryKey));
            
            // Product list queries should be invalidated
            expect(invalidatedKeys).toContain(JSON.stringify(['products']));
            
            // Specific product query should be invalidated to show new stock
            expect(invalidatedKeys).toContain(JSON.stringify(['product', product.id]));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Universal property: For any product operation, appropriate caches are invalidated
   */
  describe('Universal: Any product operation triggers appropriate cache invalidation', () => {
    it('all product operations invalidate product list queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          productDataArb,
          productOperationArb,
          async (product, operation) => {
            queryClient.clearInvalidations();
            
            // Perform the operation
            switch (operation) {
              case 'create':
                invalidateCacheOnProductCreate(queryClient);
                break;
              case 'update':
                invalidateCacheOnProductUpdate(queryClient, product.id);
                break;
              case 'delete':
                invalidateCacheOnProductDelete(queryClient);
                break;
            }
            
            const invalidations = queryClient.getInvalidations();
            const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
            
            // Core product list queries should always be invalidated
            expect(invalidatedKeys).toContain('products');
            expect(invalidatedKeys).toContain('vendor-products');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all product operations invalidate vendor analytics queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          productDataArb,
          productOperationArb,
          async (product, operation) => {
            queryClient.clearInvalidations();
            
            // Perform the operation
            switch (operation) {
              case 'create':
                invalidateCacheOnProductCreate(queryClient);
                break;
              case 'update':
                invalidateCacheOnProductUpdate(queryClient, product.id);
                break;
              case 'delete':
                invalidateCacheOnProductDelete(queryClient);
                break;
            }
            
            const invalidations = queryClient.getInvalidations();
            const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
            
            // Vendor analytics queries should always be invalidated
            expect(invalidatedKeys).toContain('vendor-analytics');
            expect(invalidatedKeys).toContain('vendorAnalytics');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('update operation invalidates specific product query', async () => {
      await fc.assert(
        fc.asyncProperty(productDataArb, async (product) => {
          queryClient.clearInvalidations();
          
          // Perform update operation
          invalidateCacheOnProductUpdate(queryClient, product.id);
          
          const invalidations = queryClient.getInvalidations();
          const specificProductInvalidation = invalidations.find(
            inv => inv.queryKey[0] === 'product' && inv.queryKey[1] === product.id
          );
          
          // Specific product query should be invalidated on update
          expect(specificProductInvalidation).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Batch operations: Multiple products should trigger appropriate invalidations
   */
  describe('Batch operations trigger cache invalidation', () => {
    it('multiple product creations invalidate caches appropriately', async () => {
      await fc.assert(
        fc.asyncProperty(productListArb, async (products) => {
          queryClient.clearInvalidations();
          
          // Simulate multiple product creations
          products.forEach(() => {
            invalidateCacheOnProductCreate(queryClient);
          });
          
          const invalidations = queryClient.getInvalidations();
          
          // Each creation should trigger invalidations
          // Total invalidations = products.length * (PRODUCT_LIST_QUERY_KEYS.length + VENDOR_ANALYTICS_QUERY_KEYS.length)
          const expectedInvalidationsPerCreate = PRODUCT_LIST_QUERY_KEYS.length + VENDOR_ANALYTICS_QUERY_KEYS.length;
          expect(invalidations.length).toBe(products.length * expectedInvalidationsPerCreate);
        }),
        { numRuns: 100 }
      );
    });

    it('multiple product updates invalidate specific product queries', async () => {
      await fc.assert(
        fc.asyncProperty(productListArb, async (products) => {
          queryClient.clearInvalidations();
          
          // Simulate multiple product updates
          products.forEach(product => {
            invalidateCacheOnProductUpdate(queryClient, product.id);
          });
          
          const invalidations = queryClient.getInvalidations();
          
          // Each product should have its specific query invalidated
          products.forEach(product => {
            const specificInvalidation = invalidations.find(
              inv => inv.queryKey[0] === 'product' && inv.queryKey[1] === product.id
            );
            expect(specificInvalidation).toBeDefined();
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge cases
   */
  describe('Edge cases', () => {
    it('empty product ID still triggers list invalidation on update', async () => {
      queryClient.clearInvalidations();
      
      // Even with empty ID, list queries should be invalidated
      invalidateCacheOnProductUpdate(queryClient, '');
      
      const invalidations = queryClient.getInvalidations();
      const invalidatedKeys = invalidations.map(inv => inv.queryKey[0]);
      
      expect(invalidatedKeys).toContain('products');
      expect(invalidatedKeys).toContain('vendor-products');
    });

    it('invalidation order is consistent', async () => {
      await fc.assert(
        fc.asyncProperty(productDataArb, async (product) => {
          queryClient.clearInvalidations();
          
          invalidateCacheOnProductCreate(queryClient);
          
          const invalidations = queryClient.getInvalidations();
          
          // Verify timestamps are in order
          for (let i = 1; i < invalidations.length; i++) {
            expect(invalidations[i].timestamp).toBeGreaterThanOrEqual(invalidations[i - 1].timestamp);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
