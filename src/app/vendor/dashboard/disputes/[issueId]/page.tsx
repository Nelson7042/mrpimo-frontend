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
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

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

      {/* Messages */}
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
                  <span className="text-xs font-semibold text-gray-700">
                    {senderName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {msg.createdAt
                      ? format(new Date(msg.createdAt), "MMM dd, h:mm a")
                      : ""}
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
                      <img
                        src={msg.attachment.url}
                        alt="attachment"
                        className="max-w-[200px] rounded-lg border border-gray-200"
                      />
                    ) : (
                      <a
                        href={msg.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
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

      {/* Send Message */}
      {!isClosed && (
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-gray-200 flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
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
            <img
              src={url}
              alt={`Evidence ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Evidence"
            className="max-w-full max-h-[80vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main Detail Page ─── */
export default function VendorDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.issueId as string;

  const [dispute, setDispute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vendor response form state
  const [responseText, setResponseText] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const data: any = await disputeService.getDisputeDetail(issueId);
        setDispute(data?.data || data?.issue || data);
      } catch (err: any) {
        setError(err.message || "Failed to load dispute details");
      } finally {
        setIsLoading(false);
      }
    };
    if (issueId) fetchDetail();
  }, [issueId]);

  const isEditable =
    dispute?.status === "open" || dispute?.status === "in-progress";

  const handleAddEvidenceUrl = () => {
    const trimmed = evidenceUrl.trim();
    if (trimmed && !evidenceUrls.includes(trimmed)) {
      setEvidenceUrls((prev) => [...prev, trimmed]);
      setEvidenceUrl("");
    }
  };

  const handleRemoveEvidenceUrl = (url: string) => {
    setEvidenceUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await disputeService.submitVendorResponse(issueId, {
        responseText: responseText.trim(),
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      });
      setSubmitSuccess(true);
      // Refresh dispute data to reflect status change
      const data: any = await disputeService.getDisputeDetail(issueId);
      setDispute(data?.data || data?.issue || data);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 font-roboto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 font-roboto flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 mb-4">{error || "Dispute not found"}</p>
          <Button onClick={() => router.push("/vendor/dashboard/disputes")}>
            Back to Disputes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 font-roboto">
      <div className="px-2 lg:px-5">
        {/* Back Button + Title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/vendor/dashboard/disputes")}
            className="flex items-center text-xs text-gray-600 hover:text-gray-800 cursor-pointer hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Disputes
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">
            {dispute.caseId || `Dispute #${dispute._id?.slice(-8)}`}
          </h1>
          <p className="text-xs text-gray-500">
            Opened{" "}
            {dispute.createdAt
              ? format(new Date(dispute.createdAt), "MMM dd, yyyy 'at' h:mm a")
              : "—"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Info + Evidence + Response Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-sm text-gray-900">
                  Dispute Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <Badge className={getStatusBadgeClass(dispute.status)}>
                    <span className="capitalize text-xs">{dispute.status}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Priority</p>
                  <Badge className={getPriorityBadgeClass(dispute.priority)}>
                    <span className="capitalize text-xs">{dispute.priority}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Order Reference</p>
                  <p className="font-medium text-gray-900">
                    #{dispute.orderId?._id?.slice(-8) || dispute.orderId?.toString().slice(-8) || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Buyer Reason</p>
                  <p className="font-medium text-gray-900">{dispute.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Return Outcome Requested</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {dispute.returnOutcome?.replace("_", " ") || "—"}
                  </p>
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
                  <p className="text-xs text-gray-500 mb-1">Buyer Description</p>
                  <p className="text-sm text-gray-700">{dispute.description}</p>
                </div>
              )}
            </div>

            {/* Resolution Outcome (shown when resolved/closed) */}
            {(dispute.status === "resolved" || dispute.status === "closed") &&
              dispute.resolutionOutcome && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-sm text-blue-800">
                      Resolution Outcome
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-blue-600 mb-0.5">Outcome</p>
                      <p className="font-medium text-blue-900 capitalize">
                        {dispute.resolutionOutcome?.replace(/_/g, " ")}
                      </p>
                    </div>
                    {dispute.resolutionOutcome === "partial_refund" &&
                      dispute.partialRefundAmount != null && (
                        <div>
                          <p className="text-xs text-blue-600 mb-0.5">Refund Amount</p>
                          <p className="font-bold text-lg text-blue-900">
                            ${dispute.partialRefundAmount.toFixed(2)}
                          </p>
                        </div>
                      )}
                  </div>
                  {dispute.resolution && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Resolution Details</p>
                      <p className="text-sm text-blue-800">{dispute.resolution}</p>
                    </div>
                  )}
                </div>
              )}

            {/* Buyer Evidence Gallery */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <EvidenceGallery
                urls={dispute.evidenceUrls || []}
                title="Buyer Evidence"
              />
              {(!dispute.evidenceUrls || dispute.evidenceUrls.length === 0) && (
                <div className="text-center py-6">
                  <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No buyer evidence uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Vendor Response Form / Read-only Response */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-sm text-gray-900">
                  Your Response
                </h2>
                {!isEditable && (
                  <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 ml-auto">
                    <span className="text-xs">Read Only</span>
                  </Badge>
                )}
              </div>

              {/* Show existing response if already submitted */}
              {dispute.vendorResponse && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700">{dispute.vendorResponse}</p>
                  {dispute.vendorRespondedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Responded on{" "}
                      {format(
                        new Date(dispute.vendorRespondedAt),
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </p>
                  )}
                  {/* Vendor Evidence */}
                  {dispute.vendorEvidenceUrls &&
                    dispute.vendorEvidenceUrls.length > 0 && (
                      <div className="mt-3">
                        <EvidenceGallery
                          urls={dispute.vendorEvidenceUrls}
                          title="Your Evidence"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Editable form when dispute is open/in-progress and no response yet */}
              {isEditable && !dispute.vendorResponse && !submitSuccess && (
                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Response <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Provide your explanation or response to this dispute..."
                      rows={4}
                      maxLength={2000}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {responseText.length}/2000
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Evidence URL (optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://example.com/evidence.jpg"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddEvidenceUrl}
                        disabled={!evidenceUrl.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {evidenceUrls.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {evidenceUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1"
                          >
                            <span className="truncate flex-1 text-gray-600">
                              {url}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvidenceUrl(url)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={!responseText.trim() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Response"
                    )}
                  </Button>
                </form>
              )}

              {/* Success message after submission */}
              {submitSuccess && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-medium">
                    Response submitted successfully
                  </p>
                </div>
              )}

              {/* No response yet and not editable */}
              {!isEditable && !dispute.vendorResponse && (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No response was submitted for this dispute
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Chat */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <DisputeChat
                issueId={issueId}
                chatStatus={
                  dispute.status === "closed" ? "closed" : "active"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
