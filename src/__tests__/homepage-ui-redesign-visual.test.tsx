/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Make React available globally for JSX
globalThis.React = React;

// ── Mock next/link ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: any }) => (
    <a href={typeof href === "string" ? href : ""}>{children}</a>
  ),
}));

// ── Mock next/image ─────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  ArrowRight: () => <span data-testid="arrow-right" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
  Star: ({ className }: { className?: string }) => (
    <span data-testid="star-icon" className={className} />
  ),
  Facebook: () => <span data-testid="facebook-icon" />,
  Twitter: () => <span data-testid="twitter-icon" />,
  Instagram: () => <span data-testid="instagram-icon" />,
}));

// ── Mock swiper ─────────────────────────────────────────────────────────────
vi.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper">{children}</div>
  ),
  SwiperSlide: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}));

// ── Mock @/components/ui/avatar ─────────────────────────────────────────────
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => (
    src ? <img data-testid="avatar-image" src={src} alt={alt} /> : null
  ),
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="avatar-fallback" className={className}>{children}</span>
  ),
}));

// ── Mock @/components/ui/Skeleton ───────────────────────────────────────────
vi.mock("@/components/ui/Skeleton", () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// ── Mock @/components/ui/button ─────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, className, ...props }: any) => (
    <button className={className} {...props}>{children}</button>
  ),
}));

// ── Mock fetchPublic ────────────────────────────────────────────────────────
vi.mock("@/utils/fetchPublic", () => ({
  fetchPublic: vi.fn(),
}));

// ── Mock @/utils/config ─────────────────────────────────────────────────────
vi.mock("@/utils/config", () => ({
  AllProduct: "http://localhost:3001/api",
  API_BASE_URL: "http://localhost:3001/api",
}));

// ── Mock useLocalityFilter ──────────────────────────────────────────────────
vi.mock("@/hooks/useLocalityFilter", () => ({
  useLocalityFilter: () => ({ locality: null, setLocality: vi.fn() }),
}));

// ── Mock useProducts hooks ──────────────────────────────────────────────────
const mockUseCategoryBySlug = vi.fn();
const mockUseCategoryTree = vi.fn();
const mockUseProductsByCategory = vi.fn();

vi.mock("@/hooks/useProducts", () => ({
  useCategoryBySlug: (...args: any[]) => mockUseCategoryBySlug(...args),
  useCategoryTree: (...args: any[]) => mockUseCategoryTree(...args),
  useProductsByCategory: (...args: any[]) => mockUseProductsByCategory(...args),
}));

// ── Mock useFeaturedReviews ─────────────────────────────────────────────────
const mockUseFeaturedReviews = vi.fn();

vi.mock("@/hooks/useReviews", () => ({
  useFeaturedReviews: () => mockUseFeaturedReviews(),
}));

// ── Mock @tanstack/react-query ──────────────────────────────────────────────
const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

// ── Mock Wishlist component ─────────────────────────────────────────────────
vi.mock("@/components/client-component/Wishlist", () => ({
  __esModule: true,
  default: () => <button data-testid="wishlist-btn">♡</button>,
}));

// ── Mock helper ─────────────────────────────────────────────────────────────
vi.mock("@/utils/helper", () => ({
  truncateSentence: (text: string, len: number) => text.slice(0, len),
}));

// ═══════════════════════════════════════════════════════════════════════════
// Import components under test (after mocks)
// ═══════════════════════════════════════════════════════════════════════════
import PromotionalCollections from "@/components/Home/PromotionalCollections";
import ComputerAccessories from "@/components/Home/ComputerAccessories";
import CustomerReviews from "@/components/Home/Review";
import Cta from "@/components/Home/Cta";
import Footer from "@/components/Home/Footer";

// ═══════════════════════════════════════════════════════════════════════════
// Task 14 – Visual smoke tests for restyled sections
// ═══════════════════════════════════════════════════════════════════════════

describe("PromotionalCollections – Two dark banners (Requirement 7.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders two dark banners side-by-side when 2+ collections exist", () => {
    const collections = [
      {
        _id: "col-1",
        name: "Summer Sale",
        slug: "summer-sale",
        description: "Hot deals for summer",
        displayTitle: "Summer Sale",
        priority: 1,
        isActive: true,
        type: "seasonal",
        styling: { backgroundColor: "#1F2937" },
      },
      {
        _id: "col-2",
        name: "New Arrivals",
        slug: "new-arrivals",
        description: "Fresh products",
        displayTitle: "New Arrivals",
        priority: 2,
        isActive: true,
        type: "curated",
        styling: { backgroundColor: "#111827" },
      },
    ];

    // First useQuery call: collections
    // Second: first collection products
    // Third: second collection products
    let callCount = 0;
    mockUseQuery.mockImplementation((opts: any) => {
      callCount++;
      if (opts.queryKey[0] === "collections") {
        return { data: collections, isLoading: false };
      }
      if (opts.queryKey[1] === "first") {
        return {
          data: [{ _id: "p1", name: "Product 1", images: ["/img1.png"] }],
          isLoading: false,
        };
      }
      if (opts.queryKey[1] === "second") {
        return {
          data: [
            { _id: "p2", name: "Product 2", images: ["/img2.png"] },
            { _id: "p3", name: "Product 3", images: ["/img3.png"] },
          ],
          isLoading: false,
        };
      }
      return { data: undefined, isLoading: false };
    });

    const { container } = render(<PromotionalCollections />);

    // Verify two dark banners are rendered (bg-gray-900 class)
    const darkBanners = container.querySelectorAll(".bg-gray-900");
    expect(darkBanners.length).toBe(2);

    // Verify collection titles are displayed
    expect(screen.getByText("Summer Sale")).toBeTruthy();
    expect(screen.getByText("New Arrivals")).toBeTruthy();

    // Verify "Shop Now" buttons exist
    const shopNowButtons = screen.getAllByText("Shop Now");
    expect(shopNowButtons.length).toBe(2);

    // Verify grid layout (md:grid-cols-2)
    const gridContainer = container.querySelector(".grid.grid-cols-1.md\\:grid-cols-2");
    expect(gridContainer).not.toBeNull();
  });

  it("returns null when fewer than 2 collections exist", () => {
    mockUseQuery.mockImplementation((opts: any) => {
      if (opts.queryKey[0] === "collections") {
        return { data: [{ _id: "col-1", name: "Only One" }], isLoading: false };
      }
      return { data: [], isLoading: false };
    });

    const { container } = render(<PromotionalCollections />);
    expect(container.innerHTML).toBe("");
  });
});

describe("ComputerAccessories – Split layout with Shop with Confidence banner (Requirement 8.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCategoryBySlug.mockReturnValue({
      data: {
        category: {
          _id: "cat-1",
          name: "Computer Accessories",
          slug: "computer-accessories",
          seoTitle: "Computer Accessories",
          seoDescription: "Best accessories",
          breadcrumbs: [],
        },
      },
      isLoading: false,
    });

    mockUseCategoryTree.mockReturnValue({
      data: { categories: [] },
      isLoading: false,
    });

    mockUseProductsByCategory.mockReturnValue({
      data: {
        products: [
          { _id: "p1", name: "Mouse", slug: "mouse", images: ["/mouse.png"], rating: 4, reviews: [], condition: "New", priceInfo: { originalPrice: 50, displayPrice: 50, currencySymbol: "$", currency: "USD" }, inventory: { listing: { type: "instant" } } },
          { _id: "p2", name: "Keyboard", slug: "keyboard", images: ["/kb.png"], rating: 5, reviews: [], condition: "New", priceInfo: { originalPrice: 80, displayPrice: 80, currencySymbol: "$", currency: "USD" }, inventory: { listing: { type: "instant" } } },
        ],
      },
      isLoading: false,
    });
  });

  it("renders split layout with products on left and confidence banner on right", () => {
    const { container } = render(<ComputerAccessories />);

    // Verify split layout container (flex with lg:flex-row)
    const splitContainer = container.querySelector(".flex.flex-col.lg\\:flex-row");
    expect(splitContainer).not.toBeNull();

    // Verify products section has lg:w-[65%]
    const productsSection = container.querySelector(".lg\\:w-\\[65\\%\\]");
    expect(productsSection).not.toBeNull();

    // Verify confidence banner section has lg:w-[35%]
    const bannerSection = container.querySelector(".lg\\:w-\\[35\\%\\]");
    expect(bannerSection).not.toBeNull();

    // Verify "Shop with Confidence" text
    expect(screen.getByText("Shop with Confidence")).toBeTruthy();

    // Verify teal background on the banner
    const tealBanner = container.querySelector(".bg-teal-600");
    expect(tealBanner).not.toBeNull();

    // Verify "Learn More" button
    expect(screen.getByText("Learn More")).toBeTruthy();
  });
});

describe("CustomerReviews – Card-based layout with avatar fallback (Requirement 9.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders review cards with avatar fallback initials", () => {
    mockUseFeaturedReviews.mockReturnValue({
      reviews: [
        { _id: "r1", reviewerName: "John Doe", reviewerAvatar: null, comment: "Great product!", rating: 5 },
        { _id: "r2", reviewerName: "Alice Smith", reviewerAvatar: null, comment: "Love it!", rating: 4 },
        { _id: "r3", reviewerName: "Bob Jones", reviewerAvatar: null, comment: "Good quality", rating: 4 },
      ],
      isLoading: false,
      isError: false,
    });

    const { container } = render(<CustomerReviews />);

    // Verify section title
    expect(screen.getByText("Customer Reviews")).toBeTruthy();

    // Verify review cards are rendered with card styling (border, rounded-lg, shadow-sm)
    const reviewCards = container.querySelectorAll(".bg-white.border.border-gray-200.rounded-lg");
    expect(reviewCards.length).toBeGreaterThanOrEqual(3);

    // Verify avatar fallbacks with initials (rendered in both mobile swiper and desktop grid)
    const fallbacks = screen.getAllByTestId("avatar-fallback");
    expect(fallbacks.length).toBeGreaterThanOrEqual(3);

    // Verify initials are correct (first letter of first + last name)
    // Fallbacks appear twice (mobile + desktop), check first set
    const initialsFound = fallbacks.map((f) => f.textContent);
    expect(initialsFound).toContain("JD");
    expect(initialsFound).toContain("AS");
    expect(initialsFound).toContain("BJ");

    // Verify colored backgrounds rotate (bg-blue-500, bg-green-500, bg-purple-500)
    const blueOnes = fallbacks.filter((f) => f.className.includes("bg-blue-500"));
    const greenOnes = fallbacks.filter((f) => f.className.includes("bg-green-500"));
    const purpleOnes = fallbacks.filter((f) => f.className.includes("bg-purple-500"));
    expect(blueOnes.length).toBeGreaterThanOrEqual(1);
    expect(greenOnes.length).toBeGreaterThanOrEqual(1);
    expect(purpleOnes.length).toBeGreaterThanOrEqual(1);

    // Verify review text is displayed (appears in both mobile swiper and desktop grid)
    expect(screen.getAllByText("Great product!").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Love it!").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Good quality").length).toBeGreaterThanOrEqual(1);
  });

  it("returns null when no reviews available", () => {
    mockUseFeaturedReviews.mockReturnValue({
      reviews: [],
      isLoading: false,
      isError: false,
    });

    const { container } = render(<CustomerReviews />);
    expect(container.innerHTML).toBe("");
  });
});

describe("CTA – Gradient background (Requirement 10.1)", () => {
  it("renders with blue gradient background (from-blue-600 to-blue-500)", () => {
    const { container } = render(<Cta />);

    // Verify gradient classes on the section
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    expect(section!.className).toContain("from-blue-600");
    expect(section!.className).toContain("to-blue-500");
    expect(section!.className).toContain("bg-gradient-to-r");

    // Verify headline text
    expect(screen.getByText("Enjoy Maximum Shopping Experience Today")).toBeTruthy();

    // Verify "Shop Now" button
    expect(screen.getByText("Shop Now")).toBeTruthy();
  });
});

describe("Footer – Background and text colors (Requirement 11.1)", () => {
  it("renders with light gradient background (from-[#B4CCFF] to-[#EDF2FB])", () => {
    const { container } = render(<Footer />);

    // Verify footer element exists
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();

    // Verify current gradient background classes
    expect(footer!.className).toContain("from-[#B4CCFF]");
    expect(footer!.className).toContain("to-[#EDF2FB]");
    expect(footer!.className).toContain("bg-gradient-to-t");

    // Verify newsletter section heading
    expect(screen.getByText("Join our newsletter")).toBeTruthy();

    // Verify company section
    expect(screen.getByText("Company")).toBeTruthy();

    // Verify social media section
    expect(screen.getByText("Social Media")).toBeTruthy();

    // Verify copyright text
    expect(screen.getByText(/© 2025 BC/)).toBeTruthy();

    // Verify footer links
    expect(screen.getByText("Terms of Service")).toBeTruthy();
    expect(screen.getByText("Privacy Policy")).toBeTruthy();
    expect(screen.getByText("Security")).toBeTruthy();
  });
});
