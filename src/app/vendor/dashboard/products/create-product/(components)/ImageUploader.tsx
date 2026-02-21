"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Images, Plus, X, Upload, CheckCircle, ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import {
  toastConfigError,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { API_BASE_URL } from "@/utils/config";

// Theme color constant
const THEME_COLOR = "#002f7a";

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
  const [additionalLoading, setAdditionalLoading] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [additionalDragActive, setAdditionalDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [additionalUploadProgress, setAdditionalUploadProgress] = useState(0);
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

  const handleAdditionalDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setAdditionalDragActive(true);
    } else if (e.type === "dragleave") {
      setAdditionalDragActive(false);
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
          `${API_BASE_URL}/products/upload`,
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

      // Show preview immediately with loading state
      const tempIndex = additionalImages.length;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAdditionalImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);

      // Upload logic with progress tracking
      setAdditionalLoading(tempIndex);
      setAdditionalUploadProgress(0);
      
      try {
        const formData = new FormData();
        formData.append("productImage", file);

        const response = await axios.post(
          `${API_BASE_URL}/products/upload`,
          formData,
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round(
                  (progressEvent.loaded * 90) / progressEvent.total
                );
                setAdditionalUploadProgress(Math.min(progress, 90));
              }
            },
          }
        );

        setAdditionalUploadProgress(100);

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
      } finally {
        setAdditionalLoading(null);
        setAdditionalUploadProgress(0);
      }
    },
    [additionalImages, updateProductDetails, productDetails.images]
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

  const handleAdditionalDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setAdditionalDragActive(false);

      const files = e.dataTransfer.files;
      if (files) {
        Array.from(files).forEach((file) => handleAdditionalImage(file));
      }
    },
    [handleAdditionalImage]
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
      className={`relative font-roboto ${loading ? "pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
    >
      {/* Main Image Upload Section */}
      <div
        className={`mt-1 flex gap-y-4 justify-center p-6 border-2 rounded-md transition-all duration-300 ${
          dragActive
            ? "border-[#002f7a] bg-[#002f7a]/10 scale-[1.02] shadow-lg"
            : "border-[#365aa4] border-dashed hover:border-[#002f7a] hover:bg-[#002f7a]/5"
        } ${errors.imagesError ? "border-red-500 border-dashed" : ""}`}
      >
        <div className="space-y-1 w-full">
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative h-48 w-full"
              >
                <img
                  src={typeof preview === "string" ? preview : ""}
                  alt="Preview"
                  className="mx-auto w-full h-full object-contain object-center rounded-md p-2"
                />
                {!loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-2 right-2 flex items-center gap-2"
                  >
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} />
                      Uploaded
                    </span>
                    <button
                      onClick={() => {
                        setPreview(null);
                        updateProductDetails("images", []);
                      }}
                      className="cursor-pointer bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300 shadow-md"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`bg-gray-100 transition-all cursor-pointer h-42 lg:h-60 w-full flex flex-col items-center justify-center rounded-lg gap-y-2 ${
                  dragActive ? "bg-[#002f7a]/10" : "hover:bg-gray-200"
                }`}
              >
                <div className="flex justify-center text-sm text-gray-400 w-full">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <motion.div
                      animate={dragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-full ${
                        dragActive ? "bg-[#002f7a]/20" : "bg-gray-200"
                      }`}
                    >
                      {dragActive ? (
                        <Upload size={30} className="text-[#002f7a]" />
                      ) : (
                        <Plus size={30} className="text-gray-500" />
                      )}
                    </motion.div>
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
                <p className={`text-sm text-center w-full font-medium ${
                  dragActive ? "text-[#002f7a]" : "text-gray-500"
                }`}>
                  {dragActive ? "Drop your image here!" : "Click or drag to upload main image"}
                </p>
                <p className="text-xs text-gray-400 text-center">
                  Supports: JPEG, JPG, PNG (Max 10MB)
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Upload Progress Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-semibold inline-block text-[#002f7a] flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Upload size={14} />
                    </motion.div>
                    Uploading...
                  </span>
                  <span className="text-xs font-semibold inline-block text-[#002f7a]">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-[#002f7a]/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#002f7a] rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* Additional Images Section */}
      <div 
        className="w-full mt-4"
        onDragEnter={handleAdditionalDrag}
        onDragLeave={handleAdditionalDrag}
        onDragOver={handleAdditionalDrag}
        onDrop={handleAdditionalDrop}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
            <ImageIcon size={16} className="text-[#002f7a]" />
            Additional Images ({additionalImages.length}/5)
          </p>
          {additionalImages.length > 0 && (
            <span className="text-xs text-gray-400">
              Drag to reorder
            </span>
          )}
        </div>
        
        <div 
          className={`p-4 rounded-lg border-2 border-dashed transition-all duration-300 ${
            additionalDragActive 
              ? "border-[#002f7a] bg-[#002f7a]/10 scale-[1.01]" 
              : "border-gray-300 hover:border-[#002f7a]/50"
          }`}
        >
          <div className="flex flex-row flex-wrap items-center gap-4">
            {/* Preview Thumbnails */}
            <AnimatePresence>
              {additionalImages.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  <div className="h-24 w-24 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={img}
                      alt={`Additional product image ${index + 1}`}
                      className="h-full w-full object-cover object-center"
                    />
                    {/* Upload progress overlay for this specific image */}
                    {additionalLoading === index && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Upload size={20} className="text-white" />
                        </motion.div>
                        <span className="text-white text-xs mt-1">{additionalUploadProgress}%</span>
                      </div>
                    )}
                  </div>
                  {/* Image number badge */}
                  <span className="absolute -top-2 -left-2 bg-[#002f7a] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  {/* Remove button */}
                  <button
                    onClick={() => removeAdditionalImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-300 opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add More Button */}
            {additionalImages.length < 5 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-24 w-24 rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${
                  additionalDragActive 
                    ? "border-[#002f7a] bg-[#002f7a]/20" 
                    : "border-[#365AA4] bg-gray-100 hover:bg-[#002f7a]/10 hover:border-[#002f7a]"
                }`}
              >
                <label
                  htmlFor="additional-images"
                  className="cursor-pointer h-full w-full flex flex-col items-center justify-center gap-1"
                >
                  <Plus size={24} className={additionalDragActive ? "text-[#002f7a]" : "text-gray-500"} />
                  <span className={`text-xs ${additionalDragActive ? "text-[#002f7a]" : "text-gray-400"}`}>
                    {additionalDragActive ? "Drop here" : "Add more"}
                  </span>
                  <input
                    id="additional-images"
                    name="additional-images"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImagesChange}
                    ref={additionalInputRef}
                    disabled={loading || additionalLoading !== null}
                  />
                </label>
              </motion.div>
            )}
          </div>
          
          {/* Empty state message */}
          {additionalImages.length === 0 && !additionalDragActive && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Drag and drop images here or click the + button
            </p>
          )}
          
          {/* Drag active message */}
          {additionalDragActive && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-[#002f7a] text-center mt-2 font-medium"
            >
              Drop your images here!
            </motion.p>
          )}
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
