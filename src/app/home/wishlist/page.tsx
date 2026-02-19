"use client"

import Link from "next/link"
import Image from "next/image"
import {Badge, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"
import { useWishlist } from "@/hooks/useWishlist"
import { useCartStore } from "@/stores/cartStore"
import { useWishlistSync } from "@/hooks/useWishlistSync"
import { Wishlist } from "@/types/wishlist.type"
import { Heart } from "iconsax-react"
import { useUserStore } from "@/stores/useUserStore"
import { useEffect } from "react"
import { getWishlistDisplayPrice } from "@/utils/priceUtils"

  export default function WishlistPage() {
    const router = useRouter()
    const { user } = useUserStore()
    
    useWishlistSync()
    
    const { 
      wishlist, 
      wishlistCount, 
      isLoading, 
      removeFromWishlist,
      clearWishlist, 
      isRemovingFromWishlist 
    } = useWishlist()

    const { addToCart, isLoading: isAddingToCart } = useCartStore()

    // Log wishlist data for debugging
    console.log('Wishlist in component:', wishlist);
    console.log('Wishlist count:', wishlistCount);

    // Don't render anything if user is not authenticated
    if (!user) {
      return (
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-6 md:py-10 lg:py-10">
          <div className="p-8 text-center text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Please log in to view your wishlist</h3>
            <Button 
              onClick={() => router.push('/login?redirect=/home/wishlist')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Log In
            </Button>
          </div>
        </div>
      )
    }
  
    const handleRemoveItem = (item: Wishlist) => {
      console.log('Full item object:', item);
      console.log('Removing item:', { productId: item.productId, variantId: item.variantId, optionId: item.optionId });
      if (item.productId && item.variantId && item.optionId) {
        removeFromWishlist({ productId: item.productId, variantId: item.variantId, optionId: item.optionId })
      }
    }
  
    const handleRemoveAll = () => {
      clearWishlist()
    }

    const handleAddToCart = async (item: Wishlist) => {
      if (!item.productId || !item.variantId || !item.optionId) return
      
      const product = {
        _id: item.productId,
        name: item.name,
        images: item.images,
        price: item.price.toString()
      }
      
      const selectedVariant = {
        variantId: item.variantId,
        optionId: item.optionId,
        variantName: '',
        optionValue: '',
        price: item.priceInfo?.originalPrice || item.price
      }
      
      try {
        await addToCart(product, 1, selectedVariant)
        removeFromWishlist({ productId: item.productId, variantId: item.variantId, optionId: item.optionId })
      } catch (error) {
        console.error('Failed to add to cart:', error)
      }
    }
  
    const getProductPrice = (item: Wishlist) => {
      // Use centralized price utility for consistency with cart
      // Validates: Requirements 5.1, 5.3, 5.5
      return getWishlistDisplayPrice(item)
    }
  
    const getSalePrice = (item: Wishlist) => {
      // Use centralized price utility for consistency with cart
      return getWishlistDisplayPrice(item)
    }

    const getCurrencySymbol = (item: Wishlist) => {
      return item.priceInfo?.currencySymbol || '$'
    }
  
    const getDiscount = (item: any) => {
      const price = getProductPrice(item)
      const salePrice = getSalePrice(item)
      if (salePrice && salePrice < price && price > 0) {
        const discount = Math.round(((price - salePrice) / price) * 100)
        return `-${discount}%`
      }
      return null
    }
    const manualBreadcrumbs: BreadcrumbItem[] = [
      { label: "My Wishlist", href: null },
    ]
      const handleBreadcrumbClick = (
      item: BreadcrumbItem,
      e: React.MouseEvent<HTMLAnchorElement>
    ): void => {
      e.preventDefault();
      if (item.href) {
       router.push(item?.href);
      }
    };
  
  
    const getStatusColor = (status: string) => {
      switch (status) {
        case "Available":
          return "text-green-600"
        case "Ongoing":
          return "text-green-600"
        case "Unavailable":
          return "text-red-600"
        default:
          return "text-gray-600"
      }
    }
  
    return (
     <>
  
  
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-6 md:py-10 lg:py-10">
          <div className=" ">
            {/* Breadcrumb */}
            <Breadcrumbs
              items={manualBreadcrumbs}
              onItemClick={handleBreadcrumbClick}
              className="mb-4"
            />
  
          {/* Header */}
          <div className="flex flex-row items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center space-x-2 ">
              <h1 className="text-base md:text-lg lg:text-2xl font-bold">My Wishlist</h1>
              <span className="text-gray-600">{wishlistCount} Items</span>
            </div>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
              onClick={handleRemoveAll}
              disabled={isRemovingFromWishlist}
            >
              Remove All
            </Button>
          </div>
  
          {/* Wishlist Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div className="col-span-6">Products</div>
              <div className="col-span-3">Amount</div>
              <div className="col-span-3">Actions</div>
            </div>
  
            {/* Loading State */}
            {isLoading && (
              <div className="p-8 text-center text-gray-500">
                <Heart className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Loading your wishlist...</p>
              </div>
            )}
  
            {/* Empty State */}
            {!isLoading && wishlist.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                <p className="mb-4">Save items you love to your wishlist</p>
                <Button 
                  onClick={() => router.push('/home')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Shopping
                </Button>
              </div>
            )}
  
            {/* Items */}
            <div className="divide-y">
              {wishlist.filter(wishlistItem => wishlistItem && wishlistItem.productId).map((wishlistItem, index) => (
                <div key={index} className=" p-2 md:p-4">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <Link
                      href={{
                        pathname: "/home/product-details/[id]",
                        query: {
                          id: wishlistItem.productId,
                          productData: JSON.stringify({ 
                            _id: wishlistItem.productId, 
                            name: wishlistItem.name || '', 
                            images: wishlistItem.images || [], 
                            price: wishlistItem.price || 0 
                          }),
                        },
                      }}
                      as={`/home/product-details/${wishlistItem.productId}`}
                      className="flex space-x-3"
                    >
                      <div className="relative">
                        <Image
                          src={wishlistItem.images?.[0] || "/placeholder.svg"}
                          alt={wishlistItem.name || "Product"}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                        {getDiscount(wishlistItem) && (
                          <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-red-100 text-red-800 hover:bg-red-100">
                            {getDiscount(wishlistItem)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight">{wishlistItem.name || "Unknown Product"}</h3>
                        <p className="text-xs text-gray-500 mt-1">Added {wishlistItem.addedAt ? new Date(wishlistItem.addedAt).toLocaleDateString() : "Unknown date"}</p>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{getCurrencySymbol(wishlistItem)} {(getProductPrice(wishlistItem) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleAddToCart(wishlistItem)}
                        disabled={isAddingToCart || !wishlistItem.variantId || !wishlistItem.optionId}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                        onClick={() => handleRemoveItem(wishlistItem)}
                        disabled={isRemovingFromWishlist}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
  
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-6">
                      <Link
                        href={{
                          pathname: "/home/product-details/[id]",
                          query: {
                            id: wishlistItem.productId,
                            productData: JSON.stringify({ 
                              _id: wishlistItem.productId, 
                              name: wishlistItem.name || '', 
                              images: wishlistItem.images || [], 
                              price: wishlistItem.price || 0 
                            }),
                          },
                        }}
                        as={`/home/product-details/${wishlistItem.productId}`}
                        className="flex items-center space-x-4"
                      >
                        <div className="relative">
                          <Image
                            src={wishlistItem.images?.[0] || "/placeholder.svg"}
                            alt={wishlistItem.name || "Product"}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                          {getDiscount(wishlistItem) && (
                            <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-red-100 text-red-800 hover:bg-red-100">
                              {getDiscount(wishlistItem)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-base">{wishlistItem.name || "Unknown Product"}</h3>
                          <p className="text-sm text-gray-500 mt-1">Added {wishlistItem.addedAt ? new Date(wishlistItem.addedAt).toLocaleDateString() : "Unknown date"}</p>
                        </div>
                      </Link>
                    </div>

                    {/* Price */}
                    <div className="col-span-3">
                      <span className="font-bold text-lg">{getCurrencySymbol(wishlistItem)} {(getProductPrice(wishlistItem) || 0).toLocaleString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleAddToCart(wishlistItem)}
                        disabled={isAddingToCart || !wishlistItem.variantId || !wishlistItem.optionId}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                        onClick={() => handleRemoveItem(wishlistItem)}
                        disabled={isRemovingFromWishlist}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          {/* Pagination */}
          {/* <div className="flex justify-center items-center space-x-2 mt-6">
            <Button variant="ghost" size="sm" disabled>
              Prev
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              1
            </Button>
            <Button variant="ghost" size="sm">
              2
            </Button>
            <Button variant="ghost" size="sm">
              3
            </Button>
            <span className="text-gray-500">...</span>
            <Button variant="ghost" size="sm">
              10
            </Button>
            <Button variant="ghost" size="sm">
              Next
            </Button>
          </div> */}
        </div>
      </div>
      </>
    )
  }
