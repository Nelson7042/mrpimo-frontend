"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import {
  useProducts,
  useCategoryBySlug,
  useCategoryTree,
  useProductsByCategory,
  useCategoryPriceRanges,
} from "@/hooks/useProducts";
import { ProductType } from "@/types/product.type.ts_";
import { ProductCard } from "@/components/Home/ProductCard";
import { filterAvailableProducts } from "@/utils/productUtils";

interface FilterState {
  category?: string;
  subCategories: string[];
  brands: string[];
  priceRange: [number, number];
  sort: string;
  search: string;
}

const SORT_OPTIONS = [
  { value: '{"createdAt": -1}', label: "Newest" },
  { value: '{"variants.options.price": 1}', label: "Price: Low to High" },
  { value: '{"variants.options.price": -1}', label: "Price: High to Low" },
  { value: '{"analytics.views": -1}', label: "Most Popular" },
  { value: '{"rating": -1}', label: "Customer Rating" },
];



export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = params.categoryId as string;

  const [filters, setFilters] = useState<FilterState>({
    category: categoryId,
    subCategories: [],
    brands: [],
    priceRange: [0, 10000000],
    sort: '{"createdAt": -1}',
    search: "",
  });

  const [page, setPage] = useState(1);
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices");

  // Fetch category data
  const { data: categoryData } = useCategoryBySlug(categoryId);

  // Fetch category tree for subcategories
  const { data: categoryTree } = useCategoryTree(categoryData?.category?._id);

  // Fetch price ranges for this category
  const { data: priceRangesData } = useCategoryPriceRanges(categoryData?.category?._id || "");

  // Get min and max values from price ranges data
  const priceRangeLimits = useMemo(() => {
    if (!priceRangesData?.priceRanges?.length) {
      return { min: 0, max: 10000000 };
    }
    const ranges = priceRangesData.priceRanges;
    return {
      min: Math.min(...ranges.map((r: any) => r.min)),
      max: Math.max(...ranges.map((r: any) => r.max))
    };
  }, [priceRangesData]);

  // Update filters when price ranges data loads
  useEffect(() => {
    if (priceRangeLimits) {
      setFilters(prev => ({
        ...prev,
        priceRange: [priceRangeLimits.min, priceRangeLimits.max]
      }));
    }
  }, [priceRangeLimits]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: priceRangesData?.currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle slider price range change
  const handleSliderChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: value as [number, number]
    }));
    setSelectedPriceRange("All Prices"); // Reset radio selection when slider is used
  };


  // Build price ranges array with API data
  const PRICE_RANGES = useMemo(() => {
    const ranges = [{ label: "All Prices", value: "" }];
    if (priceRangesData?.priceRanges) {
      ranges.push(...priceRangesData.priceRanges.map((range: any) => ({
        label: range.label,
        value: range.value
      })));
    }
    return ranges;
  }, [priceRangesData]);

  // Build product filters
  const productFilters = useMemo(() => {
    const filterParams: any = {
      categoryId: categoryData?.category?._id || "",
      page,
      limit: 12,
    };

    if (filters.subCategories.length > 0) {
      filterParams.subCategory1 = filters.subCategories[0];
      if (filters.subCategories[1])
        filterParams.subCategory2 = filters.subCategories[1];
      if (filters.subCategories[2])
        filterParams.subCategory3 = filters.subCategories[2];
      if (filters.subCategories[3])
        filterParams.subCategory4 = filters.subCategories[3];
    }

    if (filters.brands.length > 0) {
      filterParams.brand = filters.brands.join(",");
    }

    // Check if custom slider range is being used
    if (filters.priceRange[0] !== priceRangeLimits.min || filters.priceRange[1] !== priceRangeLimits.max) {
      filterParams.priceRange = `${filters.priceRange[0]}-${filters.priceRange[1]}`;
    } else if (selectedPriceRange !== "All Prices") {
      const range = PRICE_RANGES.find((r) => r.label === selectedPriceRange);
      if (range?.value) {
        filterParams.priceRange = range.value;
      }
    }

    if (filters.sort) {
      filterParams.sort = filters.sort;
    }

    console.log('Frontend Request Params:', filterParams);
    return filterParams;
  }, [categoryData, filters, selectedPriceRange, page, priceRangeLimits, PRICE_RANGES]);

  // Fetch products with filters
  const { data: productsData, isLoading } =
    useProductsByCategory(productFilters);

  console.log("CategoryPage - productsData:", productsData);

  const products = productsData?.products || [];
  const availableBrands = productsData?.brands || [];
  const subcategories = categoryTree?.categories || [];
  const pagination = productsData?.pagination || {};

  const toggleBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      subCategories: prev.subCategories.includes(subcategoryId)
        ? prev.subCategories.filter((s) => s !== subcategoryId)
        : [...prev.subCategories, subcategoryId],
    }));
  };

  const handleSortChange = (sortValue: string) => {
    setFilters((prev) => ({ ...prev, sort: sortValue }));
  };

  const handlePriceRangeChange = (range: string) => {
    setSelectedPriceRange(range);
    // Reset slider to full range when radio button is selected
    if (range === "All Prices") {
      setFilters(prev => ({
        ...prev,
        priceRange: [priceRangeLimits.min, priceRangeLimits.max]
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      category: categoryId,
      subCategories: [],
      brands: [],
      priceRange: [priceRangeLimits.min, priceRangeLimits.max],
      sort: '{"createdAt": -1}',
      search: "",
    });
    setSelectedPriceRange("All Prices");
  };

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Shop by Categories", href: "/home/categories" },
    { label: categoryData?.category?.name || "Category", href: null },
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item?.href);
    }
  };

  const SidebarContent = ({ type }: { type: string }) => (
    <div className={` space-y-6`}>
      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div>
          <h3 className="font-bold text-sm lg:text-lg mb-4">SUBCATEGORIES</h3>
          <div className="space-y-2 bg-white p-3">
            {subcategories.map((subcategory: any) => (
              <div
                key={subcategory._id}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={subcategory._id}
                  checked={filters.subCategories.includes(subcategory._id)}
                  onCheckedChange={() => toggleSubcategory(subcategory._id)}
                />
                <Label htmlFor={subcategory._id} className="text-sm">
                  {subcategory.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Price Range */}
      <div>
        <h3 className="font-bold text-sm  lg:text-lg mb-4">PRICE RANGE</h3>
        <div className="space-y-4 bg-white p-3">
          <div className="space-y-3">
            <Slider
              value={filters.priceRange}
              onValueChange={handleSliderChange}
              min={priceRangeLimits.min}
              max={priceRangeLimits.max}
              step={Math.max(1, Math.floor((priceRangeLimits.max - priceRangeLimits.min) / 100))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-800 font-medium">
              <span>{formatCurrency(filters.priceRange[0])}</span>
              <span>{formatCurrency(filters.priceRange[1])}</span>
            </div>
          </div>
          <RadioGroup
            value={selectedPriceRange}
            onValueChange={handlePriceRangeChange}
          >
            {PRICE_RANGES.map((range) => (
              <div key={range.label} className="flex items-center space-x-2">
                <RadioGroupItem value={range.label} id={range.label} />
                <Label htmlFor={range.label}>{range.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
      {/* Brands */}
      <div>
        <h3 className="font-bold text-sm  lg:text-lg mb-4">BRANDS</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto bg-white p-3">
          {availableBrands.map((brand: string) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={brand}
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={brand} className="text-sm">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50   mx-auto">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8  md:py-8 lg:py-10 font-roboto  ">
        {/* Header */}
        <nav className="mt-3">
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />
        </nav>

        <div className="flex w-full">
          <div className="w-[30%] md:block hidden">
            <h1 className="text-xl md:text-3xl font-bold mb-4 col-span-1">
              {categoryData?.category?.name || "Category"}
            </h1>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className=" rounded-lg p-6 sticky top-6">
                <SidebarContent type="large" />
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="w-[70%] md:w-full ">
            <div className="mb-8 grid grid-cols-2">
              <div className="flex flex-col  gap-4 col-span-1">
                <div className="flex-1 font-normal hidden md:block">
                  <div className=" flex w-full  bg-white  py-[5px] border border-[#ADADAD] rounded-3xl">
                    <button className=" border-r px-2 ">
                      <Search className="w-2 h-2 md:w-4 md:h-4" color="black" />
                    </button>
                    <input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className="flex-1 border-0 px-2 w-full pl-[2px] outline-0 text-[#121212] placeholder:text-sm"
                    />

                    <button className="py-[4px] font-normal md:py-2 w-[80px] text-xs md:w-[90px] lg:w-[100px] bg-secondary text-white placeholder:text-xs  rounded-4xl mr-1  ">
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="col-span-1  w-full flex  justify-end">
                <div className="flex  items-center space-x-2 ">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Sort by:
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-w-[140px] justify-between"
                      >
                        {SORT_OPTIONS.find((opt) => opt.value === filters.sort)
                          ?.label || "Sort"}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {SORT_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="flex ">
              <div className="flex-1">
                <div className="flex items-center space-x-4 w-full lg:w-auto">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <div className="py-6">
                        <SidebarContent type="mobile" />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Active Filters and Results Count */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F1F4F9] rounded-md py-[6px] px-2 mb-3">
                  <div className="flex items-center space-x-2 text-sm flex-wrap">
                    <span className="text-gray-600">Active Filters:</span>
                    {filters.brands.map((brand) => (
                      <Badge
                        key={brand}
                        variant="secondary"
                        className="bg-gray-200 text-gray-700 cursor-pointer"
                        onClick={() => toggleBrand(brand)}
                      >
                        {brand} ×
                      </Badge>
                    ))}
                    {selectedPriceRange !== "All Prices" && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-200 text-gray-700 cursor-pointer"
                        onClick={() => setSelectedPriceRange("All Prices")}
                      >
                        {selectedPriceRange} ×
                      </Badge>
                    )}
                    {(filters.brands.length > 0 ||
                      selectedPriceRange !== "All Prices" ||
                      filters.priceRange[0] !== priceRangeLimits.min ||
                      filters.priceRange[1] !== priceRangeLimits.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold">{pagination?.total || 0}</span>{" "}
                    Results
                  </div>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6 mb-8">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-4 animate-pulse"
                      >
                        <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                        <div className="bg-gray-200 h-4 rounded mb-2"></div>
                        <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                        <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6 mb-8">
                    {products.map(
                      (product: ProductType) => (
                        <ProductCard key={product._id} product={product} />
                      )
                    )}
                    {products.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500">
                          No products found matching your filters.
                        </p>
                        <Button onClick={clearFilters} className="mt-4">
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {pagination?.pages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mb-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination?.hasPrev}
                      onClick={() => {
                        setPage(page - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Prev
                    </Button>
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={page === pageNum ? "default" : "ghost"}
                          onClick={() => {
                            setPage(pageNum);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={
                            page === pageNum
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : ""
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {pagination.pages > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPage(pagination.pages);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {pagination.pages}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination?.hasNext}
                      onClick={() => {
                        setPage(page + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
