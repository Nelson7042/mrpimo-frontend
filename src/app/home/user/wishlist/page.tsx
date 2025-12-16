"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"
import { useWishlist } from "@/hooks/useWishlist"
import { useCartStore } from "@/stores/cartStore"

export default function WishlistPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const { wishlist, isLoading, removeFromWishlist, wishlistCount, clearWishlist } = useWishlist()
  const { addToCart } = useCartStore()

  const handleRemoveItem = (item: any) => {
    removeFromWishlist({ productId: item.productId, variantId: item.variantId, optionId: item.optionId })
  }

  const handleAddToCart = async (item: any) => {
    const product = {
      _id: item.productId,
      name: item.name,
      images: item.images,
      price: item.price,
      priceInfo: item.priceInfo
    }
    
    const selectedVariant = item.variantId && item.optionId ? {
      variantId: item.variantId,
      optionId: item.optionId,
      variantName: item.variantName || 'Variant',
      optionValue: item.optionValue || 'Option',
      price: item.price
    } : undefined
    
    await addToCart(product, 1, selectedVariant)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen font-roboto">
        <div className="mx-auto pt-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="flex space-x-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "My-Wishlist", href: "/home/my-cart" },
  ]

  console.log("Wishlist items:", wishlist);
  
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
     router.push(item?.href);
    }
  };

  return (
   <>
      <div className="min-h-screen font-roboto">
        <div className=" mx-auto pt-4">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold">My Wishlist</h1>
            <span className="text-gray-600" suppressHydrationWarning>{wishlist.length} Items</span>
          </div>
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
            onClick={() => clearWishlist()}
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
            {wishlist.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Your wishlist is empty</p>
                <Link href="/home" className="text-blue-600 hover:underline mt-2 inline-block">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              wishlist.map((item: any) => {
                console.log('Wishlist item:', item);
                return (
              <div key={item.productId} className="p-4">
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Added {new Date(item.addedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{`${item.priceInfo?.currencySymbol || '$'}${(item.priceInfo?.displayPrice || item.price || 0).toLocaleString()}`}</span>
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
                      onClick={() => handleRemoveItem(item)}
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
                    </div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-xs text-gray-500">Added {new Date(item.addedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{`${item.priceInfo?.currencySymbol || '$'}${(item.priceInfo?.displayPrice || item.price || 0).toLocaleString()}`}</span>
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
                      onClick={() => handleRemoveItem(item)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              );
              })
            )}
          </div>
        </div>

        {/* Pagination - Only show if there are items */}
        {wishlist.length > 0 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button variant="ghost" size="sm" disabled>
              Prev
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              1
            </Button>
            <Button variant="ghost" size="sm">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}