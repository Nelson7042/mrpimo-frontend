import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCartLength } from "@/stores/cartHook";
import AuthenticationModal from "@/app/(auth)/authenticationModal";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchSuggestion } from "@/types/search.types";
import { useWishlist } from "@/hooks/useWishlist";
import { useUserStore } from "@/stores/useUserStore";
import { useCartSync } from "@/hooks/useCartSync";
import { useRouter } from "next/navigation";
import { useVendorStore } from "@/stores/useVendorStore";
import AuthenticationModalVendor from "@/app/(auth)/authenticationModalVendor";
import { resetAllStores } from "@/stores/resetStore";

const Header = () => {
  const [isSell, setIsSell] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const cartLength = useCartLength();
  const router = useRouter();

  const { wishlistCount } = useWishlist();
  const { openModal } = useAuthModalStore();
  const { user } = useUserStore();
  const { vendor } = useVendorStore();
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: suggestionsData } = useSearchSuggestions(debouncedQuery, 5);
  const { setAuthType } = useAuthModalStore();

  // Initialize cart sync
  useCartSync();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSellClick = () => {
    if (!vendor) {
      setAuthType("vendor");
      setIsSell(!isSell);
    } else {
      // console.log("vendor", vendor);
      router.push("/vendor/dashboard");
    }
  };

  const handleProfileClick = () => {
    resetAllStores()
    if (!user) {
      // Store the intended redirect URL before opening modal
      sessionStorage.setItem('redirectAfterLogin', '/home/user');
      openModal();
    } else {
      router.push("/home/user");
    }
  };
  const handlecloseModal = () => {
    setIsSell(false);
    setAuthType("");
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      window.location.href = `/home/search?q=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const pages = [
    {
      name: "Shop",
      // link: "/home",
    },
    {
      name: "Best Deals",
      link: "/about",
    },
    {
      name: "Sell",
      link: "/contact",
    },
    {
      name: "Track Order ",
      link: "/contact",
    },
    {
      name: "Customer Care",
      link: "/contact",
    },
  ];
  return (
    <header className="text-white">
      {/* Top banner - responsive */}
      <div className="w-full bg-primary">
        <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-20 text-center py-2 text-xs sm:text-sm lg:text-base font-medium flex justify-between items-center">
          <span className="truncate md:block hidden">
            Welcome to Mprimo online store...
          </span>
          {/* Logo */}
          <Link href="/home" className="shrink-0 block md:hidden">
            <div className="flex items-center">
              <img
                src="/images/mprimo-logo2.png"
                alt="mprimoLogo image"
                className="h-[32px] w-[80px] sm:h-[36px] sm:w-[100px] md:h-[42px] md:w-[120px] lg:h-[48px] lg:w-[180px]"
              />
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-3 font-normal">
            {pages.map((page, index) => (
              <Link href={page?.link || "#"} key={index}>
                <span className="mx-2 hover:underline">{page.name}</span>
              </Link>
            ))}
          </div>

          <button
            onClick={handleSellClick}
            className="text-[#121212]  px-3 sm:px-4 py-2 lg:py-3  lg:w-[180px] rounded-md bg-white font-normal  text-xs sm:text-sm lg:text-base"
          >
            Sale
          </button>
        </div>
      </div>

      {/* Main header */}
      <div className="w-full bg-primary">
        <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Mobile menu button */}
            {/* <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="lg:hidden text-white hover:bg-blue-700 p-2"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <h2 className="text-lg font-semibold mb-4">Menu</h2>
                  {pages.map((page, index) => (
                    <Link
                      href={page?.link || "#"}
                      key={index}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="block py-2 px-4 hover:bg-gray-100 rounded">
                        {page.name}
                      </span>
                    </Link>
                  ))}
                  <div className="pt-4 border-t">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full justify-between">
                          ENG <ChevronDown />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuItem onClick={() => openModal()}>
                          Spanish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </SheetContent>
            </Sheet> */}
            <div></div>

            {/* Logo */}
            <Link href="/home" className="flex-shrink-0 hidden md:block">
              <div className="flex items-center">
                <img
                src="/images/mprimo-logo2.png"
                  alt="mprimoLogo image"
                  className="h-[28px] w-[80px] sm:h-[36px] sm:w-[100px] md:h-[42px] md:w-[120px] lg:h-[48px] lg:w-[180px]"
                />
              </div>
            </Link>

            {/* Desktop Search bar */}
            <div className="flex-1 font-normal hidden lg:block mx-4 relative">
              <div className="flex mx-auto max-w-2xl bg-white py-[5px] rounded-full">
                <button className="border-r px-3">
                  <Search className="w-4 h-4" color="black" />
                </button>
                <input
                  placeholder="Search for anything..."
                  className="flex-1 border-0 px-3 outline-0 text-[#121212] text-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                />
                <button
                  onClick={handleSearchSubmit}
                  className="py-2 px-4 text-xs bg-primary text-white rounded-full mr-1 hover:bg-blue-700"
                >
                  Search
                </button>
              </div>

              {showSuggestions && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-2xl mx-auto">
                  <div className="py-2">
                    {suggestionsData?.suggestions &&
                      suggestionsData.suggestions.map((suggestion) => (
                        <Link
                          key={suggestion._id}
                          href={`/home/product-details/${suggestion.slug}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0">
                            {suggestion.images?.[0] && (
                              <img
                                src={suggestion.images[0]}
                                alt={suggestion.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {suggestion.category?.main?.name}
                            </p>
                          </div>
                          {suggestion.variants?.[0]?.options?.[0]?.price && (
                            <div className="text-sm font-semibold text-gray-900">
                              ₦
                              {suggestion.variants[0].options[0].price.toLocaleString()}
                            </div>
                          )}
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile search button */}
              <button
                onClick={toggleSearch}
                className="text-white hover:bg-blue-700 lg:hidden p-2 rounded"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleProfileClick()}
                className="text-white hover:bg-blue-700 p-2 rounded cursor-pointer"
              >
                <User className="w-5 h-5" />
              </button>
                <Link
                  href="/home/wishlist"
                  className="text-white   hover:bg-blue-700 relative p-2 rounded"
                >
                  <Heart className="w-5 h-5" />
                  {isMounted && wishlistCount > 0 && (
                    <div className="absolute top-1 right-[2px] bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white">
                      {wishlistCount ?? 0}
                    </div>
                  )}
                </Link>

                <Link
                  href="/home/my-cart"
                  className="text-white   hover:bg-blue-700 relative p-2 rounded"
                >
                    <ShoppingCart className="w-5 h-5" />
                    {cartLength > 0 && (
                      <div className="absolute top-1 right-[2px] bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white">
                        {cartLength}
                      </div>
                    )}
                </Link>

              {/* Desktop language selector */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-transparent hover:bg-white hover:text-[#121212] text-white">
                      ENG <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-36" align="end">
                    <DropdownMenuItem onClick={() => openModal()}>
                      Spanish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          {isSearchOpen && (
            <div className="mt-2 lg:hidden relative">
              <div className="flex items-center bg-white py-[2px] px-3 rounded-full">
                <Search className="w-4 h-4 text-gray-500 mr-2 mt-1" />
                <input
                  placeholder="Search for anything..."
                  className="flex-1 border-0 outline-0 text-[#121212] text-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyUp={(e) => e.key === "Enter" && handleSearchSubmit()}
                  autoFocus
                />
                <button
                  onClick={handleSearchSubmit}
                  className="py-1 md:py-2 px-3 text-[10px] leading-tight bg-primary text-white rounded-md ml-2"
                >
                  Search
                </button>
              </div>

              {showSuggestions && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {suggestionsData?.suggestions &&
                      suggestionsData.suggestions.map((suggestion) => (
                        <Link
                          key={suggestion._id}
                          href={`/home/product-details/${suggestion.slug}`}
                          onClick={() => {
                            handleSuggestionClick(suggestion);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0">
                            {suggestion.images?.[0] && (
                              <img
                                src={suggestion.images[0]}
                                alt={suggestion.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {suggestion.category?.main?.name}
                            </p>
                          </div>
                          {suggestion.variants?.[0]?.options?.[0]?.price && (
                            <div className="text-xs font-semibold text-gray-900">
                              ₦
                              {suggestion.variants[0].options[0].price.toLocaleString()}
                            </div>
                          )}
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AuthenticationModalVendor isOpen={isSell} close={handlecloseModal} />
    </header>
  );
};

export default Header;
