"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disputeService } from "@/services/disputeService";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import {
  Loader2,
  ArrowLeft,
  Send,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Shield,
  CheckCircle,
  Package,
  User,
  Store,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "in-progress":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "resolved":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "closed":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 hover:bg-red-50";
    case "medium":
      return "bg-orange-50 text-orange-700 hover:bg-orange-50";
    case "low":
      return "bg-blue-50 text-blue-700 hover:bg-blue-50";
    default:
      return "bg-gray-50 text-gray-700 hover:bg-gray-50";
  }
};

/* ─── DisputeChat Component (embedded) ─── */
function DisputeChat({ issueId, chatStatus }: { issueId: string; chatStatus?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/dispute-chat/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data?.data?.messages || []);
      }
    } catch {
      setChatError("Failed to load chat messages");
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [issueId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/dispute-chat/${issueId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
      }
    } catch {
      // silently fail
    } finally {
      setIsSending(false);
    }
  };

  const isClosed = chatStatus === "closed";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-sm text-gray-900">Dispute Chat</h3>
        {isClosed && (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 ml-auto">
            <span className="text-xs">Chat Closed</span>
          </Badge>
        )}
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoadingChat ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : chatError ? (
          <p className="text-sm text-red-500 text-center">{chatError}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">No messages yet</p>
        ) : (
          messages.map((msg: any) => {
            const senderName =
              msg.senderId?.profile?.firstName ||
              msg.senderId?.email ||
              "Unknown";
            return (
              <div key={msg._id} className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-700">{senderName}</span>
                  <span className="text-xs text-gray-400">
                    {msg.createdAt ? format(new Date(msg.createdAt), "MMM dd, h:mm a") : ""}
                  </span>
                </div>
                {msg.text && (
                  <p className="text-sm text-gray-800 bg-white rounded-lg px-3 py-2 inline-block border border-gray-100">
                    {msg.text}
                  </p>
                )}
                {msg.attachment?.url && (
                  <div className="mt-1">
                    {msg.messageType === "image" ? (
                      <img src={msg.attachment.url} alt="attachment" className="max-w-[200px] rounded-lg border border-gray-200" />
                    ) : (
                      <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                        {msg.attachment.fileName || "View attachment"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {!isClosed && (
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <Button type="submit" size="sm" disabled={!newMessage.trim() || isSending} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      )}
    </div>
  );
}

/* ─── Evidence Gallery Component ─── */
function EvidenceGallery({ urls, title }: { urls: string[]; title: string }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4" />
        {title}
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {urls.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(url)}
            className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
          >
            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Evidence" className="max-w-full max-h-[80vh] rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

/* ─── Main Detail Page ─── */
export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.issueId as string;

  const [dispute, setDispute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign admin state
  const [assignAdminId, setAssignAdminId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Priority state
  const [newPriority, setNewPriority] = useState("");
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  // Resolution form state
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState("");
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [partialRefundAmount, setPartialRefundAmount] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Refund state
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const data: any = await disputeService.getAdminDisputeDetail(issueId);
      const d = data?.data || data?.issue || data;
      setDispute(d);
      setNewPriority(d?.priority || "");
    } catch (err: any) {
      setError(err.message || "Failed to load dispute details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) fetchDetail();
  }, [issueId]);

  const handleAssign = async () => {
    if (!assignAdminId.trim() || isAssigning) return;
    setIsAssigning(true);
    try {
      await disputeService.assignDispute(issueId, assignAdminId.trim());
      toast.success("Dispute assigned successfully");
      setAssignAdminId("");
      await fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign dispute");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdatePriority = async () => {
    if (!newPriority || newPriority === dispute?.priority || isUpdatingPriority) return;
    setIsUpdatingPriority(true);
    try {
      await disputeService.updatePriority(issueId, newPriority);
      toast.success("Priority updated successfully");
      await fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to update priority");
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionOutcome || !resolutionDescription.trim() || isResolving) return;
    setIsResolving(true);
    try {
      const body: any = {
        resolutionOutcome,
        resolutionDescription: resolutionDescription.trim(),
      };
      if (resolutionOutcome === "partial_refund" && partialRefundAmount) {
        body.partialRefundAmount = parseFloat(partialRefundAmount);
      }
      await disputeService.resolveDispute(issueId, body);
      toast.success("Dispute resolved successfully");
      setShowResolveForm(false);
      setResolutionOutcome("");
      setResolutionDescription("");
      setPartialRefundAmount("");
      await fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve dispute");
    } finally {
      setIsResolving(false);
    }
  };

  const handleProcessRefund = async () => {
    if (isProcessingRefund) return;
    setIsProcessingRefund(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/refunds/${issueId}/process`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to process refund");
      }
      toast.success("Refund processed successfully");
      await fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to process refund");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const canResolve =
    dispute?.status === "open" || dispute?.status === "in-progress";
  const hasRefundOutcome =
    dispute?.resolutionOutcome === "full_refund" ||
    dispute?.resolutionOutcome === "partial_refund";
  const showRefundButton =
    (dispute?.status === "resolved" || dispute?.status === "closed") && hasRefundOutcome;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 mb-4">{error || "Dispute not found"}</p>
        <Button onClick={() => router.push("/admin/disputes")}>Back to Disputes</Button>
      </div>
    );
  }

  const buyerName =
    dispute.userId?.profile?.firstName
      ? `${dispute.userId.profile.firstName} ${dispute.userId.profile.lastName || ""}`.trim()
      : dispute.userId?.email || "—";
  const buyerEmail = dispute.userId?.email || "—";
  const vendorName =
    dispute.orderId?.shipments?.[0]?.vendorId?.businessInfo?.name ||
    dispute.orderId?.shipments?.[0]?.vendorId?.userId?.email ||
    "—";
  const assignedName =
    dispute.assignedTo?.profile?.firstName
      ? `${dispute.assignedTo.profile.firstName} ${dispute.assignedTo.profile.lastName || ""}`.trim()
      : dispute.assignedTo?.email || "Unassigned";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/disputes")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            {dispute.caseId || `Dispute #${dispute._id?.slice(-8)}`}
          </h2>
          <p className="text-sm text-gray-500">
            Opened {dispute.createdAt ? format(new Date(dispute.createdAt), "MMM dd, yyyy 'at' h:mm a") : "—"}
          </p>
        </div>
        <Badge className={getStatusBadgeClass(dispute.status)}>
          <span className="capitalize">{dispute.status}</span>
        </Badge>
        <Badge className={getPriorityBadgeClass(dispute.priority)}>
          <span className="capitalize">{dispute.priority}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Info, Evidence, Vendor Response */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order, Buyer, Vendor Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-gray-900">Order</h3>
              </div>
              <p className="text-sm text-gray-600">
                #{dispute.orderId?._id?.slice(-8) || dispute.orderId?.toString().slice(-8) || "—"}
              </p>
              {dispute.orderId?.totalAmount != null && (
                <p className="text-xs text-gray-500 mt-1">
                  Total: ${dispute.orderId.totalAmount.toFixed(2)}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-sm text-gray-900">Buyer</h3>
              </div>
              <p className="text-sm text-gray-600">{buyerName}</p>
              <p className="text-xs text-gray-500 mt-1">{buyerEmail}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-sm text-gray-900">Vendor</h3>
              </div>
              <p className="text-sm text-gray-600">{vendorName}</p>
            </div>
          </div>

          {/* Dispute Details */}
          <div className="bg-white rounded-lg shadow p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-sm text-gray-900">Dispute Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Reason</p>
                <p className="font-medium text-gray-900">{dispute.reason}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Return Outcome Requested</p>
                <p className="font-medium text-gray-900 capitalize">
                  {dispute.returnOutcome?.replace("_", " ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Assigned To</p>
                <p className="font-medium text-gray-900">{assignedName}</p>
              </div>
              {dispute.resolvedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Resolved At</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(dispute.resolvedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>
            {dispute.description && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{dispute.description}</p>
              </div>
            )}
            {dispute.resolution && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Resolution</p>
                <p className="text-sm text-gray-700">{dispute.resolution}</p>
              </div>
            )}
            {dispute.resolutionOutcome && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Resolution Outcome</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {dispute.resolutionOutcome.replace(/_/g, " ")}
                </p>
                {dispute.resolutionOutcome === "partial_refund" && dispute.partialRefundAmount != null && (
                  <p className="text-sm text-gray-700 mt-1">
                    Partial refund amount: ${dispute.partialRefundAmount.toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Evidence Galleries */}
          <div className="bg-white rounded-lg shadow p-5 space-y-4">
            <EvidenceGallery urls={dispute.evidenceUrls || []} title="Buyer Evidence" />
            <EvidenceGallery urls={dispute.vendorEvidenceUrls || []} title="Vendor Evidence" />
            {(!dispute.evidenceUrls || dispute.evidenceUrls.length === 0) &&
              (!dispute.vendorEvidenceUrls || dispute.vendorEvidenceUrls.length === 0) && (
                <div className="text-center py-6">
                  <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No evidence uploaded</p>
                </div>
              )}
          </div>

          {/* Vendor Response */}
          {dispute.vendorResponse && (
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-sm text-gray-900">Vendor Response</h3>
              </div>
              <p className="text-sm text-gray-700">{dispute.vendorResponse}</p>
              {dispute.vendorRespondedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Responded on {format(new Date(dispute.vendorRespondedAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column — Actions + Chat */}
        <div className="lg:col-span-1 space-y-6">
          {/* Action Controls */}
          <div className="bg-white rounded-lg shadow p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-sm text-gray-900">Admin Actions</h3>
            </div>

            {/* Assign to Admin */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                <UserCheck className="w-3 h-3 inline mr-1" />
                Assign to Admin
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignAdminId}
                  onChange={(e) => setAssignAdminId(e.target.value)}
                  placeholder="Admin user ID"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <Button
                  size="sm"
                  onClick={handleAssign}
                  disabled={!assignAdminId.trim() || isAssigning}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                </Button>
              </div>
            </div>

            {/* Update Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Update Priority</label>
              <div className="flex gap-2">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <Button
                  size="sm"
                  onClick={handleUpdatePriority}
                  disabled={newPriority === dispute.priority || isUpdatingPriority}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingPriority ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                </Button>
              </div>
            </div>

            {/* Resolve Button */}
            {canResolve && !showResolveForm && (
              <Button
                onClick={() => setShowResolveForm(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Dispute
              </Button>
            )}

            {/* Process Refund Button */}
            {showRefundButton && (
              <Button
                onClick={handleProcessRefund}
                disabled={isProcessingRefund}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessingRefund ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process Refund
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Resolution Form */}
          {showResolveForm && canResolve && (
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Resolution Form</h3>
              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Outcome <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={resolutionOutcome}
                    onChange={(e) => setResolutionOutcome(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select outcome...</option>
                    <option value="full_refund">Full Refund</option>
                    <option value="partial_refund">Partial Refund</option>
                    <option value="product_replacement">Product Replacement</option>
                    <option value="dispute_rejected">Dispute Rejected</option>
                  </select>
                </div>

                {resolutionOutcome === "partial_refund" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Partial Refund Amount ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={partialRefundAmount}
                      onChange={(e) => setPartialRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolutionDescription}
                    onChange={(e) => setResolutionDescription(e.target.value)}
                    placeholder="Describe the resolution..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowResolveForm(false);
                      setResolutionOutcome("");
                      setResolutionDescription("");
                      setPartialRefundAmount("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!resolutionOutcome || !resolutionDescription.trim() || isResolving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isResolving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        Resolving...
                      </>
                    ) : (
                      "Confirm Resolution"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Dispute Chat */}
          <DisputeChat
            issueId={issueId}
            chatStatus={dispute.status === "closed" ? "closed" : "active"}
          />
        </div>
      </div>
    </div>
  );
}
