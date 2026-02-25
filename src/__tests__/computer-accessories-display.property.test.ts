import fc from "fast-check";
import { describe, it, expect } from "vitest";
import type { Category } from "@/types/product.type";

/**
 * Pure sorting function extracted from ByCategory component logic.
 * Filters active categories, then sorts featured first by sortOrder,
 * followed by non-featured by sortOrder.
 */
function sortCategoriesFeaturedFirst(allCategories: Category[]): Category[] {
  const active = allCategories.filter((c: Category) => c.isActive !== false);
  const featured = active
    .filter((c: Category) => c.featured)
    .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);
  const nonFeatured = active
    .filter((c: Category) => !c.featured)
    .sort((a: Category, b: Category) => a.sortOrder - b.sortOrder);
  return [...featured, ...nonFeatured];
}

/**
 * Arbitrary that generates a random Category object with varying fields.
 */
const categoryArbitrary: fc.Arbitrary<Category> = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ maxLength: 100 }),
  parent: fc.option(fc.uuid(), { nil: null }),
  level: fc.integer({ min: 1, max: 4 }),
  path: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 4 }),
  attributes: fc.constant([]),
  isActive: fc.boolean(),
  createdBy: fc.uuid(),
  updatedBy: fc.uuid(),
  createdAt: fc.integer({ min: 946684800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: 946684800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  slug: fc.string({ minLength: 1, maxLength: 30 }),
  __v: fc.constant(0),
  image: fc.option(fc.webUrl(), { nil: undefined }),
  productDimensionsRequired: fc.boolean(),
  sortOrder: fc.integer({ min: 0, max: 1000 }),
  icon: fc.option(fc.webUrl(), { nil: undefined }),
  seoTitle: fc.option(fc.string({ maxLength: 70 }), { nil: undefined }),
  seoDescription: fc.option(fc.string({ maxLength: 160 }), { nil: undefined }),
  seoKeywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  featured: fc.boolean(),
  breadcrumbs: fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 30 }),
      slug: fc.string({ minLength: 1, maxLength: 30 }),
      categoryId: fc.uuid(),
    }),
    { maxLength: 4 }
  ),
  productCount: fc.integer({ min: 0, max: 10000 }),
});

describe("Feature: computer-accessories-display, Property 1: Featured-first category sorting", () => {
  /**
   * Property 1: Featured-first category sorting
   * **Validates: Requirements 1.3**
   *
   * For any list of categories with mixed featured and non-featured status
   * and various sortOrder values, the sorted output should place all featured
   * categories before all non-featured categories, and within each group,
   * categories should be ordered by sortOrder ascending.
   */
  it("should place all featured categories before non-featured, each group sorted by sortOrder ascending", () => {
    fc.assert(
      fc.property(
        fc.array(categoryArbitrary, { minLength: 0, maxLength: 30 }),
        (categories) => {
          const sorted = sortCategoriesFeaturedFirst(categories);

          // Only active categories should be in the result
          const activeInput = categories.filter((c) => c.isActive !== false);
          expect(sorted.length).toBe(activeInput.length);

          // Find the boundary: last featured index
          const firstNonFeaturedIndex = sorted.findIndex((c) => !c.featured);

          if (firstNonFeaturedIndex === -1) {
            // All are featured (or empty) — just check sortOrder ascending
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(sorted[i - 1].sortOrder);
            }
            return;
          }

          // Assert: all items before firstNonFeaturedIndex are featured
          for (let i = 0; i < firstNonFeaturedIndex; i++) {
            expect(sorted[i].featured).toBe(true);
          }

          // Assert: all items from firstNonFeaturedIndex onward are non-featured
          for (let i = firstNonFeaturedIndex; i < sorted.length; i++) {
            expect(sorted[i].featured).toBe(false);
          }

          // Assert: featured group is sorted by sortOrder ascending
          for (let i = 1; i < firstNonFeaturedIndex; i++) {
            expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(sorted[i - 1].sortOrder);
          }

          // Assert: non-featured group is sorted by sortOrder ascending
          for (let i = firstNonFeaturedIndex + 1; i < sorted.length; i++) {
            expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(sorted[i - 1].sortOrder);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Pure function extracted from ByCategory component logic.
 * Resolves the display image URL for a category using the fallback chain:
 * icon → image → default placeholder.
 */
function resolveImageUrl(category: Pick<Category, 'icon' | 'image'>): string {
  return category.icon || category.image || "/images/tv.png";
}

describe("Feature: computer-accessories-display, Property 2: Category image resolution fallback chain", () => {
  /**
   * Property 2: Category image resolution fallback chain
   * **Validates: Requirements 1.4**
   *
   * For any category with any combination of icon (present/absent) and
   * image (present/absent) fields, the resolved display image should be
   * icon if present, else image if present, else the default placeholder
   * path "/images/tv.png".
   */
  it("should resolve to icon if present, else image if present, else default placeholder", () => {
    fc.assert(
      fc.property(categoryArbitrary, (category) => {
        const result = resolveImageUrl(category);

        if (category.icon) {
          // icon is present (non-empty string) → result must equal icon
          expect(result).toBe(category.icon);
        } else if (category.image) {
          // icon absent, image present → result must equal image
          expect(result).toBe(category.image);
        } else {
          // both absent → result must equal default placeholder
          expect(result).toBe("/images/tv.png");
        }
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from both ByCategory and ComputerAccessories component logic.
 * Determines whether the product count should be displayed for a category.
 * Returns true only when productCount is greater than zero.
 */
function shouldDisplayProductCount(productCount: number): boolean {
  return productCount > 0;
}

describe("Feature: computer-accessories-display, Property 3: Product count conditional display", () => {
  /**
   * Property 3: Product count conditional display
   * **Validates: Requirements 1.5, 3.6**
   *
   * For any category (whether in ByCategory cards or ComputerAccessories tabs),
   * if productCount is greater than zero the count value should be included in
   * the rendered output, and if productCount is zero or negative the count
   * should not be displayed.
   */
  it("should return true only when productCount is greater than zero", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 10000 }),
        (productCount) => {
          const result = shouldDisplayProductCount(productCount);

          if (productCount > 0) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from ByCategory card links, breadcrumb links,
 * and "Browse All Products" link construction logic.
 * Builds a category navigation URL from a slug and _id.
 */
function buildCategoryUrl(slug: string, id: string): string {
  return `/home/categories/${slug}?categoryId=${id}`;
}

describe("Feature: computer-accessories-display, Property 4: Category URL construction", () => {
  /**
   * Property 4: Category URL construction
   * **Validates: Requirements 1.6, 6.2, 8.1**
   *
   * For any category with a slug and _id, all navigation links (ByCategory
   * card links, breadcrumb links, and "Browse All Products" link) should
   * produce a URL matching the format /home/categories/{slug}?categoryId={_id}.
   */
  it("should produce a URL matching /home/categories/{slug}?categoryId={_id} for any slug and id", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.uuid(),
        (slug, id) => {
          const url = buildCategoryUrl(slug, id);

          // Assert: starts with the correct path prefix
          expect(url.startsWith("/home/categories/")).toBe(true);

          // Assert: contains the categoryId query parameter
          expect(url).toContain("?categoryId=");

          // Assert: matches the exact expected format
          expect(url).toBe(`/home/categories/${slug}?categoryId=${id}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from ComputerAccessories component logic.
 * Sorts subcategories by sortOrder ascending.
 */
function sortSubcategoriesByOrder(subs: Category[]): Category[] {
  return [...subs].sort((a, b) => a.sortOrder - b.sortOrder);
}

describe("Feature: computer-accessories-display, Property 5: Subcategory tab ordering by sortOrder", () => {
  /**
   * Property 5: Subcategory tab ordering by sortOrder
   * **Validates: Requirements 3.2**
   *
   * For any list of subcategories with various sortOrder values, the rendered
   * tab order (excluding the prepended "All Accessories" tab) should be in
   * ascending sortOrder order.
   */
  it("should order subcategory tabs by sortOrder ascending", () => {
    fc.assert(
      fc.property(
        fc.array(categoryArbitrary, { minLength: 0, maxLength: 20 }),
        (subcategories) => {
          const sorted = sortSubcategoriesByOrder(subcategories);

          // Length must be preserved
          expect(sorted.length).toBe(subcategories.length);

          // sortOrder must be ascending
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(
              sorted[i - 1].sortOrder
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from ComputerAccessories component logic.
 * Builds the tab labels array: "All Accessories" prepended, followed by
 * subcategory names.
 */
function buildTabLabels(subcategories: Category[]): string[] {
  return ["All Accessories", ...subcategories.map((s) => s.name)];
}

describe('Feature: computer-accessories-display, Property 6: "All Accessories" tab is always first', () => {
  /**
   * Property 6: "All Accessories" tab is always first
   * **Validates: Requirements 3.4, 3.7**
   *
   * For any list of subcategories (including an empty list), the first tab
   * in the rendered tab bar should always be "All Accessories".
   */
  it('should always have "All Accessories" as the first tab label', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArbitrary, { minLength: 0, maxLength: 20 }),
        (subcategories) => {
          const labels = buildTabLabels(subcategories);

          // First tab is always "All Accessories"
          expect(labels[0]).toBe("All Accessories");

          // Total tabs = 1 (All Accessories) + subcategories count
          expect(labels.length).toBe(subcategories.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from ComputerAccessories component logic.
 * Derives the active category ID for product fetching.
 * If activeTabId is a subcategory ID, use it; otherwise fall back to parent.
 */
function deriveActiveCategoryId(
  activeTabId: string | null,
  parentCategoryId: string
): string {
  return activeTabId || parentCategoryId;
}

describe("Feature: computer-accessories-display, Property 7: Active category ID derivation", () => {
  /**
   * Property 7: Active category ID derivation
   * **Validates: Requirements 4.2, 4.3**
   *
   * For any active tab state, if the active tab is a subcategory then the
   * product query category ID should equal that subcategory's _id; if the
   * active tab is "All Accessories" (null), the product query category ID
   * should equal the parent category's _id.
   */
  it("should return subcategory ID when active, or parent ID when null", () => {
    fc.assert(
      fc.property(
        fc.option(fc.uuid(), { nil: null }),
        fc.uuid(),
        (activeTabId, parentCategoryId) => {
          const result = deriveActiveCategoryId(activeTabId, parentCategoryId);

          if (activeTabId !== null) {
            // Active tab is a subcategory → use subcategory ID
            expect(result).toBe(activeTabId);
          } else {
            // Active tab is "All Accessories" (null) → use parent ID
            expect(result).toBe(parentCategoryId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from ComputerAccessories component logic.
 * Resolves the section heading: seoTitle if non-empty, else category name.
 */
function resolveSectionHeading(
  seoTitle: string | undefined | null,
  name: string
): string {
  return seoTitle || name;
}

describe("Feature: computer-accessories-display, Property 8: Section heading resolution", () => {
  /**
   * Property 8: Section heading resolution
   * **Validates: Requirements 5.1, 5.3**
   *
   * For any parent category, if seoTitle is a non-empty string the section
   * heading should equal seoTitle; if seoTitle is empty, null, or undefined,
   * the section heading should equal the category name.
   */
  it("should use seoTitle when non-empty, otherwise fall back to name", () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ maxLength: 70 }), { nil: undefined }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (seoTitle, name) => {
          const result = resolveSectionHeading(seoTitle, name);

          if (seoTitle && seoTitle.length > 0) {
            expect(result).toBe(seoTitle);
          } else {
            expect(result).toBe(name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Pure function extracted from ComputerAccessories component logic.
 * Builds the breadcrumb trail: parent breadcrumbs + optional active subcategory.
 * Each entry has a label and isLink flag. The active subcategory (if present)
 * is appended as the final non-link entry.
 */
function buildBreadcrumbTrail(
  breadcrumbs: { name: string; slug: string; categoryId: string }[],
  parentName: string,
  activeSubcategoryName: string | null
): { label: string; isLink: boolean }[] {
  const trail = breadcrumbs.map((b) => ({ label: b.name, isLink: true }));
  if (activeSubcategoryName) {
    trail.push({ label: activeSubcategoryName, isLink: false });
  }
  return trail;
}

describe("Feature: computer-accessories-display, Property 9: Breadcrumb trail with active subcategory appended", () => {
  /**
   * Property 9: Breadcrumb trail with active subcategory appended
   * **Validates: Requirements 6.1, 6.4**
   *
   * For any parent category with a non-empty breadcrumbs array and any active
   * subcategory, the rendered breadcrumb trail should contain all entries from
   * breadcrumbs followed by the active subcategory's name as the final entry,
   * and that final entry should not be a link.
   */
  it("should append active subcategory as final non-link breadcrumb entry", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            slug: fc.string({ minLength: 1, maxLength: 30 }),
            categoryId: fc.uuid(),
          }),
          { minLength: 1, maxLength: 4 }
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
        (breadcrumbs, parentName, activeSubcategoryName) => {
          const trail = buildBreadcrumbTrail(
            breadcrumbs,
            parentName,
            activeSubcategoryName
          );

          // All original breadcrumb entries should be present as links
          for (let i = 0; i < breadcrumbs.length; i++) {
            expect(trail[i].label).toBe(breadcrumbs[i].name);
            expect(trail[i].isLink).toBe(true);
          }

          if (activeSubcategoryName) {
            // Final entry should be the active subcategory, not a link
            const lastEntry = trail[trail.length - 1];
            expect(lastEntry.label).toBe(activeSubcategoryName);
            expect(lastEntry.isLink).toBe(false);

            // Total length = breadcrumbs + 1
            expect(trail.length).toBe(breadcrumbs.length + 1);
          } else {
            // No subcategory appended
            expect(trail.length).toBe(breadcrumbs.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe("Feature: computer-accessories-display, Property 10: Tab label matches subcategory name", () => {
  /**
   * Property 10: Tab label matches subcategory name
   * **Validates: Requirements 3.3**
   *
   * For any subcategory, the corresponding tab label text should equal the
   * subcategory's name field. The tab labels are built by prepending
   * "All Accessories" to the sorted subcategory names, so each subcategory
   * at index i in the sorted list should have its name at labels[i + 1].
   */
  it("should have each tab label match the corresponding subcategory name", () => {
    fc.assert(
      fc.property(
        fc.array(categoryArbitrary, { minLength: 1, maxLength: 20 }),
        (subcategories) => {
          const sorted = sortSubcategoriesByOrder(subcategories);
          const labels = buildTabLabels(sorted);

          // For each subcategory, the tab label at offset +1 should match its name
          for (let i = 0; i < sorted.length; i++) {
            expect(labels[i + 1]).toBe(sorted[i].name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
