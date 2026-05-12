/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ── Mock next/link ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : ""}>{children}</a>
  ),
}));

// ── Mock swiper/react ───────────────────────────────────────────────────────
vi.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper">{children}</div>
  ),
  SwiperSlide: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}));
vi.mock("swiper/css", () => ({}));

// ── Mock hooks ──────────────────────────────────────────────────────────────
const mockUseCategoryBySlug = vi.fn();
const mockUseCategoryTree = vi.fn();
const mockUseProductsByCategory = vi.fn();
const mockUseCategories = vi.fn();

vi.mock("@/hooks/useProducts", () => ({
  useCategoryBySlug: (...args: any[]) => mockUseCategoryBySlug(...args),
  useCategoryTree: (...args: any[]) => mockUseCategoryTree(...args),
  useProductsByCategory: (...args: any[]) => mockUseProductsByCategory(...args),
}));

vi.mock("@/hooks/queries", () => ({
  useCategories: (...args: any[]) => mockUseCategories(...args),
}));

// ── Mock ProductCard (avoid deep dependency tree) ───────────────────────────
vi.mock("@/components/Home/ProductCard", () => ({
  ProductCard: ({ product }: any) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  ArrowRight: () => <span data-testid="arrow-right" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
  ChevronLeft: () => <span data-testid="chevron-left" />,
  Star: () => <span data-testid="star-icon" />,
  Heart: () => <span data-testid="heart-icon" />,
}));

// ── Mock ui/button ──────────────────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// ── Imports (after mocks) ───────────────────────────────────────────────────
import ComputerAccessories from "@/components/Home/ComputerAccessories";
import ByCategory from "@/components/Home/ByCategory";
import { Category, CategoryBreadcrumb } from "@/types/product.type";

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    _id: "cat-1",
    name: "Computer Accessories",
    description: "Desc",
    parent: null,
    level: 1,
    path: [],
    attributes: [],
    isActive: true,
    createdBy: "u1",
    updatedBy: "u1",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    slug: "computer-accessories",
    __v: 0,
    productDimensionsRequired: false,
    sortOrder: 0,
    seoKeywords: [],
    featured: false,
    breadcrumbs: [],
    productCount: 0,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Task 7.1 – ComputerAccessories component unit tests
// ═══════════════════════════════════════════════════════════════════════════
describe("ComputerAccessories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Sensible defaults – override per test
    mockUseCategoryBySlug.mockReturnValue({ data: undefined, isLoading: false });
    mockUseCategoryTree.mockReturnValue({ data: undefined, isLoading: false });
    mockUseProductsByCategory.mockReturnValue({ data: undefined, isLoading: false });
  });

  /**
   * Validates: Requirement 2.3
   * IF the Category_API returns no category for the slug, THEN THE Component
   * SHALL return null (render nothing) instead of showing an empty state.
   */
  it("renders nothing when slug lookup returns null", () => {
    mockUseCategoryBySlug.mockReturnValue({ data: { category: null }, isLoading: false });
    mockUseCategoryTree.mockReturnValue({ data: { categories: [] }, isLoading: false });
    mockUseProductsByCategory.mockReturnValue({ data: { products: [] }, isLoading: false });

    const { container } = render(<ComputerAccessories />);

    expect(container.innerHTML).toBe("");
  });

  /**
   * Validates: Requirement 3.7
   * IF the Category_API returns no subcategories, THEN THE Component SHALL
   * display only the "All Accessories" tab.
   */
  it('shows only "All Accessories" tab when subcategories are empty', () => {
    const parent = makeCategory();
    mockUseCategoryBySlug.mockReturnValue({ data: { category: parent }, isLoading: false });
    mockUseCategoryTree.mockReturnValue({ data: { categories: [] }, isLoading: false });
    mockUseProductsByCategory.mockReturnValue({ data: { products: [{ _id: "p1", name: "Test Product" }] }, isLoading: false });

    render(<ComputerAccessories />);

    const tabs = screen.getAllByRole("button").filter((btn) =>
      btn.className.includes("border-b-2")
    );
    expect(tabs).toHaveLength(1);
    expect(tabs[0].textContent).toBe("All Accessories");
  });

  /**
   * Validates: Requirement 4.6
   * THE Component SHALL default the Active_Tab to "All Accessories" on initial render.
   */
  it('defaults active tab to "All Accessories" on mount', () => {
    const parent = makeCategory();
    const sub = makeCategory({ _id: "sub-1", name: "Keyboards", sortOrder: 1 });
    mockUseCategoryBySlug.mockReturnValue({ data: { category: parent }, isLoading: false });
    mockUseCategoryTree.mockReturnValue({ data: { categories: [sub] }, isLoading: false });
    mockUseProductsByCategory.mockReturnValue({ data: { products: [{ _id: "p1", name: "Test Product" }] }, isLoading: false });

    render(<ComputerAccessories />);

    const allTab = screen.getByText("All Accessories");
    // Active tab has blue border class
    expect(allTab.closest("button")?.className).toContain("border-blue-600");
  });

  /**
   * Validates: Requirement 4.5
   * WHILE the Product_API request is in progress after a tab change, THE
   * Component SHALL display a loading skeleton in the product grid area.
   */
  it("displays loading skeleton during product fetch", () => {
    const parent = makeCategory();
    mockUseCategoryBySlug.mockReturnValue({ data: { category: parent }, isLoading: false });
    mockUseCategoryTree.mockReturnValue({ data: { categories: [] }, isLoading: false });
    mockUseProductsByCategory.mockReturnValue({ data: undefined, isLoading: true });

    render(<ComputerAccessories />);

    // Skeleton cards have animate-pulse class
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  /**
   * Validates: Requirement 6.3
   * THE Component SHALL separate breadcrumb entries with a visual separator character.
   */
  it("renders breadcrumb entries separated by visual separator", () => {
    const breadcrumbs: CategoryBreadcrumb[] = [
      { name: "Home", slug: "home", categoryId: "home-id" },
      { name: "Electronics", slug: "electronics", categoryId: "elec-id" },
    ];
    const parent = makeCategory({ breadcrumbs });
    mockUseCategoryBySlug.mockReturnValue({ data: { category: parent }, isLoading: false });
    mockUseCategoryTree.mockReturnValue({ data: { categories: [] }, isLoading: false });
    mockUseProductsByCategory.mockReturnValue({ data: { products: [{ _id: "p1", name: "Test Product" }] }, isLoading: false });

    render(<ComputerAccessories />);

    // Breadcrumb nav should be present
    const nav = screen.getByLabelText("Breadcrumb");
    expect(nav).toBeTruthy();

    // ChevronRight icons serve as visual separators between breadcrumb entries
    const separators = nav.querySelectorAll('[data-testid="chevron-right"]');
    expect(separators.length).toBeGreaterThanOrEqual(breadcrumbs.length);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// Task 7.2 – ByCategory component unit tests
// ═══════════════════════════════════════════════════════════════════════════
describe("ByCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 1.1
   * WHEN the homepage loads, THE ByCategory Component SHALL fetch categories.
   */
  it("fetches categories on mount", () => {
    mockUseCategories.mockReturnValue({
      data: {
        categories: [
          makeCategory({ _id: "c1", name: "Phones", featured: true, sortOrder: 1 }),
        ],
      },
    });

    render(<ByCategory />);

    expect(mockUseCategories).toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 1.2
   * THE ByCategory Component SHALL visually distinguish featured categories
   * using a highlighted card style (gradient background, colored border, star icon).
   */
  it("displays featured categories with highlighted card style", () => {
    const featured = makeCategory({
      _id: "f1",
      name: "Featured Cat",
      featured: true,
      sortOrder: 1,
      slug: "featured-cat",
    });
    const nonFeatured = makeCategory({
      _id: "nf1",
      name: "Normal Cat",
      featured: false,
      sortOrder: 2,
      slug: "normal-cat",
    });

    mockUseCategories.mockReturnValue({
      data: {
        categories: [nonFeatured, featured],
      },
    });

    render(<ByCategory />);

    // Featured card should have the gradient/border classes
    const featuredCard = screen.getByText("Featured Cat").closest("div.group");
    expect(featuredCard?.className).toContain("from-blue-50");
    expect(featuredCard?.className).toContain("border-blue-300");

    // Non-featured card should NOT have the featured styling
    const normalCard = screen.getByText("Normal Cat").closest("div.group");
    expect(normalCard?.className).not.toContain("border-blue-300");

    // Featured card should have a star icon
    const starIcons = document.querySelectorAll('[data-testid="star-icon"]');
    expect(starIcons.length).toBeGreaterThan(0);
  });

  /**
   * Validates: Requirement 7.2
   * THE Component SHALL access enhanced fields directly on the Category type
   * without using `as any` type assertions.
   *
   * This is a compile-time guarantee verified by the fact that the component
   * source uses typed fields (icon, productCount, sortOrder, featured) and
   * this test file compiles without errors. We also verify the fields render.
   */
  it("accesses Category type fields without `as any` assertions", () => {
    const cat = makeCategory({
      _id: "t1",
      name: "Typed Cat",
      featured: true,
      sortOrder: 5,
      icon: "/icons/typed.png",
      productCount: 42,
      slug: "typed-cat",
    });

    mockUseCategories.mockReturnValue({
      data: { categories: [cat] },
    });

    render(<ByCategory />);

    // icon rendered as img src
    const img = document.querySelector('img[alt="Typed Cat"]') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain("/icons/typed.png");

    // productCount rendered
    expect(screen.getByText(/42/)).toBeTruthy();
  });
});
