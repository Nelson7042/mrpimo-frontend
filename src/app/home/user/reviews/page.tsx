"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"

const wishlistItems = [
  {
    id: "1",
    name: "Men Minimalist Large Capacity Laptop Backpack",
    condition: "Refurbished",
    amount: 45000,
    deliveredOn: "3/12/25 9:30",
    image: "/images/tv.png",
    badge: "Buy Now",
  },
  {
    id: "2",
    name: "iMosi QX7 Smart Watch 1.85 inch Smart Watch",
    condition: "New",
    amount: 45000,
    deliveredOn: "3/12/25 9:30",
    image: "/images/tv.png",
    badge: "Auction",
  },
  {
    id: "3",
    name: "MOVSSOU E7 Noise Cancellation Headphone",
    condition: "Used",
    amount: 145000,
    deliveredOn: "3/12/25 9:30",
    image: "/images/tv.png",
    badge: "Offer",
  },
  {
    id: "4",
    name: "Men Minimalist Large Capacity Laptop Backpack",
    condition: "Refurbished",
    amount: 45000,
    deliveredOn: "3/12/25 9:30",
    image: "/images/tv.png",
    badge: "Buy Now",
  },
  {
    id: "5",
    name: "iMosi QX7 Smart Watch 1.85 inch Smart Watch",
    condition: "New",
    amount: 45000,
    deliveredOn: "3/12/25 9:30",
    image: "/images/tv.png",
    badge: "Auction",
  },
  {
    id: "6",
    name: "MOVSSOU E7 Noise Cancellation Headphone",
    condition: "Used",
    amount: 145000,
    deliveredOn: "3/12/25 9:30",
    image: "/images/tv.png",
    badge: "Offer",
  },
]

export default function ReviewsPage() {
  const [items, setItems] = useState(wishlistItems)

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const removeAll = () => {
    setItems([])
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Buy Now":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "Auction":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Offer":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }
    const router = useRouter()

  

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/my-cart" },
    { label: "Auction", href: null},
  
  ];
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
    <div className="min-h-screen bg-gray-50">
     <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold">My Wishlist</h1>
              <span className="text-gray-600">{items.length} Items</span>
            </div>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
              onClick={removeAll}
            >
              Remove All
            </Button>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div className="col-span-4">PRODUCT</div>
              <div className="col-span-2">AMOUNT</div>
              <div className="col-span-3">DELIVERED ON</div>
              <div className="col-span-3">ACTIONS</div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-4">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex space-x-3">
                      <div className="relative">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <Badge
                          className={`absolute -bottom-1 -right-1 text-xs px-1 py-0 h-5 ${getBadgeColor(item.badge)}`}
                        >
                          {item.badge}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{item.condition}</p>
                        <div className="mt-2">
                          <span className="font-bold text-sm">₦ {item.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{item.deliveredOn}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Rate Now
                      </Button>
                      <Button
                        size="sm"
                        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <Badge className={`absolute -bottom-1 -right-1 text-xs px-2 py-1 ${getBadgeColor(item.badge)}`}>
                          {item.badge}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.condition}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold">₦ {item.amount.toLocaleString()}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm">{item.deliveredOn}</span>
                    </div>
                    <div className="col-span-3 flex space-x-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Rate Now
                      </Button>
                      <Button
                        size="sm"
                        className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                        onClick={() => removeItem(item.id)}
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
          <div className="flex justify-center items-center space-x-2 mt-6">
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
          </div>
     
    </div>
  )
}
