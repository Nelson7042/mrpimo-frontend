"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs"
import { useRouter, useSearchParams } from "next/navigation"
import { useUserOrders, useCancelOrder } from "@/hooks/useOrders"
import { Loader2, Package, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { format } from "date-fns"
import { getCurrencySymbol } from "@/utils/currency"

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
    case "pending_payment":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100"
    case "payment_failed":
      return "bg-red-100 text-red-800 hover:bg-red-100"
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
    case "pending_payment":
      return <Clock className="w-4 h-4" />
    case "payment_failed":
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
    { label: "Dashboard", href: "/home/user" },
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
  const totalPages = ordersData?.pagination?.pages || ordersData?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50">
        <Breadcrumbs
          items={manualBreadcrumbs}
          onItemClick={handleBreadcrumbClick}
          className="mb-2 md:mb-6"
        />

      
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold">My Orders</h1>
      </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 md:p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b font-semibold text-xs text-gray-700 uppercase tracking-wide">
            <div className="col-span-2">Order ID</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
                <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
                <Button onClick={() => router.push('/home')} className="bg-blue-600 hover:bg-blue-700">
                  Start Shopping
                </Button>
              </div>
            ) : (
            orders.map((order: any) => {
              const itemCount = order.items.length;
              const isExpanded = expandedOrders.has(order._id);
              
              return (
                <div key={order._id} className="transition-all duration-200 hover:bg-gray-50/50">
                  <div className="p-5">
                    <div className="md:hidden space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">#{order._id.slice(-8)}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} px-3 py-1`}>
                          <span className="flex items-center gap-1.5 text-xs font-medium">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t border-b border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                          <p className="text-lg font-bold text-gray-900">{getCurrencySymbol(order.items?.[0]?.metadata?.userCurrency || order.paymentId?.currency || 'USD')}{order.paymentId?.amount?.toFixed(2) || order.items?.reduce((sum: number, item: any) => sum + (item.metadata?.amountPaidByUser || item.price) * item.quantity, 0)?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Items</p>
                          <p className="text-lg font-semibold text-gray-700">{itemCount}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                          {isExpanded ? 'Hide' : 'Show'}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleViewDetails(order._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View
                        </Button>
                        {order.status === 'pending_payment' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="col-span-2 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Cancel Order
                          </Button>
                        )}
                        {order.shipments?.some((s: any) => s.shipping?.status?.toLowerCase() === 'delivered') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="col-span-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                            onClick={() => router.push(`/home/user/orders/${order._id}?action=dispute`)}
                          >
                            Report Issue
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:grid md:grid-cols-12 gap-2 items-center">
                      <div className="col-span-2">
                        <p className="font-roboto font-semibold text-xs text-gray-900">#{order._id.slice(-8)}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-roboto text-xs text-gray-600">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="col-span-2">
                        <Badge className={`${getStatusColor(order.status)} px-2 py-0.5`}>
                          <span className="flex items-center gap-1 text-xs font-medium">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="font-roboto font-semibold text-xs text-gray-900">{getCurrencySymbol(order.items?.[0]?.metadata?.userCurrency || order.paymentId?.currency || 'USD')}{order.paymentId?.amount?.toFixed(2) || order.items?.reduce((sum: number, item: any) => sum + (item.metadata?.amountPaidByUser || item.price) * item.quantity, 0)?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-roboto text-xs text-gray-600">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="col-span-2 flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleOrderExpansion(order._id)}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(order._id)}
                          className="font-roboto h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View
                        </Button>
                        {order.status === 'pending_payment' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-roboto h-6 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                        {order.shipments?.some((s: any) => s.shipping?.status?.toLowerCase() === 'delivered') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-roboto h-6 px-2 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                            onClick={() => router.push(`/home/user/orders/${order._id}?action=dispute`)}
                          >
                            Report Issue
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (() => {
                    // Group items by shipment
                    const shipmentGroups = new Map<string, { shipment: any; items: any[] }>();
                    
                    order.shipments?.forEach((shipment: any) => {
                      const trackingKey = shipment.shipping?.trackingNumber || `shipment-${shipment._id}`;
                      shipmentGroups.set(trackingKey, {
                        shipment,
                        items: order.items.filter((item: any) => 
                          shipment.items?.some((si: any) => 
                            si.productId === item.productId?._id || 
                            si.productId === item.productId?.id ||
                            si._id === item._id
                          )
                        )
                      });
                    });

                    // Items without shipment info
                    const itemsWithoutShipment = order.items.filter((item: any) => 
                      !order.shipments?.some((s: any) => 
                        s.items?.some((si: any) => 
                          si.productId === item.productId?._id || 
                          si.productId === item.productId?.id ||
                          si._id === item._id
                        )
                      )
                    );

                    return (
                      <div className="px-5 pb-5 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
                        <div className="space-y-4 pt-4">
                          {/* Delivery Address */}
                          {order.items?.[0]?.deliveryAddress && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                <Truck className="w-4 h-4" />
                                Delivery Address
                              </h4>
                              <div className="p-3 bg-white rounded-lg border border-gray-200 text-sm">
                                <p className="font-medium text-gray-900">{order.items[0].deliveryAddress.street}</p>
                                <p className="text-gray-600">{order.items[0].deliveryAddress.city}, {order.items[0].deliveryAddress.state} {order.items[0].deliveryAddress.postalCode}</p>
                              </div>
                            </div>
                          )}

                          {/* Order Items Table */}
                          {shipmentGroups.size === 0 ? (
                            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-3">
                                <Package className="w-6 h-6 text-orange-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">Item(s) not shipped yet</h3>
                              <p className="text-sm text-gray-600">Your order is being prepared. Tracking information will be available soon.</p>
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Desktop Table */}
                              <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Qty</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tracking</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Carrier</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Est. Delivery</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {Array.from(shipmentGroups.values()).map((group, groupIdx) => {
                                      const { shipment, items } = group;
                                      return items.map((item: any, itemIdx: number) => (
                                        <tr key={`${groupIdx}-${itemIdx}`} className="hover:bg-gray-50">
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                              <Image
                                                src={item.productId?.images?.[0] || "/placeholder.svg"}
                                                alt={item.productId?.name || "Product"}
                                                width={50}
                                                height={50}
                                                className="rounded-lg object-cover"
                                              />
                                              <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate">{item.productId?.name}</p>
                                                {items.length > 1 && itemIdx > 0 && (
                                                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                                                    <Truck className="w-3 h-3" />
                                                    Ships with item above
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{getCurrencySymbol(item.metadata?.userCurrency || 'USD')}{(item.metadata?.amountPaidByUser || item.price)?.toFixed(2)}</td>
                                          <td className="px-4 py-3">
                                            {itemIdx === 0 ? (
                                              <p className="text-xs font-semibold text-blue-600 break-all">
                                                {shipment.shipping?.trackingNumber || 'Pending'}
                                              </p>
                                            ) : (
                                              <p className="text-xs text-gray-400 italic">Same as above</p>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            {itemIdx === 0 ? (
                                              <p className="text-xs font-semibold text-gray-900 capitalize">
                                                {shipment.shipping?.carrier || 'TBD'}
                                              </p>
                                            ) : (
                                              <p className="text-xs text-gray-400 italic">—</p>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            {itemIdx === 0 ? (
                                              <Badge className={`${shipment.shipping?.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} hover:bg-current`}>
                                                <span className="capitalize text-xs">{shipment.shipping?.status || 'pending'}</span>
                                              </Badge>
                                            ) : (
                                              <p className="text-xs text-gray-400 italic">—</p>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            {itemIdx === 0 ? (
                                              <p className="text-xs font-semibold text-gray-900">
                                                {shipment.shipping?.estimatedDelivery 
                                                  ? format(new Date(shipment.shipping.estimatedDelivery), 'MMM dd, yyyy')
                                                  : 'TBD'
                                                }
                                              </p>
                                            ) : (
                                              <p className="text-xs text-gray-400 italic">—</p>
                                            )}
                                          </td>
                                        </tr>
                                      ));
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile Cards */}
                              <div className="lg:hidden divide-y divide-gray-200">
                                {Array.from(shipmentGroups.values()).map((group, groupIdx) => {
                                  const { shipment, items } = group;
                                  return items.map((item: any, itemIdx: number) => (
                                    <div key={`${groupIdx}-${itemIdx}`} className="p-4 space-y-3">
                                      <div className="flex gap-3">
                                        <Image
                                          src={item.productId?.images?.[0] || "/placeholder.svg"}
                                          alt={item.productId?.name || "Product"}
                                          width={60}
                                          height={60}
                                          className="rounded-lg object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-sm text-gray-900">{item.productId?.name}</p>
                                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                                          <p className="text-sm font-bold text-gray-900 mt-1">{getCurrencySymbol(item.metadata?.userCurrency || 'USD')}{(item.metadata?.amountPaidByUser || item.price)?.toFixed(2)}</p>
                                          {items.length > 1 && itemIdx > 0 && (
                                            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                              <Truck className="w-3 h-3" />
                                              Ships with item above
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {itemIdx === 0 && (
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Tracking:</span>
                                            <span className="font-semibold text-blue-600">{shipment.shipping?.trackingNumber || 'Pending'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Carrier:</span>
                                            <span className="font-semibold text-gray-900 capitalize">{shipment.shipping?.carrier || 'TBD'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <Badge className={`${shipment.shipping?.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} hover:bg-current`}>
                                              <span className="capitalize text-xs">{shipment.shipping?.status || 'pending'}</span>
                                            </Badge>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Est. Delivery:</span>
                                            <span className="font-semibold text-gray-900">
                                              {shipment.shipping?.estimatedDelivery 
                                                ? format(new Date(shipment.shipping.estimatedDelivery), 'MMM dd, yyyy')
                                                : 'TBD'
                                              }
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ));
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )
            })
          )}
        </div>
      </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-6 border-gray-300 hover:bg-gray-50"
            >
              Previous
            </Button>
            <span className="flex items-center px-6 py-2 bg-white rounded-lg border border-gray-200 font-medium text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-6 border-gray-300 hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        )}
    </div>
  )
}