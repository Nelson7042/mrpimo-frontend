"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useOrderById, useCancelOrder, useRequestRefund } from "@/hooks/useOrders"
import { Loader2, Package, Truck, CheckCircle, XCircle, MapPin, Calendar, CreditCard } from "lucide-react"
import { format } from "date-fns"

const getStatusColor = (status: string) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "processing":
      return "bg-yellow-100 text-yellow-800"
    case "pending":
      return "bg-orange-100 text-orange-800"
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  if (!status) return <Package className="w-4 h-4" />;
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

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  
  const { data: orderData, isLoading, error } = useOrderById(orderId)
  const cancelOrderMutation = useCancelOrder()
  const requestRefundMutation = useRequestRefund()
  
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [refundReason, setRefundReason] = useState("")

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/home" },
    { label: "My Orders", href: "/home/user/orders" },
    { label: "Order Details", href: null },
  ]

  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault()
    if (item.href) {
      router.push(item.href)
    }
  }

  const handleCancelOrder = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrderMutation.mutateAsync({ orderId })
    }
  }

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund')
      return
    }
    
    await requestRefundMutation.mutateAsync({ 
      orderId, 
      reason: refundReason 
    })
    setShowRefundForm(false)
    setRefundReason("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !orderData?.order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Button onClick={() => router.push('/home/user/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const order = orderData.order

  return (
    <div className="min-h-screen bg-gray-50 body-padding">
      <div className="mx-auto pt-4">
        <Breadcrumbs
          items={manualBreadcrumbs}
          onItemClick={handleBreadcrumbClick}
          className="mb-4"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Order #{order._id?.slice(-8) || 'N/A'}</CardTitle>
                    <p className="text-gray-600 mt-1">
                      Placed on {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Image
                        src={item.productId?.images?.[0] || "/placeholder.svg"}
                        alt={item.productId?.name || "Product"}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productId?.name}</h3>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-blue-600 font-medium">${item.price?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.price * item.quantity)?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-gray-600">
                        {order.shipping?.address?.street || order.shipping?.address?.homeAddress}<br />
                        {order.shipping?.address?.state}, {order.shipping?.address?.country}<br />
                        {order.shipping?.address?.postalCode}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Tracking Number</p>
                      <p className="text-blue-600">{order.shipping?.trackingNumber}</p>
                    </div>
                    <div>
                      <p className="font-medium">Carrier</p>
                      <p className="text-gray-600 capitalize">{order.shipping?.carrier}</p>
                    </div>
                    <div>
                      <p className="font-medium">Estimated Delivery</p>
                      <p className="text-gray-600">
                        {order.shipping?.estimatedDelivery 
                          ? format(new Date(order.shipping.estimatedDelivery), 'MMMM dd, yyyy')
                          : 'TBD'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Shipping Status</p>
                      <p className="text-gray-600 capitalize">{order.shipping?.status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <Button 
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={cancelOrderMutation.isPending}
                    >
                      {cancelOrderMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Order'
                      )}
                    </Button>
                  )}
                  
                  {order.status === 'delivered' && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowRefundForm(!showRefundForm)}
                    >
                      Request Refund
                    </Button>
                  )}
                  
                  <Button variant="outline" asChild>
                    <Link href={`/home/user/orders`}>
                      Back to Orders
                    </Link>
                  </Button>
                </div>

                {/* Refund Form */}
                {showRefundForm && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">Request Refund</h4>
                    <textarea
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={3}
                      placeholder="Please provide a reason for the refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm"
                        onClick={handleRequestRefund}
                        disabled={requestRefundMutation.isPending}
                      >
                        {requestRefundMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowRefundForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">${order.paymentId?.amount || order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Payment Information */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="text-blue-600">#{order.paymentId?._id?.slice(-8) || order.paymentId?.slice?.(-8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="secondary">Paid</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}