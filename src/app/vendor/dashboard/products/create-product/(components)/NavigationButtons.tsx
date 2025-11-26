"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";
import { toast } from "react-toastify";
import { useCreateProduct } from "@/hooks/useCreateProduct";
import { useProductMapper } from "./SubmitProduct";
import { useDeleteDraft } from "@/hooks/mutations";
import { useProductStore } from "@/stores/useProductStore";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import ProductPreviewModal from "@/components/ProductPreviewModal";
import { useState } from "react";

type NavigationButtonsProps = {
  onNext?: () => boolean | Promise<boolean>;
  onBack?: () => void;
  onSaveDraft?: () => void;
  nextDisabled?: boolean;
  currentAttributePage?: number;
  totalAttributePages?: number;
  isLoading?: boolean;
};

export default function NavigationButtons({
  onNext,
  onBack,
  onSaveDraft,
  nextDisabled,
  currentAttributePage,
  totalAttributePages,
}: NavigationButtonsProps) {
  const { step, setStep, totalSteps, mobileTotalSteps, productDetails } =
    useProductListing();
  const { isMobileOrTablet } = useResponsive();
  const createProductMutation = useCreateProduct();
  const { mapProductDetailsToSchema } = useProductMapper();
  const { draftId } = useProductListing();
  const deleteDraftMutation = useDeleteDraft();
  const { listedProducts, setListedProducts } = useProductStore();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNext = async () => {
    if (onNext) {
      try {
        const result = await Promise.resolve(onNext());
        if (result) {
          setStep(step + 1);
        }
      } catch (error) {
        console.error("Error in navigation:", error);
      }
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const mappedData = mapProductDetailsToSchema();
      const result = await createProductMutation.mutateAsync(mappedData);
      if (result.success) {
        toast.success("Product created successfully");
        await deleteDraftMutation.mutateAsync(draftId);
        const draftsFromStorage = localStorage.getItem("productDrafts");
        const parsedDrafts = draftsFromStorage
          ? JSON.parse(draftsFromStorage)
          : [];

        const updatedDrafts = parsedDrafts.filter(
          (draft: any) => draft.draftId !== draftId
        );

        localStorage.setItem("productDrafts", JSON.stringify(updatedDrafts));
        setListedProducts([result.product, ...listedProducts]);
        setShowPreview(false);
        router.push("/vendor/dashboard/products");
      }
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to create product. Please try again."
      );
      return null;
    }
  };

  const isFirstStep = step === 1;
  const isLastStep =
    step === (isMobileOrTablet ? mobileTotalSteps : totalSteps);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-y-3 gap-x-4 items-center justify-between py-4">
        <button
          onClick={handleBack}
          disabled={isFirstStep}
          className={`flex items-center justify-center text-sm gap-x-2 border text-[#f6b76f] hover:bg-[#f6b76f] hover:text-white border-secondary w-xs px-4 py-2 rounded-md cursor-pointer transition duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <ArrowLeft size={16} className="" />
          <span>Back</span>
        </button>
        <button
          onClick={() => onSaveDraft?.()}
          disabled={!productDetails || Object.keys(productDetails).length < 1}
          className="text-sm w-xs text-primary bg-[#f6b76f] px-4 py-2 rounded-md cursor-pointer transition duration-300 ease-in-out hover:bg-[#f6b76f]/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save to Draft
        </button>
        <button
          onClick={isLastStep ? handlePreviewClick : handleNext}
          disabled={nextDisabled}
          className={`flex items-center justify-center gap-x-2 border hover:bg-[#2563eb]/80 bg-[#2563eb] w-xs text-gray-50 text-sm px-4 py-2 rounded-md cursor-pointer transition duration-300 ease-in-out ${
            nextDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span>
            {isLastStep ? "Preview Product" : "Next"}
          </span>
          <ArrowRight
            size={16}
            className={`${isLastStep ? "hidden" : "block"}`}
          />
        </button>
      </div>
      <>
        {currentAttributePage && totalAttributePages && (
          <div className="text-sm text-gray-400 flex items-center gap-x-2">
            <p>{currentAttributePage}</p>
            <p>/</p>
            <p>{totalAttributePages}</p>
          </div>
        )}
      </>
      
      <ProductPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmSubmit}
        productDetails={productDetails}
        isSubmitting={createProductMutation.isPending}
      />
    </div>
  );
}
