"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Upload,
  X,
  ImageIcon,
  Video,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { disputeService } from "@/services/disputeService";

// ─── Constants ───

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;

// ─── Types ───

type FileStatus = "pending" | "uploading" | "success" | "error";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: FileStatus;
  progress: number;
  error?: string;
  url?: string;
  type: "image" | "video";
}

interface EvidenceUploadSectionProps {
  issueId: string;
  disputeStatus: string;
  existingEvidence?: string[];
  onEvidenceAdded?: (urls: string[]) => void;
}

// ─── Helpers ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getFileType(file: File): "image" | "video" | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

function isReadOnly(status: string): boolean {
  return status === "resolved" || status === "closed";
}

// ─── Component ───

export default function EvidenceUploadSection({
  issueId,
  disputeStatus,
  existingEvidence = [],
  onEvidenceAdded,
}: EvidenceUploadSectionProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const readOnly = isReadOnly(disputeStatus);

  // Count current images and videos
  const imageCount = files.filter((f) => f.type === "image").length;
  const videoCount = files.filter((f) => f.type === "video").length;

  // ─── Validation ───

  const validateFiles = useCallback(
    (newFiles: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      let currentImages = imageCount;
      let currentVideos = videoCount;

      for (const file of newFiles) {
        const fileType = getFileType(file);

        if (!fileType) {
          errors.push(
            `"${file.name}" has an unsupported format. Allowed: JPEG, PNG, WebP, MP4, WebM.`
          );
          continue;
        }

        if (fileType === "image") {
          if (currentImages >= MAX_IMAGES) {
            errors.push(
              `Cannot add "${file.name}". Maximum of ${MAX_IMAGES} images reached.`
            );
            continue;
          }
          currentImages++;
        } else {
          if (currentVideos >= MAX_VIDEOS) {
            errors.push(
              `Cannot add "${file.name}". Maximum of ${MAX_VIDEOS} videos reached.`
            );
            continue;
          }
          currentVideos++;
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [imageCount, videoCount]
  );

  // ─── File Selection ───

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setValidationError(null);
      const fileArray = Array.from(selectedFiles);
      const { valid, errors } = validateFiles(fileArray);

      if (errors.length > 0) {
        setValidationError(errors.join(" "));
      }

      if (valid.length === 0) return;

      const newUploadFiles: UploadFile[] = valid.map((file) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as FileStatus,
        progress: 0,
        type: getFileType(file)!,
      }));

      setFiles((prev) => [...prev, ...newUploadFiles]);

      // Start uploading each file
      newUploadFiles.forEach((uploadFile) => {
        uploadSingleFile(uploadFile);
      });
    },
    [validateFiles]
  );

  // ─── Upload Logic ───

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    // Mark as uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading" as FileStatus, progress: 0 } : f
      )
    );

    try {
      const result = await disputeService.uploadEvidenceFile(
        uploadFile.file,
        (progress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, progress } : f
            )
          );
        }
      );

      // Attach the URL to the dispute
      await disputeService.addEvidence(issueId, [result.url]);

      // Mark as success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "success" as FileStatus, progress: 100, url: result.url }
            : f
        )
      );

      onEvidenceAdded?.([result.url]);
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as FileStatus,
                progress: 0,
                error: err.message || "Upload failed",
              }
            : f
        )
      );
    }
  };

  // ─── Retry ───

  const handleRetry = (fileId: string) => {
    const fileToRetry = files.find((f) => f.id === fileId);
    if (!fileToRetry) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: "pending" as FileStatus, progress: 0, error: undefined }
          : f
      )
    );

    uploadSingleFile(fileToRetry);
  };

  // ─── Remove ───

  const handleRemove = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // ─── Read-Only Mode ───

  if (readOnly) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Evidence</Label>
        {existingEvidence.length === 0 ? (
          <p className="text-sm text-gray-500">No evidence submitted.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingEvidence.map((url, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square"
              >
                {url.match(/\.(mp4|webm)($|\?)/) ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Upload Mode ───

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          Upload Evidence
        </Label>
        <span className="text-xs text-gray-500">
          Images: {imageCount}/{MAX_IMAGES} · Videos: {videoCount}/{MAX_VIDEOS}
        </span>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="flex gap-3">
        {imageCount < MAX_IMAGES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            className="gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Add Images
          </Button>
        )}
        {videoCount < MAX_VIDEOS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => videoInputRef.current?.click()}
            className="gap-2"
          >
            <Video className="w-4 h-4" />
            Add Videos
          </Button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={ALLOWED_VIDEO_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />

      {/* File List with Progress */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                {uploadFile.type === "image" ? (
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* File Info & Progress */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {uploadFile.file.name}
                </p>

                {/* Progress Bar */}
                {uploadFile.status === "uploading" && (
                  <div className="mt-1.5">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {uploadFile.progress}%
                    </p>
                  </div>
                )}

                {/* Status Messages */}
                {uploadFile.status === "success" && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" />
                    Uploaded
                  </p>
                )}
                {uploadFile.status === "error" && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {uploadFile.error || "Upload failed"}
                  </p>
                )}
                {uploadFile.status === "pending" && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Preparing...
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-1">
                {uploadFile.status === "error" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRetry(uploadFile.id)}
                    className="h-8 w-8 p-0"
                    title="Retry upload"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
                {uploadFile.status !== "uploading" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(uploadFile.id)}
                    className="h-8 w-8 p-0"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Evidence */}
      {existingEvidence.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium">
            Previously uploaded evidence
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingEvidence.map((url, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square"
              >
                {url.match(/\.(mp4|webm)($|\?)/) ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      {files.length === 0 && existingEvidence.length === 0 && (
        <p className="text-xs text-gray-400">
          Supported formats: JPEG, PNG, WebP (images), MP4, WebM (videos). Max
          5 images and 2 videos.
        </p>
      )}
    </div>
  );
}
