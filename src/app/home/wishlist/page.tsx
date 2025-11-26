"use client"

import { useState } from "react"
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

  export default function WishlistPage() {
    const router = useRouter()
    const { addToCart } = useCartStore()
    
    useWishlistSync()
    
    const { 
      wishlist, 
      wishlistCount, 
      isLoading, 
      removeFromWishlist, 
      isRemovingFromWishlist 
    } = useWishlist()
  
  
    
    const handleRemoveItem = (productId: string) => {
      removeFromWishlist(productId)
    }
  
    const handleAddToCart = (item: any) => {
      const cartItem = {
        productId: item.productId._id,
        name: item.name,
        price: item.price,
        image: item.productId.images[0] || '/placeholder.svg',
        quantity: 1
      }
      addToCart(cartItem)
    }
  
    const handleRemoveAll = () => {
      wishlist.forEach(item => {
        removeFromWishlist(item.productId)
      })
    }
  
    const getProductPrice = (item: Wishlist) => {
      return item.price 
    }
  
    const getSalePrice = (item: any) => {
      return item.price
    }
  
    const getDiscount = (item: any) => {
      const price = getProductPrice(item)
      const salePrice = getSalePrice(item)
      if (salePrice && salePrice < price) {
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
  
  
      <div className="max-w-7xl mx-auto px-4 md:px-[42px] lg:px-[80px] py-4 md:py-10 lg:py-15">
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
              <div className="col-span-5">Products</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
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
              {wishlist.map((item) => (
                <div key={item._id} className="p-4">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex space-x-3">
                      <div className="relative">
                        <Image
                          src={item.images?.[0] || "/placeholder.svg"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        {getDiscount(item) && (
                          <Badge className="absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 bg-red-100 text-red-800 hover:bg-red-100">
                            {getDiscount(item)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Added {new Date(item.addedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getSalePrice(item) ? (
                            <>
                              <span className="font-bold text-red-600">₦ {getSalePrice(item).toLocaleString()}</span>
                              <span className="text-sm text-gray-500 line-through">₦ {getProductPrice(item).toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="font-bold">₦ {getProductPrice(item).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-green-600">Available</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add To Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={isRemovingFromWishlist}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
  
                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-5 flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={item.images?.[0] || "/placeholder.svg"}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                        {getDiscount(item) && (
                          <Badge className="absolute -bottom-1 -right-1 text-xs px-2 py-1 bg-red-100 text-red-800 hover:bg-red-100">
                            {getDiscount(item)}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">Added {new Date(item.addedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 whitespace-nowrap">
                        {getSalePrice(item) ? (
                          <>
                            <span className="font-bold text-red-600">₦ {getSalePrice(item).toLocaleString()}</span>
                            {/* <span className="text-sm text-gray-500 line-through">₦ {getProductPrice(item).toLocaleString()}</span> */}
                          </>
                        ) : (
                          <span className="font-bold">₦ {getProductPrice(item).toLocaleString()}</span>
                        )}
                        {getDiscount(item) && (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{getDiscount(item)}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-green-600">Available</span>
                    </div>
                    <div className="col-span-3 flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add To Cart
                      </Button>
                      <Button
                        size="sm"
                        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                        onClick={() => handleRemoveItem(item.productId)}
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
