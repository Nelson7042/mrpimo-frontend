"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter, useSearchParams } from "next/navigation"
import { useUserOrders, useCancelOrder } from "@/hooks/useOrders"
import { Loader2, Package, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "shipped":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "processing":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "pending":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100"
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return <CheckCircle className="w-4 h-4" />
    case "shipped":
      return <Truck className="w-4 h-4" />
    case "processing":
    case "pending":
      return <Package className="w-4 h-4" />
    case "cancelled":
    case "failed":
      return <XCircle className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

 

  


export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  
  const { data: ordersData, isLoading, error } = useUserOrders(currentPage, 10, statusFilter)
  const cancelOrderMutation = useCancelOrder()

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/home" },
    { label: "My Orders", href: null },
  ];
  
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrderMutation.mutateAsync({ orderId });
    }
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/home/user/orders/${orderId}`);
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load orders</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const orders = ordersData?.orders || [];
  const totalPages = ordersData?.totalPages || 1;
  return (
    <div className="min-h-screen bg-gray-50">
   <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          <div className="mb-6">
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div className="col-span-2">ORDER ID</div>
              <div className="col-span-2">DATE</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">TOTAL</div>
              <div className="col-span-2">ITEMS</div>
              <div className="col-span-2">ACTIONS</div>
            </div>

            {/* Orders */}
            <div className="divide-y">
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                orders.map((order: any, index: number) => {
                  const itemCount = order.items.length;
                  const isExpanded = expandedOrders.has(order._id);
                  
                  return (
                    <div key={order._id} className="border-b last:border-b-0">
                      {/* Order Summary */}
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Mobile Layout */}
                        <div className="md:hidden">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium text-sm">#{order._id.slice(-8)}</p>
                              <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium">${order.paymentId?.amount || '0.00'}</span>
                            <span className="text-sm text-gray-600">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleOrderExpansion(order._id)}
                                className="text-blue-600 p-0"
                              >
                                {isExpanded ? 'Hide' : 'Show'} Items
                                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="link" 
                                className="text-blue-600 p-0"
                                onClick={() => handleViewDetails(order._id)}
                              >
                                View Details
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              {(order.status === 'pending' || order.status === 'processing') && (
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="text-red-600 p-0"
                                  onClick={() => handleCancelOrder(order._id)}
                                  disabled={cancelOrderMutation.isPending}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <p className="font-medium">#{order._id.slice(-8)}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="col-span-2">
                            <Badge className={getStatusColor(order.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">${order.paymentId?.amount || '0.00'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="col-span-2 flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleOrderExpansion(order._id)}
                              className="text-blue-600 p-0"
                            >
                              {isExpanded ? 'Hide' : 'Items'}
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="link" 
                              className="text-blue-600 text-sm p-0"
                              onClick={() => handleViewDetails(order._id)}
                            >
                              Details
                            </Button>
                            {/* {(order.status === 'pending' || order.status === 'processing') && (
                              <Button 
                                variant="link" 
                                className="text-red-600 text-sm p-0"
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={cancelOrderMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )} */}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 bg-gray-50 border-t">
                          <div className="space-y-3">
                            {/* Shipping Info */}
                            <div className="flex flex-col md:flex-row md:justify-between text-sm">
                              <div>
                                <p className="font-medium text-gray-700">Shipping Address:</p>
                                <p className="text-gray-600">
                                  {order.shipping?.address?.street}, {order.shipping?.address?.city}, {order.shipping?.address?.state} {order.shipping?.address?.postalCode}
                                </p>
                              </div>
                              <div className="mt-2 md:mt-0">
                                <p className="font-medium text-gray-700">Tracking:</p>
                                <p className="text-gray-600">{order.shipping?.trackingNumber}</p>
                              </div>
                            </div>
                            
                            {/* Items List */}
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Items:</p>
                              <div className="space-y-2">
                                {order.items.map((item: any, itemIndex: number) => (
                                  <div key={itemIndex} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                    <Image
                                      src={item.productId?.images?.[0] || "/placeholder.svg"}
                                      alt={item.productId?.name || "Product"}
                                      width={40}
                                      height={40}
                                      className="rounded object-cover"
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{item.productId?.name}</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-sm">${item.price}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button 
                    key={page}
                    size="sm" 
                    variant={currentPage === page ? "default" : "ghost"}
                    className={currentPage === page ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-gray-500">...</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
    
    </div>
  )
}