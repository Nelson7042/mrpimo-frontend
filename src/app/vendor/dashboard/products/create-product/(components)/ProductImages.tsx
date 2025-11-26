"use client";

import React from "react";
import ImageUploader from "./ImageUploader";
import NavigationButtons from "./NavigationButtons";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { toast } from "react-toastify";
import { toastConfigError, toastConfigInfo, toastConfigSuccess } from "@/app/config/toast.config";

type Props = {
  onSaveDraft?: () => void;
};

const ProductImages = (props: Props) => {
  const { productDetails, step } = useProductListing();
  const {isMobileOrTablet} = useResponsive();
  // Check if productDetails has images
  const hasImages = productDetails.images && productDetails.images.length > 0;

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full">
      <h1 className="text-[16px] mb-4 xl:text-center">Product Images</h1>
      <div className="xl:w-3/4 mx-auto">
        <ImageUploader src="" />
      </div>
      {isMobileOrTablet && (
        <div className="mt-4">
          <NavigationButtons nextDisabled={!hasImages} onSaveDraft={props.onSaveDraft}/>
        </div>
      )}
    </div>
  );
};

export default ProductImages;
