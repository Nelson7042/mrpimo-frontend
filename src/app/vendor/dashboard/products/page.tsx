"use client";

import { useVendorProducts } from "@/hooks/queries";
import { useProductStore } from "@/stores/useProductStore";
import { ProductType } from "@/types/product.type";
import VariantPriceDisplay from "@/components/VariantPriceDisplay";
import {
  Plus,
  ChevronDown,
  Filter,
  Search,
  FolderMinus,
  Ellipsis,
  X,
  Eye,
  Trash,
  Upload,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import ProductImport from "./create-product/(components)/ProductImport";
import ProductsPageSkeleton from "./ProductsPageSkeleton";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {};

const categories = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
  "Automobile & Parts",
  "Industrial & Business",
  "Baby, Kids & Toys",
  "Sport & Outdoors",
  "Food & Groceries",
  "Others & Miscellaneous",
];

const ProductsPage = () => {
  const { listedProducts, setListedProducts } = useProductStore();
  const { vendor } = useVendorStore();
  const [productList, setProductList] = useState<ProductType[] | []>(
    listedProducts
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "outOfStock" | "draft"
  >("all");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState<
    ProductType[] | []
  >([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showProductImport, setShowProductImport] = useState(false);

  const { data: vendorProducts, isLoading } = useVendorProducts(vendor?._id!);
  const router = useRouter();

  useEffect(() => {
    if (vendorProducts) {
      setListedProducts(vendorProducts);
      setProductList(vendorProducts);
    }
  }, [vendorProducts]);

  // Calculate pagination on mount and when filters change
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(productList.length / itemsPerPage);
    setTotalPages(total);
    // Get current products
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayedProducts(productList.slice(indexOfFirstItem, indexOfLastItem));
  }, [currentPage, productList, itemsPerPage]);


  // Handle page changes
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      // Show dots or pages
      if (currentPage > 3) {
        pageNumbers.push("...");
      }
      // Show current page and neighbors
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      // Show dots or pages
      if (currentPage < totalPages - 2) {
        pageNumbers.push("...");
      }
      // Always show last page
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const toggleOffer = (id: string) => {
    const updatedProducts = listedProducts.map((product) => {
      if (product._id !== id) return product;

      if (product.inventory?.listing?.type === "instant") {
        return {
          ...product,
          inventory: {
            ...product.inventory,
            listing: {
              ...product.inventory.listing,
              instant: {
                ...product.inventory.listing.instant!,
                acceptOffer: !product.inventory.listing.instant?.acceptOffer,
              },
            },
          },
        };
      }

      return product;
    });

    setProductList(updatedProducts);
    setListedProducts(updatedProducts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleDropdown = (productId: string) => {
    setOpenDropdownId((prev) => (prev === productId ? null : productId));
  };

  const handleDelete = (productId: string) => {
    console.log("Delete:", productId);
    // trigger confirmation or delete
  };

  const handleCloseDropdown = () => {
    setOpenDropdownId(null);
  };

  if (isLoading) return <ProductsPageSkeleton />;

  return (
    <div
      className="bg-[#f6f6f6] font-[family-name:var(--font-alexandria)]"
      style={{ height: "calc(100vh - 100px)" }}
    >
      <div className="p-4 md:p-4 lg:p-10 h-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-4 md:gap-0">
          <div className="">
            <div className="flex overflow-x-auto scrollbar-hide gap-x-2 lg:gap-x-4 items-center text-[#b5b4b4] mb-1">
              <div
                className={`text-xs md:text-lg whitespace-nowrap border-r pr-2 md:pr-4 cursor-pointer ${
                  activeTab === "all"
                    ? "text-[#002f7a] font-semibold"
                    : "text-[#797979]"
                }`}
                onClick={() => {
                  setActiveTab("all");
                  setProductList(listedProducts);
                }}
              >
                All products
              </div>
              <div
                className={`text-xs md:text-lg whitespace-nowrap border-r px-2 md:px-4 cursor-pointer ${
                  activeTab === "active" ? "text-[#002f7a] font-semibold" : ""
                }`}
                onClick={() => {
                  setActiveTab("active");
                  setProductList(
                    listedProducts?.filter(
                      (product: ProductType) => product.status === "active"
                    )
                  );
                }}
              >
                Active Listings
              </div>
              <div
                className={`text-xs md:text-lg whitespace-nowrap border-r px-2 md:px-4 cursor-pointer ${
                  activeTab === "outOfStock"
                    ? "text-[#002f7a] font-semibold"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab("outOfStock");
                  setProductList(
                    listedProducts?.filter(
                      (product: ProductType) => product.status === "outOfStock"
                    )
                  );
                }}
              >
                Out of Stock
              </div>
              <div
                className={`text-xs md:text-lg whitespace-nowrap px-2 md:px-4 cursor-pointer ${
                  activeTab === "draft" ? "text-[#002f7a] font-semibold" : ""
                }`}
                onClick={() => {
                  setActiveTab("draft");
                  // setProductList(
                  //   vendorProducts.filter((product: ProductType) => product.status === "draft")
                  // );
                }}
              >
                Draft
              </div>
            </div>
            <p className="font-[family-name:var(--font-poppins)] text-[11px] md:text-xs text-[#323232]">
              Welcome back, Bovie! Here's what is happening with your store
              today.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              className="bg-[#002f7a] text-white px-4 lg:px-6 py-2 md:p-2 lg:py-3 rounded-md flex gap-x-2 items-center cursor-pointer hover:bg-[#00245a] transition-colors flex-1 md:flex-none justify-center"
              onClick={() => {
                router.push("/vendor/dashboard/products/create-product");
              }}
            >
              <p className="whitespace-nowrap cursor-pointer md:hidden xl:block">
                Add Product
              </p>
              <Plus size={18} />
            </button>
            <button
              className="bg-green-600 text-white px-4 lg:px-6 py-2 md:p-2 lg:py-3 rounded-md flex gap-x-2 items-center cursor-pointer hover:bg-green-700 transition-colors flex-1 md:flex-none justify-center"
              onClick={() => setShowProductImport(true)}
            >
              <p className="whitespace-nowrap cursor-pointer md:hidden xl:block">
                Import
              </p>
              <Upload size={18} />
            </button>
          </div>
        </div>

        {productList?.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="grid md:grid-cols-6 lg:grid-cols-12 gap-4 p-5 border-b border-gray-300 items-center text-sm">
                <div className="relative col-span-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search products"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-md px-3 py-2"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="relative col-span-2">
                  <div
                    className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                  >
                    <span className="text-xs">Category</span>
                    {!showCategoryDropdown ? (
                      <ChevronDown size={16} className="ml-2 text-gray-400" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="ml-2 text-gray-400 rotate-180"
                      />
                    )}
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <ul className="py-1">
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          All Categories
                        </li>
                        {categories.map((option: string) => (
                          <li
                            key={option}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                            onClick={() => {
                              setCategory(option);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="relative col-span-2">
                  <button
                    className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    disabled={activeTab !== "all"}
                  >
                    <span className="text-xs">Status</span>
                    {!showStatusDropdown ? (
                      <ChevronDown size={16} className="ml-2 text-gray-400" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="ml-2 text-gray-400 rotate-180"
                      />
                    )}
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute mt-1 w-40 md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <ul className="py-1">
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          All Statuses
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                          <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>
                          Active
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                          <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                          Draft
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                          <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                          Unavailable
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="relative col-span-2">
                  <div
                    className="flex items-center border border-gray-200 rounded-md px-3 py-2 cursor-pointer"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <span className="text-xs mr-2">Filter</span>
                    <Filter size={12} className="text-gray-400" />
                    {!showFilterDropdown ? (
                      <ChevronDown size={16} className="ml-2 text-gray-400" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="ml-2 text-gray-400 rotate-180"
                      />
                    )}
                  </div>

                  {showFilterDropdown && (
                    <div className="absolute mt-1 w-40 md:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 ">
                      <ul className="py-1">
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b">
                          Filter By
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                          Category
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                          Status
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-200">
                          Date
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center">
                          Recently Added
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Tablet and Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-[#f2f7ff] text-black">
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm ">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm whitespace-nowrap">
                        Accept Offer
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedProducts.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-900">
                          {product?.createdAt
                            ? new Date(product.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                          {product?.name}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                          <span className="">
                            {Array.isArray(product?.category?.sub) &&
                            product.category?.sub.length > 0
                              ? typeof product.category.sub[
                                  product.category.sub.length - 1
                                ] !== "string"
                                ? (
                                    product.category.sub[
                                      product.category.sub.length - 1
                                    ] as { name: string }
                                  )?.name
                                : ""
                              : typeof product?.category?.main !== "string"
                              ? (product?.category?.main as { name: string })
                                  ?.name
                              : ""}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-900">
                          <VariantPriceDisplay product={product} />
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-900">
                          {(() => {
                            const hasVariants =
                              product.variants && product.variants.length > 0;

                            if (hasVariants) {
                              const allOptions = product.variants?.flatMap(
                                (v: any) => v.options
                              ) || [];
                              const totalQuantity = allOptions.reduce(
                                (sum: number, o: any) =>
                                  sum + (o.quantity || 0),
                                0
                              );
                              return totalQuantity;
                            }

                            // Fallback to base quantity
                            return product.inventory?.listing?.type === "instant"
                              ? product.inventory.listing.instant?.quantity ??
                                  "N/A"
                              : product.inventory?.listing?.auction?.quantity ??
                                  "N/A";
                          })()}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                          {product.inventory?.listing?.type === "instant" ? (
                            <div
                              className={`w-8 h-4 rounded-full flex items-center cursor-pointer ${
                                product.inventory.listing.instant?.acceptOffer
                                  ? "bg-blue-600 justify-end"
                                  : "bg-gray-300 justify-start"
                              }`}
                              onClick={() => toggleOffer(product?._id!)}
                            >
                              <div className="size-3 bg-white rounded-full mx-0.5" />
                            </div>
                          ) : (
                            <p>N/A</p>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              product?.status || ""
                            )}`}
                          >
                            {(product?.status?.charAt(0).toUpperCase() || "") +
                              (product?.status?.slice(1) || "")}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap relative">
                          <button
                            onClick={() => toggleDropdown(product?._id!)}
                            className="cursor-pointer"
                          >
                            <Ellipsis size={20} className="text-gray-500" />
                          </button>

                          {openDropdownId === product._id && (
                            <div className="absolute right-0 -mt-10 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <div className="flex justify-between items-center px-2 py-1 border-b border-gray-200">
                                <span className="text-sm font-medium">
                                  Actions
                                </span>
                                <button onClick={handleCloseDropdown}>
                                  <X
                                    size={16}
                                    className="text-gray-500 cursor-pointer"
                                  />
                                </button>
                              </div>
                              <ul className="">
                                <li
                                  className="p-2 hover:bg-gray-100 cursor-pointer flex gap-x-1 items-center"
                                  onClick={() =>
                                    router.push(
                                      `/vendor/dashboard/products/${product.slug}`
                                    )
                                  }
                                >
                                  <Eye size={14} />
                                  <p className="text-xs">View</p>
                                </li>
                                 <li
                                  className="p-2 hover:bg-gray-100 cursor-pointer flex gap-x-1 items-center"
                                  onClick={() =>
                                    router.push(
                                      `/vendor/dashboard/products/edit/${product.slug}`
                                    )
                                  }
                                >
                                  <Edit size={14} />
                                  <p className="text-xs">Edit Product</p>
                                </li>
                                <li
                                  className="p-2 hover:bg-gray-100 cursor-pointer flex gap-x-1 items-center"
                                  onClick={() =>
                                    console.log("Delete", product?._id!)
                                  }
                                >
                                  <Trash size={14} />
                                  <p className="text-xs">Delete</p>
                                </li>
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-4 p-4">
                {displayedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white border border-gray-300 rounded-lg p-4 shadow-md"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{product.name}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          product.status || ""
                        )}`}
                      >
                        {(product.status?.charAt(0).toUpperCase() || "") +
                          (product.status?.slice(1) || "")}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-200 rounded-md overflow-hidden">
                      {[
                        {
                          label: "Date",
                          value: product?.createdAt
                            ? new Date(product.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A",
                        },
                        {
                          label: "Category",
                          value:
                            Array.isArray(product?.category?.sub) &&
                            product.category?.sub.length > 0
                              ? typeof product.category.sub[
                                  product.category.sub.length - 1
                                ] !== "string"
                                ? (
                                    product.category.sub[
                                      product.category.sub.length - 1
                                    ] as {
                                      name: string;
                                    }
                                  )?.name
                                : ""
                              : typeof product?.category?.main !== "string"
                              ? (product?.category?.main as { name: string })
                                  ?.name
                              : "",
                        },
                        {
                          label: "Price",
                          value: (() => {
                            const hasVariants =
                              product.variants && product.variants.length > 0;

                            if (hasVariants) {
                              const allOptions = product.variants?.flatMap(
                                (v: any) => v.options
                              ) || [];
                              const prices = allOptions
                                .map((o: any) => o.price)
                                .filter((p) => p > 0);

                              if (prices.length === 0) return "N/A";

                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);
                              const currency =
                                typeof product.country !== "string" && product.country
                                  ? product.country.currency
                                  : "";

                              return `${currency} ${
                                minPrice === maxPrice
                                  ? minPrice
                                  : `${minPrice} - ${maxPrice}`
                              }`;
                            }

                            if (product.inventory?.listing?.type === "instant") {
                              const currency =
                                typeof product.country !== "string" && product.country
                                  ? product.country.currency
                                  : "";
                              return `${currency} ${
                                product.inventory.listing.instant?.price ??
                                "N/A"
                              }`;
                            }

                            return "N/A";
                          })(),
                        },
                        {
                          label: "Stock",
                          value: (() => {
                            const hasVariants =
                              product.variants && product.variants.length > 0;

                            if (hasVariants) {
                              const allOptions = product.variants?.flatMap(
                                (v: any) => v.options
                              ) || [];
                              return allOptions.reduce(
                                (sum: number, o: any) =>
                                  sum + (o.quantity || 0),
                                0
                              );
                            }

                            return product.inventory?.listing?.type === "instant"
                              ? product.inventory.listing.instant?.quantity ??
                                  "N/A"
                              : product.inventory?.listing?.auction?.quantity ??
                                  "N/A";
                          })(),
                        },
                      ].map((item, index) => (
                        <div
                          key={item.label}
                          className={`flex justify-between items-center px-2 py-2 text-xs ${
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          } text-gray-500`}
                        >
                          <span className="font-medium">{item.label}:</span>
                          <span className="text-right text-gray-700">
                            {item.value}
                          </span>
                        </div>
                      ))}

                      {/* Accept Offer Toggle */}
                      {product.inventory?.listing?.type === "instant" && (
                        <div className="flex justify-between items-center px-2 py-2 text-xs bg-white text-gray-500">
                          <span className="font-medium">Accept Offer:</span>
                          <div
                            className={`w-8 h-4 rounded-full flex items-center cursor-pointer ${
                              product.inventory.listing.instant?.acceptOffer
                                ? "bg-blue-600 justify-end"
                                : "bg-gray-300 justify-start"
                            }`}
                            onClick={() => toggleOffer(product?._id!)}
                          >
                            <div className="size-3 bg-white rounded-full mx-0.5"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <button
                        className="bg-primary text-white px-3 py-2 rounded-md text-sm"
                        onClick={() =>
                          router.push(
                            `/vendor/dashboard/products/${product.slug}`
                          )
                        }
                      >
                        View Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-2 md:mt-0 px-4 py-5 bg-white border-t border-gray-200 sm:px-6 flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, productList.length)}
                    </span>{" "}
                    of <span className="font-medium">{productList.length}</span>{" "}
                    products
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {getPageNumbers().map((pageNumber, index) =>
                      pageNumber === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-700"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${pageNumber}`}
                          onClick={() => goToPage(pageNumber as number)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium ${
                            currentPage === pageNumber
                              ? "bg-blue-50 text-blue-600"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    )}

                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md ${
                    currentPage === 1
                      ? "text-gray-300 bg-gray-50"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <div className="text-xs text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </div>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-300 bg-gray-50"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {vendorProducts && vendorProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm flex flex-col gap-y-4 justify-center items-center p-2 h-[85%] xl:h-[92%] animate-fade-in-up">
                <div className="flex gap-x-2 items-center">
                  <p className="text-xl text-gray-600">No product listed</p>
                  <FolderMinus
                    size={32}
                    className="text-[#002f7a] animate-bounce-slow"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    className="bg-[#002f7a] text-white px-4 md:px-6 py-2 md:py-3 rounded-md flex gap-x-2 items-center cursor-pointer hover:bg-[#00245a] transition-all duration-300 transform hover:scale-[1.03] flex-1 md:flex-none justify-center"
                    onClick={() => {
                      router.push("/vendor/dashboard/products/create-product");
                    }}
                  >
                    <p className="whitespace-nowrap cursor-pointer">
                      Add Product
                    </p>
                    <Plus size={18} />
                  </button>
                  <button
                    className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-md flex gap-x-2 items-center cursor-pointer hover:bg-green-700 transition-all duration-300 transform hover:scale-[1.03] flex-1 md:flex-none justify-center"
                    onClick={() => setShowProductImport(true)}
                  >
                    <p className="whitespace-nowrap cursor-pointer">Import</p>
                    <Upload size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mt-20">
                <p className="text-xl text-[#2563EB] font-semibold">
                  Nothing to display
                </p>
              </div>
            )}
          </>
        )}

        {showProductImport && (
          <ProductImport onClose={() => setShowProductImport(false)} />
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
