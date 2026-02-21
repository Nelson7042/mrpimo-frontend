import {
  Search,
  ShoppingCart,
  Heart,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartLength } from "@/stores/cartHook";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchSuggestion } from "@/types/search.types";
import { useWishlist } from "@/hooks/useWishlist";
import { useUserStore } from "@/stores/useUserStore";
import { useUserProfile } from "@/hooks/useUser";
import { useCartSync } from "@/hooks/useCartSync";
import { useRouter } from "next/navigation";
import { useVendorStore } from "@/stores/useVendorStore";
import AuthenticationModalVendor from "@/app/(auth)/authenticationModalVendor";
import { ProfileCircle } from "iconsax-react";
import { formatProductPrice } from "@/utils/formatPrice";
import dynamic from "next/dynamic";
import { useLogoutUser } from "@/hooks/mutations";
import { resetAllStores } from "@/stores/resetStore";
import { toast } from "react-toastify";
import { convertFromUSD, getCurrencySymbol } from "@/utils/currencyService";

// Dynamically import the vendor modal to avoid SSR issues
const VendorRegistrationModal = dynamic(
  () => import("@/components/vendor/VendorRegistrationModal"),
  { ssr: false }
);

const Header = () => {
  const [isSell, setIsSell] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [convertedBalance, setConvertedBalance] = useState<number | null>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const cartLength = useCartLength();
  const router = useRouter();

  const { wishlistCount } = useWishlist();
  const { openModal } = useAuthModalStore();
  const { user } = useUserStore();
  const { vendor } = useVendorStore();
  const { data: profileData } = useUserProfile(!!user);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { data: suggestionsData } = useSearchSuggestions(debouncedQuery, 5);
  const { setAuthType } = useAuthModalStore();

  // Initialize cart sync
  useCartSync();

  const logoutMutation = useLogoutUser();

  // Convert wallet balance to user's currency
  useEffect(() => {
    const convertBalance = async () => {
      const balanceUSD = profileData?.fiatWallet?.balances?.available || 0;
      const userCurrency = user?.preferences?.currency || 'USD';
      
      if (balanceUSD > 0 && userCurrency !== 'USD') {
        const converted = await convertFromUSD(balanceUSD, userCurrency);
        setConvertedBalance(converted);
      } else {
        setConvertedBalance(balanceUSD);
      }
    };
    
    if (profileData?.fiatWallet?.balances?.available !== undefined) {
      convertBalance();
    }
  }, [profileData?.fiatWallet?.balances?.available, user?.preferences?.currency]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close profile modal on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileModalRef.current && !profileModalRef.current.contains(e.target as Node)) {
        setShowProfileModal(false);
      }
    };
    if (showProfileModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileModal]);

  const handleSellClick = () => {
    // If user is already a vendor, go to dashboard
    if (vendor) {
      router.push("/vendor/dashboard");
      return;
    }
    
    // If user is not logged in, show auth modal and store intent
    if (!user) {
      sessionStorage.setItem("pendingVendorRegistration", "true");
      openModal();
      return;
    }
    
    // User is logged in but not a vendor - show vendor registration modal
    setShowVendorModal(true);
  };

  // Check for pending vendor registration after user logs in
  useEffect(() => {
    if (user && !vendor && isMounted) {
      const pendingRegistration = sessionStorage.getItem("pendingVendorRegistration");
      if (pendingRegistration === "true") {
        sessionStorage.removeItem("pendingVendorRegistration");
        // Small delay to ensure modal renders properly
        setTimeout(() => {
          setShowVendorModal(true);
        }, 500);
      }
    }
  }, [user, vendor, isMounted]);

  const handleProfileClick = () => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "/home/user");
      openModal();
    } else {
      setShowProfileModal((prev) => !prev);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        resetAllStores();
        toast.success("Logout Successful");
        window.location.href = "/home";
      },
      onError: () => {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
        resetAllStores();
        window.location.href = "/home";
      },
    });
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
    // Navigate to product detail page
    router.push(`/home/product-details/${suggestion._id}`);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  const pages = [
    // {
    //   name: "Shop",
    //   // link: "/home",
    // },
    {
      name: "Best Deals",
      link: "/home/best-deals",
    },
    {
      name: "Track Order ",
      link: "/home/track-order",
    },
    // {
    //   name: "Customer Care",
    //   link: "/contact",
    // },
  ];

  return (
    <header className="text-white sticky top-0 z-50">
      {/* Top banner - responsive */}
      <div className="w-full bg-primary h-[40px] sm:h-[44px] md:h-[48px]">
        <div className="w-full px-2 sm:px-2 md:px-4 lg:px-8 text-center py-1.5 text-xs sm:text-sm lg:text-base font-medium flex justify-between items-center">
          {/* Welcome Text */}
          <Link href="/home" className="flex-shrink-0 hidden md:block">
            <div className="flex items-center">
              <span className="truncate md:block hidden">
                Welcome to Mprimo online store...
              </span>
            </div>
          </Link>
           <Link href="/home" className="shrink-0 md:hidden">
              <div className="flex items-center">
                <img
                  src="/images/mprimo-logo2.png"
                  alt="mprimoLogo image"
                  className="h-[28px] w-auto sm:h-[32px] sm:w-auto md:h-[36px] md:w-auto lg:h-[40px] lg:w-[120px]"
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
            
            {/* Sell Button */}
            {isMounted && (
              <button
                onClick={handleSellClick}
                className="ml-2 px-4 py-1.5 bg-white text-blue-600 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                {vendor ? "Dashboard" : "Sell"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="relative" ref={profileModalRef}>
              <button
                onClick={handleProfileClick}
                className="p-1 rounded hover:bg-blue-700 transition-colors"
              >
                <ProfileCircle color="white" className="w-6 h-6" />
              </button>

              {showProfileModal && user && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {/* Wallet Balance */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Wallet Balance</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {getCurrencySymbol(user?.preferences?.currency || 'USD')} {convertedBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      router.push("/home/user");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      router.push("/home/user/wallet");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    My Wallet
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
            <Link
              href="/home/my-cart"
              className="text-white   hover:bg-blue-700 relative p-2 rounded"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartLength > 0 && (
                <div className="absolute top-1 right-[2px] bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white">
                  {cartLength}
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="w-full bg-primary">
        <div className="w-full px-2 sm:px-3 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3">
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

            {/* Logo - moved to bottom section */}
            <Link href="/home" className="shrink-0 hidden md:block">
              <div className="flex items-center">
                <img
                  src="/images/mprimo-logo2.png"
                  alt="mprimoLogo image"
                  className="h-[28px] w-auto sm:h-[32px] sm:w-auto md:h-[36px] md:w-auto lg:h-[40px] lg:w-[120px]"
                />
              </div>
            </Link>


            {/* Desktop Search bar */}
            <div className="flex-1 font-normal block md:mx-4 relative">
              <div className="flex mx-auto max-w-2xl bg-white py-[2px] md:py-[3px] rounded-[8px]">
                <button className="border-r px-2 md:px-3">
                  <Search className="w-5 h-5" color="black" />
                </button>
                <input
                  placeholder="Search for anything..."
                  className="flex-1 border-0 px-2 md:px-3 outline-0 text-[#121212] text-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                />
                <button
                  onClick={handleSearchSubmit}
                  className="py-[8px] md:py-[8px] px-3 text-xs bg-primary text-white rounded-[8px] mr-1 hover:bg-blue-700"
                >
                  Search
                </button>
              </div>

              {showSuggestions && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-2xl mx-auto">
                  <div className="py-2">
                    {suggestionsData?.suggestions &&
                      suggestionsData.suggestions.map((suggestion) => {
                        const price = formatProductPrice(suggestion);

                        return (
                          <Link
                            key={suggestion._id}
                            href={`/home/product-details/${suggestion._id}`}
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
                            {price && price !== "$0" && (
                              <div className="text-sm font-semibold text-gray-900">
                                {price}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Right menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile search button */}
              {/* <button
                onClick={toggleSearch}
                className="text-white hover:bg-blue-700 lg:hidden p-2 rounded"
              >
                <Search className="w-5 h-5" />
              </button> */}

              {/* <button
                onClick={() => handleProfileClick()}
                className="text-white hover:bg-blue-700 p-2 rounded cursor-pointer"
              >
                <User className="w-5 h-5" />
              </button> */}
              <Link
                href="/home/wishlist"
                className="text-white   hover:bg-blue-700 relative p-2 rounded"
              >
                <Heart className="w-6 h-6" />
                {isMounted && wishlistCount > 0 && (
                  <div className="absolute top-1 right-[2px] bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white">
                    {wishlistCount ?? 0}
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
                          href={`/home/product-details/${suggestion._id}`}
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
                          {(() => {
                            const price = formatProductPrice(suggestion);
                            if (price && price !== "$0") {
                              return (
                                <div className="text-xs font-semibold text-gray-900">
                                  {price}
                                </div>
                              );
                            }
                            return null;
                          })()}
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
      
      {/* Vendor Registration Modal */}
      <VendorRegistrationModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
      />
    </header>
  );
};

export default Header;
