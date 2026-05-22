"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Save,
  Plus,
  X,
  ExternalLink,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { disputeService } from "@/services/disputeService";

// ─── Types ───

interface VendorResponseEditorProps {
  issueId: string;
  initialResponse?: string;
  initialEvidenceUrls?: string[];
  vendorRespondedAt?: string;
  lastEditedAt?: string;
  isEditable: boolean;
  templateContent?: string;
  onResponseTextChange?: (text: string) => void;
}

// ─── Helpers ───

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ───

export default function VendorResponseEditor({
  issueId,
  initialResponse = "",
  initialEvidenceUrls = [],
  vendorRespondedAt,
  lastEditedAt,
  isEditable,
  templateContent,
  onResponseTextChange,
}: VendorResponseEditorProps) {
  const [responseText, setResponseText] = useState(initialResponse);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(initialEvidenceUrls);
  const [newUrl, setNewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync templateContent prop into internal state when it changes
  useEffect(() => {
    if (templateContent !== undefined && templateContent !== responseText) {
      setResponseText(templateContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateContent]);

  const handleAddUrl = useCallback(() => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;

    if (evidenceUrls.includes(trimmed)) {
      setError("This URL has already been added.");
      return;
    }

    setEvidenceUrls((prev) => [...prev, trimmed]);
    setNewUrl("");
    setError(null);
  }, [newUrl, evidenceUrls]);

  const handleRemoveUrl = useCallback((index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await disputeService.updateVendorResponse(issueId, {
        responseText: responseText || undefined,
        evidenceUrls,
      });
      setSuccessMessage("Response saved successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save response.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [issueId, responseText, evidenceUrls]);

  // ─── Read-Only View ───

  if (!isEditable) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">
            Vendor Response
          </Label>
          <div className="mt-1 rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap">
            {initialResponse || (
              <span className="text-muted-foreground italic">
                No response submitted.
              </span>
            )}
          </div>
        </div>

        {initialEvidenceUrls.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Evidence
            </Label>
            <ul className="mt-1 space-y-1">
              {initialEvidenceUrls.map((url, index) => (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {url.length > 60 ? `${url.slice(0, 60)}...` : url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamps */}
        <TimestampDisplay
          vendorRespondedAt={vendorRespondedAt}
          lastEditedAt={lastEditedAt}
        />
      </div>
    );
  }

  // ─── Editable View ───

  return (
    <div className="space-y-4">
      {/* Response Text Area */}
      <div>
        <Label htmlFor="vendor-response" className="text-sm font-medium">
          Your Response
        </Label>
        <Textarea
          id="vendor-response"
          value={responseText}
          onChange={(e) => {
            setResponseText(e.target.value);
            onResponseTextChange?.(e.target.value);
          }}
          placeholder="Write your response to this dispute..."
          className="mt-1 min-h-[120px]"
          disabled={isSaving}
        />
      </div>

      {/* Evidence URL Management */}
      <div>
        <Label className="text-sm font-medium">Evidence URLs</Label>
        <div className="mt-1 space-y-2">
          {evidenceUrls.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-blue-600 hover:underline"
              >
                {url}
              </a>
              <button
                type="button"
                onClick={() => handleRemoveUrl(index)}
                disabled={isSaving}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Remove evidence URL ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="https://res.cloudinary.com/..."
              className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUrl}
              disabled={isSaving || !newUrl.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <TimestampDisplay
        vendorRespondedAt={vendorRespondedAt}
        lastEditedAt={lastEditedAt}
      />

      {/* Error / Success Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full sm:w-auto"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {isSaving ? "Saving..." : "Save Response"}
      </Button>
    </div>
  );
}

// ─── Timestamp Sub-Component ───

function TimestampDisplay({
  vendorRespondedAt,
  lastEditedAt,
}: {
  vendorRespondedAt?: string;
  lastEditedAt?: string;
}) {
  if (!vendorRespondedAt && !lastEditedAt) return null;

  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {vendorRespondedAt && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Submitted: {formatTimestamp(vendorRespondedAt)}
        </span>
      )}
      {lastEditedAt && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last edited: {formatTimestamp(lastEditedAt)}
        </span>
      )}
    </div>
  );
}
