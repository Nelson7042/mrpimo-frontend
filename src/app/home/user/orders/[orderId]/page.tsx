"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import {
  useOrderById,
  useCancelOrder,
  useRequestRefund,
} from "@/hooks/useOrders";
import { useAddReview } from "@/hooks/useProducts";
import {
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  Star,
  AlertCircle,
  ArrowLeft,
  Upload,
  X,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import axios from "axios";
import { getCurrencySymbol } from "@/utils/currency";
import { API_BASE_URL } from "@/utils/config";

const getStatusColor = (status: string) => {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-yellow-100 text-yellow-800";
    case "pending":
      return "bg-orange-100 text-orange-800";
    case "pending_payment":
      return "bg-purple-100 text-purple-800";
    case "payment_failed":
      return "bg-red-100 text-red-800";
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  if (!status) return <Package className="w-4 h-4" />;
  switch (status.toLowerCase()) {
    case "delivered":
      return <CheckCircle className="w-4 h-4" />;
    case "shipped":
      return <Truck className="w-4 h-4" />;
    case "processing":
    case "pending":
      return <Package className="w-4 h-4" />;
    case "pending_payment":
      return <Clock className="w-4 h-4" />;
    case "payment_failed":
    case "cancelled":
    case "failed":
      return <XCircle className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const { data: orderData, isLoading, error } = useOrderById(orderId);
  const cancelOrderMutation = useCancelOrder();
  const requestRefundMutation = useRequestRefund();
  const addReviewMutation = useAddReview();

  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [vendorRating, setVendorRating] = useState(0);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueImages, setIssueImages] = useState<File[]>([]);
  const [issueImagePreviews, setIssueImagePreviews] = useState<string[]>([]);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "My Orders", href: "/home/user/orders" },
    { label: "Order Details", href: null },
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

  const handleCancelOrder = async () => {
    if (confirm("Are you sure you want to cancel this order?")) {
      await cancelOrderMutation.mutateAsync({ orderId });
    }
  };

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      toast.info("Please provide a reason for the refund");
      return;
    }

    await requestRefundMutation.mutateAsync({
      orderId,
      reason: refundReason,
    });
    setShowRefundForm(false);
    setRefundReason("");
  };

  const handleOpenReviewModal = (product: any) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
    setRating(0);
    setComment("");
    setVendorRating(0);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.info("Please select a rating");
      return;
    }

    try {
      await addReviewMutation.mutateAsync({
        productId: selectedProduct._id,
        reviewData: {
          rating,
          comment: comment.trim() || undefined,
          vendorRating: vendorRating || undefined,
        },
      });
      setShowReviewModal(false);
      setSelectedProduct(null);
      setRating(0);
      setComment("");
      setVendorRating(0);
      toast.success("Review submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    }
  };

  const handleIssueImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (issueImages.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setIssueImages([...issueImages, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIssueImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeIssueImage = (index: number) => {
    setIssueImages(prev => prev.filter((_, i) => i !== index));
    setIssueImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitIssue = async () => {
    if (!issueType || !issueDescription.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmittingIssue(true);
    try {
      let evidenceUrls: string[] = [];

      if (issueImages.length > 0) {
        const formData = new FormData();
        issueImages.forEach(image => formData.append("images", image));

        const uploadRes = await axios.post(
          `${API_BASE_URL}/issues/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
        evidenceUrls = uploadRes.data.data.uploadedUrls;
      }

      await axios.post(
        `${API_BASE_URL}/issues`,
        {
          orderId,
          reason: issueType,
          description: issueDescription,
          evidenceUrls,
          returnOutcome: "refund",
        },
        { withCredentials: true }
      );

      toast.success("Issue reported successfully!");
      setShowIssueModal(false);
      setIssueType("");
      setIssueDescription("");
      setIssueImages([]);
      setIssueImagePreviews([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit issue");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !orderData?.order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Button onClick={() => router.push("/home/user/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const order = orderData.order;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto">
        <Breadcrumbs
          items={manualBreadcrumbs}
          onItemClick={handleBreadcrumbClick}
          className="mb-4"
        />

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {/* Order Header */}
            <Card className="shadow-sm border-t-4 border-t-blue-500">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-roboto text-sm md:text-base font-semibold">
                      Order #{order._id?.slice(-8) || "N/A"}
                    </CardTitle>
                    <p className="font-roboto text-gray-600 mt-1 text-xs">
                      Placed on{" "}
                      {order.createdAt
                        ? format(new Date(order.createdAt), "MMMM dd, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-xs`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items with Shipping */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="font-roboto text-sm font-semibold">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {order.items?.[0]?.deliveryAddress && (
                  <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-start gap-2 border border-blue-100">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-roboto font-medium text-xs">Delivery Address</p>
                      <p className="font-roboto text-xs text-gray-600">
                        {order.items[0].deliveryAddress.street}, {order.items[0].deliveryAddress.city}, {order.items[0].deliveryAddress.state}, {order.items[0].deliveryAddress.country} {order.items[0].deliveryAddress.postalCode}
                      </p>
                    </div>
                  </div>
                )}

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr className="text-left text-xs text-gray-700">
                        <th className="p-2 pl-4 font-medium">Product</th>
                        <th className="p-2 font-medium text-center">Price</th>
                        <th className="p-2 font-medium text-center">Qty</th>
                        <th className="p-2 font-medium text-center">Total</th>
                        <th className="p-2 font-medium">Shipping</th>
                        {order.status === "delivered" && <th className="pr-4 p-2 font-medium text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item: any, index: number) => {
                        const shipment = order.shipments?.find((s: any) =>
                          s.items?.some((si: any) => {
                            const productId = typeof item.productId === 'object' ? (item.productId._id || item.productId.id) : item.productId;
                            return si.productId === productId;
                          })
                        );
                        return (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3 pl-4">
                              <div className="flex items-center gap-3">
                                <Link href={`/home/product-details/${item?.productId._id}`}>
                                  <Image
                                    src={item.productId?.images?.[0] || "/placeholder.svg"}
                                    alt={item.productId?.name || "Product"}
                                    width={50}
                                    height={50}
                                    className="rounded-lg object-cover"
                                  />
                                </Link>
                                <div>
                                  <p className="font-roboto font-medium text-xs">{item.productId?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center font-roboto text-xs">{getCurrencySymbol(item.metadata?.userCurrency || 'USD')}{(item.metadata?.amountPaidByUser || item.price)?.toFixed(2) || "0.00"}</td>
                            <td className="py-3 text-center font-roboto text-xs">{item.quantity}</td>
                            <td className="py-3 font-roboto font-medium text-xs text-center">{getCurrencySymbol(item.metadata?.userCurrency || 'USD')}{((item.metadata?.amountPaidByUser || item.price) * item.quantity)?.toFixed(2) || "0.00"}</td>
                            <td className="py-3 px-2">
                              {shipment?.shipping ? (
                                <div className="space-y-0.5">
                                  <p className="font-roboto text-xs flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    <span className="text-blue-600">{shipment.shipping.trackingNumber}</span>
                                  </p>
                                  <p className="font-roboto text-xs text-gray-600 capitalize">{shipment.shipping.carrier}</p>
                                  <p className="font-roboto text-xs text-gray-500">
                                    {shipment.shipping.estimatedDelivery
                                      ? format(new Date(shipment.shipping.estimatedDelivery), "MMM dd")
                                      : "TBD"}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-roboto text-gray-400 text-xs">Pending</span>
                              )}
                            </td>
                            {order.status === "delivered" && (
                              <td className="py-3 pr-4 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenReviewModal(item.productId)}
                                  className="font-roboto flex items-center gap-1 mx-auto text-xs h-7"
                                >
                                  <Star className="w-3 h-3" />
                                  Review
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {order.items?.map((item: any, index: number) => {
                    const shipment = order.shipments?.find((s: any) =>
                      s.items?.some((si: any) => {
                        const productId = typeof item.productId === 'object' ? (item.productId._id || item.productId.id) : item.productId;
                        return si.productId === productId;
                      })
                    );
                    return (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex gap-3">
                          <Link href={`/home/product-details/${item?.productId._id}`}>
                            <Image
                              src={item.productId?.images?.[0] || "/placeholder.svg"}
                              alt={item.productId?.name || "Product"}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          </Link>
                          <div className="flex-1">
                            <p className="font-roboto font-medium text-xs">{item.productId?.name}</p>
                            <p className="font-roboto text-xs text-gray-600 mt-1">Qty: {item.quantity}</p>
                            <p className="font-roboto text-blue-600 font-medium text-xs mt-1">{getCurrencySymbol(item.metadata?.userCurrency || 'USD')}{(item.metadata?.amountPaidByUser || item.price)?.toFixed(2)}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-1.5 font-roboto text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{getCurrencySymbol(item.metadata?.userCurrency || 'USD')}{((item.metadata?.amountPaidByUser || item.price) * item.quantity)?.toFixed(2)}</span>
                          </div>
                          {shipment?.shipping && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tracking:</span>
                                <span className="text-blue-600">{shipment.shipping.trackingNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Carrier:</span>
                                <span className="capitalize">{shipment.shipping.carrier}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Est. Delivery:</span>
                                <span>
                                  {shipment.shipping.estimatedDelivery
                                    ? format(new Date(shipment.shipping.estimatedDelivery), "MMM dd, yyyy")
                                    : "TBD"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {order.status === "delivered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReviewModal(item.productId)}
                            className="w-full flex items-center justify-center gap-1 font-roboto text-xs h-7"
                          >
                            <Star className="w-3 h-3" />
                            Review
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  {order.status === "pending_payment" && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={cancelOrderMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {cancelOrderMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Cancel Order
                        </>
                      )}
                    </Button>
                  )}

                  {order.shipments?.some((s: any) => s.shipping?.status?.toLowerCase() === 'delivered') && (
                    <>
                      {/* Show 48h dispute window countdown */}
                      {(() => {
                        const deliveryDates = order.shipments
                          ?.filter((s: any) => s.shipping?.actualDelivery || s.shipping?.status?.toLowerCase() === 'delivered')
                          .map((s: any) => s.shipping?.actualDelivery ? new Date(s.shipping.actualDelivery).getTime() : Date.now());
                        const latestDelivery = deliveryDates?.length ? Math.max(...deliveryDates) : null;
                        if (!latestDelivery) return null;
                        const disputeDeadline = latestDelivery + (48 * 60 * 60 * 1000);
                        const remaining = disputeDeadline - Date.now();
                        if (remaining <= 0) return null;
                        const hours = Math.floor(remaining / (1000 * 60 * 60));
                        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                        return (
                          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                            <Clock className="w-4 h-4" />
                            <span>Dispute window: <strong>{hours}h {minutes}m</strong> remaining</span>
                          </div>
                        );
                      })()}
                      <Button
                        variant="outline"
                        onClick={() => setShowIssueModal(true)}
                        className="flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Report Issue
                      </Button>
                    </>
                  )}

                  <Button variant="outline" asChild>
                    <Link href={`/home/user/orders`} className="flex items-center gap-2 bg-green-100 text-green-600">
                      <Package className="w-4 h-4" />
                      Back to Orders
                    </Link>
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="font-roboto text-sm font-semibold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2 font-roboto text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>
                      {getCurrencySymbol(order.items?.[0]?.metadata?.userCurrency || 'USD')}
                      {order.items
                        ?.reduce(
                          (sum: number, item: any) =>
                            sum +
                            (item.metadata?.amountPaidByUser || item.price) * item.quantity,
                          0
                        )
                        ?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold">
                      {getCurrencySymbol(order.items?.[0]?.metadata?.userCurrency || 'USD')}
                      {(
                        order.paymentId?.amount ||
                        order.items?.reduce(
                          (sum: number, item: any) =>
                            sum +
                            (item.metadata?.amountPaidByUser || item.price) * item.quantity,
                          0
                        )
                      )?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                <Separator className="my-3 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

                {/* Payment Information */}
                <div>
                  <h4 className="font-roboto font-medium text-xs mb-2 flex items-center gap-2 text-blue-700">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-1.5 font-roboto text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="text-blue-600">
                        #
                        {order.paymentId?._id?.slice(-8) ||
                          order.paymentId?.slice?.(-8) ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="secondary" className="text-[10px] h-5">Paid</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Report Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Issue Type *</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                >
                  <option value="">Select issue type</option>
                  <option value="damaged_product">Damaged Product</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="missing_item">Missing Item</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="delivery_issue">Delivery Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload Images (Max 5)</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-5 h-5 mr-2" />
                    <span className="text-sm">Choose images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleIssueImageChange}
                    />
                  </label>
                  {issueImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {issueImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <Image
                            src={preview}
                            alt={`Issue ${idx + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover"
                          />
                          <button
                            onClick={() => removeIssueImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSubmitIssue}
                  disabled={isSubmittingIssue}
                >
                  {isSubmittingIssue ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Issue"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowIssueModal(false);
                    setIssueType("");
                    setIssueDescription("");
                    setIssueImages([]);
                    setIssueImagePreviews([]);
                  }}
                  disabled={isSubmittingIssue}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full sm:max-w-[850px] sm:w-full">
            <CardHeader>
              <CardTitle>Review Product</CardTitle>
              <p className="text-sm text-gray-600">{selectedProduct.name}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Rating *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendor Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor Rating (Optional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setVendorRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= vendorRating
                            ? "fill-blue-400 text-blue-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Share your experience with this product..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSubmitReview}
                  disabled={addReviewMutation.isPending || rating === 0}
                >
                  {addReviewMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedProduct(null);
                    setRating(0);
                    setComment("");
                    setVendorRating(0);
                  }}
                  disabled={addReviewMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}