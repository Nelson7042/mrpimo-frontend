"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Images, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { useProductListing } from "@/contexts/ProductLisitngContext";

interface ImageUploaderProps {
  src: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ src }) => {
  const { updateProductDetails, productDetails } = useProductListing();
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(
    productDetails?.images?.[0] || null
  );
  const [additionalImages, setAdditionalImages] = useState<string[]>(
    productDetails?.images?.slice(1) || []
  );
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    videos: [] as File[],
  });
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const additionalInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  useEffect(() => {
    if (src) {
      setPreview(src);
    }
  }, [src]);

  useEffect(() => {
    const handleImageErrors = (event: CustomEvent) => {
      setErrors(event.detail);
    };

    document.addEventListener(
      "imageErrors",
      handleImageErrors as EventListener
    );

    return () => {
      document.removeEventListener(
        "imageErrors",
        handleImageErrors as EventListener
      );
    };
  }, []);

  const handleImage = useCallback(
    async (file: File) => {
      const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          "File size exceeds the maximum limit of 10MB",
          toastConfigError
        );
        return;
      }

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload a valid image file (JPEG, JPG, PNG).",
          toastConfigError
        );
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        // updateProductDetails("productImageUrl", [reader.result as string]);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      setLoading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("productImage", file);
        // Start with initial progress
        setUploadProgress(5);
        const response = await axios.post(
          "http://localhost:5800/api/v1/products/upload",
          formData,
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round(
                  (progressEvent.loaded * 90) / progressEvent.total
                );
                setUploadProgress(Math.min(progress, 90));
              }
            },
          }
        );
        // Set to 100% only after successful response
        setUploadProgress(100);
        if (response.data.success) {
          // if (response.data.message === "Image already exists!") {
          //   toast.error("Image uploaded by you or someone else. Please upload a different image.", toastConfigError);
          //   setPreview(null);
          //   return;
          // }
          updateProductDetails("images", [response.data.imageUrl]); // Save Cloudinary URL
          toast.success("Image uploaded successfully", toastConfigSuccess);
          setErrors({});
        } else {
          setPreview(null);
          toast.error(
            "An error occurred while uploading image",
            toastConfigError
          );
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(
          "Error uploading image. Please try again.",
          toastConfigError
        );
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [updateProductDetails]
  );

  const handleAdditionalImage = useCallback(
    async (file: File) => {
      const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      if (productDetails.images.length == 0) {
        toast.error("Please upload a main image first.", toastConfigError);
        return;
      }

      if (additionalImages.length >= 5) {
        toast.error(
          "You can only upload up to 5 additional images.",
          toastConfigError
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          "File size exceeds the maximum limit of 10MB",
          toastConfigError
        );
        return;
      }

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload a valid image file (JPEG, JPG, PNG).",
          toastConfigError
        );
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAdditionalImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);

      // Upload logic would go here
      try {
        const formData = new FormData();
        formData.append("productImage", file);

        const response = await axios.post(
          "http://localhost:5800/api/v1/products/upload",
          formData
        );

        if (response.data.success) {
          // Get current additional images from context
          // const currentImages = additionalImages.map(img =>
          //   img.startsWith('data:') ? img : img
          // );

          // Add the new Cloudinary URL
          updateProductDetails("images", [
            ...productDetails.images,
            response.data.imageUrl,
          ]);
          toast.success(
            "Additional image uploaded successfully",
            toastConfigSuccess
          );
        } else {
          toast.error(
            "An error occurred while uploading additional image",
            toastConfigError
          );
        }
      } catch (error) {
        console.error("Error uploading additional image:", error);
        toast.error(
          "Error uploading additional image. Using local preview.",
          toastConfigError
        );
      }
    },
    [additionalImages, updateProductDetails]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleImage(file);
      }
    },
    [handleImage]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleAdditionalImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => handleAdditionalImage(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 100 * 1024 * 1024) {
        setVideoError("File size exceeds the maximum limit of 100MB");
        return;
      }
      setVideoError(null);
      setVideoLoading(true);
      setFormData((prev) => ({
        ...prev,
        videos: [file],
      }));
      setVideoPreview(URL.createObjectURL(file));
      setVideoLoading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    const updatedImages = productDetails.images.filter(
      (_: any, i: number) => i !== index + 1
    );
    updateProductDetails("images", updatedImages);
  };

  return (
    <div
      className={`relative ${loading ? "pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
    >
      <div
        className={`mt-1 flex gap-y-4 justify-center p-6 border-2 ${
          dragActive
            ? "border-indigo-600 bg-indigo-50"
            : "border-[#365aa4] border-dashed"
        } rounded-md transition-colors duration-300 ${
          errors.imagesError ? "border-red-500 border-dashed" : ""
        }`}
      >
        <div className="space-y-1 w-full">
          {preview ? (
            <div className="relative h-48 w-full">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={typeof preview === "string" ? preview : ""}
                alt="Preview"
                className="mx-auto w-full h-full object-contain object-center rounded-md p-2"
              />
              {!loading && (
                <>
                  <button
                    onClick={() => {
                      setPreview(null);
                      updateProductDetails("images", []);
                    }}
                    className="absolute cursor-pointer top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer h-42 lg:h-60 w-full flex flex-col items-center justify-center rounded-lg gap-y-2">
                <div className="flex justify-center text-sm text-gray-400 w-full">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Plus size={30} className="" />
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleChange}
                      ref={inputRef}
                      disabled={loading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 text-center w-full">
                  Click or drag to upload main image
                </p>
              </div>
            </>
          )}
          {loading && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-semibold inline-block text-[#2563eb]">
                    Uploading...
                  </span>
                  <span className="text-xs font-semibold inline-block text-[#2563eb]">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.2 }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#2563eb]/90"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="w-full mt-4">
        <p className="text-sm text-gray-400 font-[400] mb-4">
          Upload additional images
        </p>
        <div className="flex flex-row flex-wrap items-center gap-4 mb-2">
          {additionalImages.map((img, index) => (
            <div
              key={index}
              className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={img}
                alt={`Additional product image ${index + 1}`}
                className="h-full w-full object-cover object-center"
              />
              <button
                onClick={() => removeAdditionalImage(index)}
                className="absolute top-1 cursor-pointer right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <div className="h-24 w-24 rounded-lg border-2 hover:bg-gray-200 transition-colors border-dashed border-[#365AA4] bg-gray-100 flex items-center justify-center">
            <label
              htmlFor="additional-images"
              className="cursor-pointer h-full w-full flex items-center justify-center"
            >
              <Plus size={30} className="text-gray-600" />
              <input
                id="additional-images"
                name="additional-images"
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                ref={additionalInputRef}
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="w-full mt-4 mb-3">
        <p className="text-sm text-gray-400 font-[400] mb-4">
          Upload product video
        </p>
        <div className="border-2 border-dashed border-blue-400 rounded-lg p-4 bg-[#FDF8F3] hover:bg-blue-100 transition-colors cursor-pointer">
          {formData.videos.length > 0 ? (
            <div className="relative w-full">
              <video
                controls
                className="w-full max-h-48 rounded"
                style={{ maxWidth: "100%" }}
              >
                <source src={URL.createObjectURL(formData.videos[0])} />
              </video>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFormData((prev) => ({
                    ...prev,
                    videos: [],
                  }));
                }}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="video-upload"
              className="cursor-pointer block w-full h-full"
            >
              <div className="text-center py-4">
                <Plus className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-blue-600 font-medium">
                  Click or drag to add video
                </p>
              </div>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="sr-only"
                ref={videoInputRef}
              />
            </label>
          )}
          {videoError && (
            <p className="text-xs text-red-500 mt-2">{videoError}</p>
          )}
          {videoLoading && (
            <p className="text-xs text-blue-500 mt-2">Uploading video...</p>
          )}
        </div>
      </div>
      {dragActive && (
        <div
          className="absolute inset-0 z-10"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        />
      )}
    </div>
  );
};

export default ImageUploader;
