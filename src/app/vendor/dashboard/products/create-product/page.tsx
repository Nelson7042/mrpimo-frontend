"use client";

import { useEffect, useState } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import Navigator from "./(components)/Navigator";
import Stepper from "./(components)/Stepper";
import ProductImages from "./(components)/ProductImages";
import ProductDetailForm from "./(components)/ProductDetailForm";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import ProductSpecifications from "./(components)/ProductSpecifications";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  toastConfigError,
  toastConfigInfo,
  toastConfigSuccess,
} from "@/app/config/toast.config";
import { useCategories } from "@/hooks/queries";
import ShippingDetails from "./(components)/ShippingDetails";
import SeoAndMetaSettings from "./(components)/SeoAndMetaSettings";
import PricingInformation from "./(components)/PricingInformation";
import NavigationButtons from "./(components)/NavigationButtons";
import Preview from "./(components)/Preview";
import Drafts from "./(components)/Drafts";
import { useSaveDraft } from "@/hooks/mutations";
import ProductVariants from "./(components)/ProductVariants";
import FinalSubmission from "./(components)/FinalSubmission";

type Props = {};

const Page = (props: Props) => {
  const [activeTab, setActiveTab] = useState<"drafts" | "addProduct">(
    "addProduct"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    action: () => {},
  });
  const router = useRouter();
  const { mutate: saveDraftToServer } = useSaveDraft();
  useCategories();

  const {
    step,
    productDetails,
    totalAttributePages,
    setProductDetails,
    setStep,
    setDraftId,
    saveDraftEnhanced,
    validateCurrentStep,
    validationResults,
    completionPercentage,
    isLoading: contextLoading
  } = useProductListing();

  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();

  const handleSaveDraft = async () => {
    try {
      await saveDraftEnhanced(true);
      setActiveTab("drafts");
      setProductDetails({});
      setStep(1);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Error saving draft", toastConfigError);
    }
  };

  const handleEditDraft = (draft: any) => {
    setProductDetails(draft.productDetails);
    setActiveTab("addProduct");
    setShowForm(true);
    setShowPreview(false);
    draft.step && setStep(draft.step);
    setDraftId(draft.draftId)

    // Handle step conversion between mobile and desktop
    if (draft.savedOnMobile && !isMobileOrTablet) {
      // Convert from mobile (8 steps) to desktop (4 steps)
      const mobileStep = draft.step;
      let desktopStep = 1;

      // Mobile steps 1-2 → Desktop step 1
      // Mobile steps 3-5 → Desktop step 2
      // Mobile steps 6-7 → Desktop step 3
      // Mobile step 8 → Desktop step 4
      if (mobileStep <= 2) desktopStep = 1;
      else if (mobileStep <= 5) desktopStep = 2;
      else if (mobileStep <= 7) desktopStep = 3;
      else desktopStep = 4;

      setStep(desktopStep);
    } else if (!draft.savedOnMobile && isMobileOrTablet) {
      // Convert from desktop (4 steps) to mobile (8 steps)
      const desktopStep = draft.step;
      let mobileStep = 1;

      // Desktop step 1 → Mobile step 1
      // Desktop step 2 → Mobile step 3 (specs) or 4 (variants)
      // Desktop step 3 → Mobile step 6
      // Desktop step 4 → Mobile step 8
      if (desktopStep === 1) mobileStep = 1;
      else if (desktopStep === 2) {
        // If variants exist in the draft, go to variants step
        if (
          draft.productDetails?.variants &&
          draft.productDetails.variants.length > 0
        ) {
          mobileStep = 4; // Variants step
        } else {
          mobileStep = 3; // Specifications step
        }
      } else if (desktopStep === 3) mobileStep = 6;
      else mobileStep = 8;

      setStep(mobileStep);
    } else {
      // Same device type, no conversion needed
      setStep(draft.step);
    }
  };

  const validateDesktopStep1 = async () => {
    const validation = validateCurrentStep();
    console.log('Desktop Step 1 Validation:', validation);
    
    // Also trigger legacy validation for backward compatibility
    const imageErrors: { [key: string]: string } = {};
    const { images } = productDetails;

    if (!images || images.length < 1) {
      imageErrors.imagesError = "Main product image is required";
    }
    if (images && images.length > 6) {
      imageErrors.imagesError = "You can only upload a maximum of 6 images in total";
    }

    console.log('Image Errors:', imageErrors);
    console.log('Product Details for Step 1:', productDetails);

    // Dispatch events for legacy components
    document.dispatchEvent(
      new CustomEvent("imageErrors", { detail: imageErrors })
    );
    document.dispatchEvent(new CustomEvent("validateDetails"));

    const isValid = validation.isValid && Object.keys(imageErrors).length === 0;
    console.log('Step 1 Final Validation Result:', isValid);
    return isValid;
  };

  const validateDesktopStep2 = async () => {
    const validation = validateCurrentStep();
    console.log('Desktop Step 2 Validation:', validation);
    console.log('Product Details for Step 2:', productDetails);
    
    // Trigger legacy validation events for backward compatibility
    document.dispatchEvent(new CustomEvent("validateSpecifications"));
    document.dispatchEvent(new CustomEvent("validatePricing"));
    if (productDetails.variants && productDetails.variants.length > 0) {
      document.dispatchEvent(new CustomEvent("validateVariants"));
    }

    console.log('Step 2 Final Validation Result:', validation.isValid);
    return validation.isValid;
  };

  const validateDesktopStep3 = () => {
    const validation = validateCurrentStep();
    console.log('Desktop Step 3 Validation:', validation);
    console.log('Product Details for Step 3:', productDetails);
    
    // Trigger legacy validation for backward compatibility
    document.dispatchEvent(new CustomEvent("validateShipping"));

    console.log('Step 3 Final Validation Result:', validation.isValid);
    return validation.isValid;
  };

  const handleShowPreviewClicked = () => {
    setShowForm(false);
    setShowPreview(true);
  };

  const handleHidePreviewClicked = () => {
    setShowForm(true);
    setShowPreview(false);
  };

  const renderStepContent = () => {
    if (isMobile || isTablet) {
      switch (step) {
        case 1:
          return <ProductImages onSaveDraft={handleSaveDraft} />;
        case 2:
          return <ProductDetailForm onSaveDraft={handleSaveDraft} />;
        case 3:
          return <ProductSpecifications onSaveDraft={handleSaveDraft} />;
        case 4:
          return productDetails?.pricingInformation?.listingType === "instantSale" ? 
            <ProductVariants onSaveDraft={handleSaveDraft} /> : 
            <PricingInformation onSaveDraft={handleSaveDraft} />;
        case 5:
          return <PricingInformation onSaveDraft={handleSaveDraft} />;
        case 6:
          return <ShippingDetails onSaveDraft={handleSaveDraft} />;
        case 7:
          return <SeoAndMetaSettings onSaveDraft={handleSaveDraft} />;
        case 8:
          return <FinalSubmission onSaveDraft={handleSaveDraft} />;
        default:
          return null;
      }
    } else {
      switch (step) {
        case 1:
          return (
            <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
              {/* Product Images */}
              <ProductImages />
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                <ProductDetailForm />
                <NavigationButtons
                  onNext={async () => {
                    const isValid = await validateDesktopStep1();
                    if (!isValid) {
                      toast.error(
                        "Please fix the errors before proceeding.",
                        toastConfigError
                      );
                      return false;
                    }
                    return true;
                  }}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            </div>
          );
        case 2:
          return totalAttributePages === 2 ? (
            <ProductSpecifications />
          ) : (
            <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                {/* Product Specifications */}
                <ProductSpecifications />
              </div>
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                {/* Pricing Information */}
                <PricingInformation />
                {/* Product Variants - only show for instant sale */}
                {productDetails?.pricingInformation?.listingType === "instantSale" && <ProductVariants />}
                <NavigationButtons
                  onNext={async () => {
                    const isValid = await validateDesktopStep2();
                    if (!isValid) {
                      toast.error(
                        "Please fix the errors before proceeding.",
                        toastConfigError
                      );
                      return false;
                    }
                    return true;
                  }}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            </div>
          );
        case 3:
          return (
            <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
              <ShippingDetails />
              <div className="flex flex-col gap-y-8 w-full lg:w-1/2">
                <SeoAndMetaSettings />
                {/* <NavigationButtons
                  onNext={async () => {
                    const isValid = await validateDesktopStep3();
                    if (!isValid) {
                      toast.error(
                        "Please fix the errors before proceeding.",
                        toastConfigError
                      );
                      return false;
                    }
                    return true;
                  }}
                  onSaveDraft={handleSaveDraft}
                /> */}
              </div>
            </div>
          );
        case 4:
          return <FinalSubmission  />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="bg-[#f6f6f6] max-w-full overflow-x-hidden min-h-screen">
      <div className="p-2 sm:p-4 xl:p-10">
        <div className="flex flex-col-reverse lg:flex-row justify-between items-start md:items-center mb-5 gap-x-4">
          <div className="w-full">
            <div className="flex overflow-x-auto scrollbar-hide gap-x-2 lg:gap-x-4 items-center text-[#b5b4b4] mb-1">
              <div
                className={`text-sm md:text-lg whitespace-nowrap border-r pr-2 md:pr-4 cursor-pointer ${
                  activeTab === "drafts" ? "text-[#002f7a] font-semibold" : ""
                }`}
                onClick={() => setActiveTab("drafts")}
              >
                Drafts
              </div>
              <div
                className={`text-sm md:text-lg whitespace-nowrap px-2 md:px-4 cursor-pointer ${
                  activeTab === "addProduct"
                    ? "text-[#002f7a] font-semibold"
                    : ""
                }`}
                onClick={() => setActiveTab("addProduct")}
              >
                Add Product
              </div>
            </div>
            <p className="font-[family-name:var(--font-poppins)] text-xs md:text-sm text-[#323232]">
              Welcome back, Bovie! Here's what is happening with your store
              today.
            </p>
          </div>
          <div className="flex justify-end gap-x-4 items-center h-[10%] w-full lg:mt-4">
            {activeTab === "addProduct" && !showPreview && <Navigator />}
            {activeTab === "addProduct" && !showPreview && <Stepper />}
          </div>
        </div>
        {activeTab === "addProduct" ? (
          <>
            {showPreview && <Preview onHide={handleHidePreviewClicked} />}
            {showForm && (
              <div className="bg-white rounded-xl">
                <div className="p-4 flex justify-between items-center border-b border-gray-300">
                  <div className="flex gap-x-2 items-center text-gray-500">
                    <ArrowLeft
                      size={16}
                      onClick={() => {
                        setModalConfig({
                          title: "Go Back",
                          message:
                            "Are you sure you want to go to the previous page?",
                          action: () => router.back(),
                        });
                        setIsModalOpen(true);
                      }}
                      className="cursor-pointer hover:text-red-800"
                    />
                    <p className="text-sm">Add new product</p>
                  </div>
                  <p
                    className="text-sm primary cursor-pointer hover:underline"
                    onClick={handleShowPreviewClicked}
                  >
                    See live preview
                  </p>
                </div>
                {/* Forms */}

                <div className="px-2 sm:px-4 py-2 pb-5 flex flex-col lg:flex-row items-start gap-5 xl:gap-x-10 mt-2 w-full">
                  {/* Forms */}
                  {renderStepContent()}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {activeTab === "drafts" && <Drafts onEditDraft={handleEditDraft} />}
          </>
        )}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalConfig.title}
          onConfirm={modalConfig.action}
          confirmText="Continue"
        >
          <p>{modalConfig.message}</p>
        </Modal>
      </div>
    </div>
  );
};

export default Page;
