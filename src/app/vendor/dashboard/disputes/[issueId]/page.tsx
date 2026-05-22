"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disputeService } from "@/services/disputeService";
import {
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import DisputeChatPaginated from "@/components/disputes/DisputeChatPaginated";
import EscalationIndicator from "@/components/disputes/EscalationIndicator";
import VendorResponseEditor from "@/components/disputes/VendorResponseEditor";
import DisputeTemplateSelector from "@/components/disputes/DisputeTemplateSelector";
import { useUserStore } from "@/stores/useUserStore";

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
  const { user } = useUserStore();

  const [dispute, setDispute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Template content state for wiring DisputeTemplateSelector to VendorResponseEditor
  const [templateContent, setTemplateContent] = useState<string | undefined>(undefined);
  const [currentResponseText, setCurrentResponseText] = useState("");

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

  const handleTemplateSelect = (content: string) => {
    setTemplateContent(content);
    setCurrentResponseText(content);
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

        {/* Escalation Banner */}
        <EscalationIndicator escalatedAt={dispute.escalatedAt} variant="banner" />

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

            {/* Vendor Response Editor with Template Selector */}
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

              {/* Template Selector — shown when editable and composing */}
              {isEditable && (
                <div className="mb-4">
                  <DisputeTemplateSelector
                    onSelectTemplate={handleTemplateSelect}
                    currentContent={currentResponseText}
                  />
                </div>
              )}

              {/* Vendor Response Editor */}
              <VendorResponseEditor
                issueId={issueId}
                initialResponse={dispute.vendorResponse || ""}
                initialEvidenceUrls={dispute.vendorEvidenceUrls || []}
                vendorRespondedAt={dispute.vendorRespondedAt}
                lastEditedAt={dispute.vendorResponseLastEditedAt}
                isEditable={isEditable}
                templateContent={templateContent}
                onResponseTextChange={(text) => setCurrentResponseText(text)}
              />
            </div>
          </div>

          {/* Right Column — Chat */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <DisputeChatPaginated
                issueId={issueId}
                currentUserId={user?._id || ""}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
