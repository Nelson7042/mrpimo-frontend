"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
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
  Upload,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import axios from "axios";

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
          <div className="lg:col-span-2 space-y-3 md:space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">
                      Order #{order._id?.slice(-8) || "N/A"}
                    </CardTitle>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">
                      Placed on{" "}
                      {order.createdAt
                        ? format(new Date(order.createdAt), "MMMM dd, yyyy")
                        : "N/A"}
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
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <Link
                        href={{
                          pathname: "/home/product-details/[id]",
                          query: {
                            id: item?.productId._id,
                            productData: JSON.stringify(item?.productId), // Pass full product data
                          },
                        }}
                        as={`/home/product-details/${item?.productId._id}`} // Clean URL in browser
                        className=""
                      >
                        <Image
                          src={
                            item.productId?.images?.[0] || "/placeholder.svg"
                          }
                          alt={item.productId?.name || "Product"}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productId?.name}</h3>
                        <p className="text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-blue-600 font-medium">
                          $
                          {(item.displayPrice || item.price)?.toFixed(2) ||
                            "0.00"}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-medium">
                          $
                          {(
                            (item.displayPrice || item.price) * item.quantity
                          )?.toFixed(2) || "0.00"}
                        </p>
                        {order.status === "delivered" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenReviewModal(item.productId)
                            }
                            className="flex items-center gap-1"
                          >
                            <Star className="w-3 h-3" />
                            Review
                          </Button>
                        )}
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
                  {order.items?.[0]?.deliveryAddress && (
                    <>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">Delivery Address</p>
                          <p className="text-gray-600">
                            {order.items[0].deliveryAddress.street}
                            <br />
                            {order.items[0].deliveryAddress.city},{" "}
                            {order.items[0].deliveryAddress.state}
                            <br />
                            {order.items[0].deliveryAddress.country}{" "}
                            {order.items[0].deliveryAddress.postalCode}
                          </p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {order.shipments?.map((shipment: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      {order.shipments.length > 1 && (
                        <p className="font-medium text-sm">
                          Shipment {idx + 1}
                        </p>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium">Tracking Number</p>
                          <p className="text-blue-600">
                            {shipment.shipping?.trackingNumber || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Carrier</p>
                          <p className="text-gray-600 capitalize">
                            {shipment.shipping?.carrier || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Estimated Delivery</p>
                          <p className="text-gray-600">
                            {shipment.shipping?.estimatedDelivery
                              ? format(
                                  new Date(shipment.shipping.estimatedDelivery),
                                  "MMMM dd, yyyy"
                                )
                              : "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Shipping Status</p>
                          <p className="text-gray-600 capitalize">
                            {shipment.shipping?.status || "N/A"}
                          </p>
                        </div>
                      </div>
                      {idx < order.shipments.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  {(order.status === "pending" ||
                    order.status === "processing") && (
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
                        "Cancel Order"
                      )}
                    </Button>
                  )}

                  {order.status === "delivered" && (
                    <Button
                      variant="outline"
                      onClick={() => setShowRefundForm(!showRefundForm)}
                    >
                      Request Refund
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowIssueModal(true)}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Report Issue
                  </Button>

                  <Button variant="outline" asChild>
                    <Link href={`/home/user/orders`}>Back to Orders</Link>
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
                          "Submit Request"
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
                    <span>
                      $
                      {order.items
                        ?.reduce(
                          (sum: number, item: any) =>
                            sum +
                            (item.displayPrice || item.price) * item.quantity,
                          0
                        )
                        ?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">
                      $
                      {(
                        order.paymentId?.amount ||
                        order.items?.reduce(
                          (sum: number, item: any) =>
                            sum +
                            (item.displayPrice || item.price) * item.quantity,
                          0
                        )
                      )?.toFixed(2) || "0.00"}
                    </span>
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
                      <span className="text-blue-600">
                        #
                        {order.paymentId?._id?.slice(-8) ||
                          order.paymentId?.slice?.(-8) ||
                          "N/A"}
                      </span>
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
