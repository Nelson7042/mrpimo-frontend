/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Make React available globally for JSX in components that use the automatic runtime
globalThis.React = React;

// ── Mock next/link ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: any }) => (
    <a href={typeof href === "string" ? href : ""}>{children}</a>
  ),
}));

// ── Mock Wishlist component ─────────────────────────────────────────────────
vi.mock("@/components/client-component/Wishlist", () => ({
  __esModule: true,
  default: () => <button data-testid="wishlist-btn">♡</button>,
}));

// ── Mock lucide-react icons ─────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Heart: () => <span data-testid="heart-icon" />,
  Star: ({ className }: { className?: string }) => (
    <span data-testid="star-icon" className={className} />
  ),
}));

// ── Mock helper ─────────────────────────────────────────────────────────────
vi.mock("@/utils/helper", () => ({
  truncateSentence: (text: string, len: number) => text.slice(0, len),
}));

// ── Import component under test (after mocks) ──────────────────────────────
import { ProductCard } from "@/components/Home/ProductCard";
import { ProductType } from "@/types/product.type";

// ── Test data helpers ───────────────────────────────────────────────────────
function makeProduct(overrides: Partial<ProductType> = {}): ProductType {
  return {
    _id: "prod-1",
    name: "Test Product",
    slug: "test-product",
    description: "A test product description",
    images: ["/images/tv.png"],
    rating: 4,
    reviews: [],
    condition: "New",
    priceInfo: {
      originalPrice: 100,
      displayPrice: 100,
      currencySymbol: "₦",
      currency: "NGN",
    },
    inventory: {
      listing: { type: "instant" },
    },
    ...overrides,
  } as unknown as ProductType;
}

// ═══════════════════════════════════════════════════════════════════════════
// Task 1.3 – ProductCard discount badge smoke tests
// ═══════════════════════════════════════════════════════════════════════════
describe("ProductCard – Discount Badge", () => {
  /**
   * Validates: Requirement 2.1
   * WHEN a product has a sale price lower than its original price,
   * THE Product_Card SHALL display a Discount_Badge showing the percentage off.
   */
  it("renders discount badge when sale price < original price", () => {
    const product = makeProduct({
      priceInfo: {
        originalPrice: 200,
        displayPrice: 160,
        currencySymbol: "₦",
        currency: "NGN",
      },
    });

    render(<ProductCard product={product} />);

    // Discount is (200-160)/200 = 20%
    expect(screen.getByText("-20%")).toBeTruthy();
  });

  /**
   * Validates: Requirement 2.4
   * THE Discount_Badge SHALL be visible on product cards — verify it is NOT
   * rendered when there is no discount (originalPrice === displayPrice).
   */
  it("hides discount badge when no discount (prices are equal)", () => {
    const product = makeProduct({
      priceInfo: {
        originalPrice: 150,
        displayPrice: 150,
        currencySymbol: "₦",
        currency: "NGN",
      },
    });

    render(<ProductCard product={product} />);

    // No badge should be present
    const badge = screen.queryByText(/^-\d+%$/);
    expect(badge).toBeNull();
  });

  /**
   * Validates: Requirement 3.5
   * WHEN a product is on sale, THE Product_Card SHALL display the original
   * price with a strikethrough alongside the sale price.
   */
  it("displays strikethrough original price on sale items", () => {
    const product = makeProduct({
      priceInfo: {
        originalPrice: 500,
        displayPrice: 350,
        currencySymbol: "₦",
        currency: "NGN",
      },
    });

    const { container } = render(<ProductCard product={product} />);

    // The sale price should be visible
    expect(screen.getByText(/350/)).toBeTruthy();

    // The original price should appear with line-through styling
    const strikethroughEl = container.querySelector(".line-through");
    expect(strikethroughEl).not.toBeNull();
    expect(strikethroughEl?.textContent).toContain("500");
  });
});
