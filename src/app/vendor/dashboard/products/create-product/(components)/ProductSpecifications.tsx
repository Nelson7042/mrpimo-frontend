"use client";

import { useProductListing } from "@/contexts/ProductLisitngContext";
import Input from "./Input";
import Select from "./Select";
import { useEffect, useState } from "react";
import { AlignVerticalDistributeStartIcon, TriangleAlert } from "lucide-react";
import NavigationButtons from "./NavigationButtons";
import Modal from "@/components/Modal";
import { useResponsive } from "@/hooks/useResponsive";
import { useCategories } from "@/hooks/queries";
import ICategory from "@/types/category.type";

type Attribute = {
  name: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[];
};

// const tailwindColorMap: Record<string, Record<string, string>> = {
//   "bg-red": {
//     "100": "#fee2e2",
//     "200": "#fecaca",
//     "300": "#fca5a5",
//     "400": "#f87171",
//     "500": "#ef4444",
//     "600": "#dc2626",
//     "700": "#b91c1c",
//     "800": "#991b1b",
//     "900": "#7f1d1d",
//   },
//   "bg-blue": {
//     "100": "#dbeafe",
//     "200": "#bfdbfe",
//     "300": "#93c5fd",
//     "400": "#60a5fa",
//     "500": "#3b82f6",
//     "600": "#2563eb",
//     "700": "#1d4ed8",
//     "800": "#1e40af",
//     "900": "#1e3a8a",
//   },
//   "bg-green": {
//     "100": "#dcfce7",
//     "200": "#bbf7d0",
//     "300": "#86efac",
//     "400": "#4ade80",
//     "500": "#22c55e",
//     "600": "#16a34a",
//     "700": "#15803d",
//     "800": "#166534",
//     "900": "#14532d",
//   },
//   "bg-yellow": {
//     "100": "#fef9c3",
//     "200": "#fef08a",
//     "300": "#fde047",
//     "400": "#facc15",
//     "500": "#eab308",
//     "600": "#ca8a04",
//     "700": "#a16207",
//     "800": "#854d0e",
//     "900": "#713f12",
//   },
//   "bg-purple": {
//     "100": "#f3e8ff",
//     "200": "#e9d5ff",
//     "300": "#d8b4fe",
//     "400": "#c084fc",
//     "500": "#a855f7",
//     "600": "#9333ea",
//     "700": "#7e22ce",
//     "800": "#6b21a8",
//     "900": "#581c87",
//   },
//   "bg-orange": {
//     "100": "#ffedd5",
//     "200": "#fed7aa",
//     "300": "#fdba74",
//     "400": "#fb923c",
//     "500": "#f97316",
//     "600": "#ea580c",
//     "700": "#c2410c",
//     "800": "#9a3412",
//     "900": "#7c2d12",
//   },
//   "bg-teal": {
//     "100": "#ccfbf1",
//     "200": "#99f6e4",
//     "300": "#5eead4",
//     "400": "#2dd4bf",
//     "500": "#14b8a6",
//     "600": "#0d9488",
//     "700": "#0f766e",
//     "800": "#115e59",
//     "900": "#134e4a",
//   },
//   "bg-gray": {
//     "100": "#f3f4f6",
//     "200": "#e5e7eb",
//     "300": "#d1d5db",
//     "400": "#9ca3af",
//     "500": "#6b7280",
//     "600": "#4b5563",
//     "700": "#374151",
//     "800": "#1f2937",
//     "900": "#111827",
//   },
//   "bg-black": {
//     "100": "#000000",
//     "200": "#000000",
//     "300": "#000000",
//     "400": "#000000",
//     "500": "#000000",
//     "600": "#000000",
//     "700": "#000000",
//     "800": "#000000",
//     "900": "#000000",
//   },
//   "bg-white": {
//     "100": "#ffffff",
//     "200": "#ffffff",
//     "300": "#ffffff",
//     "400": "#ffffff",
//     "500": "#ffffff",
//     "600": "#ffffff",
//     "700": "#ffffff",
//     "800": "#ffffff",
//     "900": "#ffffff",
//   },
// };

interface Props {
  onSaveDraft?: () => void;
}

export default function ProductSpecifications(props: Props) {
  const {
    attributes,
    currentAttributePage,
    setCurrentAttributePage,
    setAttributes,
    totalAttributePages,
    productDetails,
    updateProductDetails,
    step,
    setStep,
  } = useProductListing();

  const [visibleAttributes, setVisibleAttributes] = useState<Attribute[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedShade, setSelectedShade] = useState<string>("");
  const [additionalSpecifications, setAdditionalSpecifications] = useState<
    Record<string, string>
  >({});
  // const [additionalSpecKey, setAdditionalSpecKey] = useState<string[]>([]);
  const [newSpecKey, setNewSpecKey] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    action: () => {},
  });

  const {data} = useCategories()

  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();

  useEffect(() => {
  // Initialize productSpecifications from context if it exists
  if (productDetails.productSpecifications) {
    if (productDetails.category && data?.categories) {
          const selectedCategory = data.categories.find(
            (cat: ICategory) => cat.name === productDetails.category
          );
          const subCategory = data.categories.find(
            (cat: ICategory) => cat.name === productDetails.subCategory
          );
    
          if (selectedCategory && subCategory) {
            let combinedAttributes = [...(selectedCategory.attributes || [])];
    
            if (subCategory.attributes) {
              subCategory.attributes.forEach((subAttr: Attribute) => {
                if (
                  !combinedAttributes.some((attr) => attr.name === subAttr.name)
                ) {
                  combinedAttributes.push(subAttr);
                }
              });
            }
    
            setAttributes(combinedAttributes);
          }
        }

  } else {
    // Initialize empty object if it doesn't exist
    updateProductDetails('productSpecifications', {});
  }
  
  // Initialize additionalSpecifications from context if it exists
  if (productDetails.additionalSpecifications) {
    setAdditionalSpecifications(productDetails.additionalSpecifications);
  }
}, [productDetails, data]);

  useEffect(() => {
    if (isMobileOrTablet) {
      const attributesPerPage = isMobile ? 7 : 16; // Show 7 attributes per page on mobile
      const startIndex = (currentAttributePage - 1) * attributesPerPage;
      const endIndex = Math.min(
        startIndex + attributesPerPage,
        attributes.length
      );
      setVisibleAttributes(attributes.slice(startIndex, endIndex));
    } else {
      // On desktop, we handle pagination differently in the render function
      setVisibleAttributes(attributes);
    }
  }, [attributes, currentAttributePage, isMobile, isMobileOrTablet]);

  const handleAttributeChange = (name: string, value: any) => {
    // Update the context
    const updatedSpecs = {
      ...(productDetails.productSpecifications || {}),
      [name]: value,
    };
    updateProductDetails("productSpecifications", updatedSpecs);

    // Clear any error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  useEffect(() => {
    const handleValidateEvent = () => {
      const isValid = validateSpecifications();
      document.dispatchEvent(
        new CustomEvent("specificationsValidated", {
          detail: { isValid },
        })
      );
    };

    document.addEventListener("validateSpecifications", handleValidateEvent);

    return () => {
      document.removeEventListener(
        "validateSpecifications",
        handleValidateEvent
      );
    };
  }, [visibleAttributes, productDetails, additionalSpecifications]);
  
  // Debug logging for validation events
  useEffect(() => {
    const logValidationEvent = (e: Event) => {
      console.log("Validation event received:", e.type);
    };
    
    document.addEventListener("specificationsValidated", logValidationEvent);
    document.addEventListener("pricingValidated", logValidationEvent);
    
    return () => {
      document.removeEventListener("specificationsValidated", logValidationEvent);
      document.removeEventListener("pricingValidated", logValidationEvent);
    };
  }, []);

  const validateSpecifications = () => {
    console.log("Validating specifications with productDetails:", productDetails);
    const errors: { [key: string]: string } = {};
    const attrsToValidate = isMobileOrTablet ? visibleAttributes : attributes;
    const requiredAttributes = attrsToValidate.filter((attr) => attr.required);

    // Get current specifications
    const specs = productDetails.productSpecifications || {};

    // Check required attributes (skip color as it's moved to variants/pricing)
    requiredAttributes.forEach((attr) => {
      if (attr.name.toLowerCase() !== 'color' && attr.name.toLowerCase() !== 'colour' && !specs[attr.name]) {
        errors[attr.name] = `${attr.name} is required`;
      }
    });

    // Update errors state
    setErrors(errors);

    // Dispatch errors event
    document.dispatchEvent(
      new CustomEvent("specificationErrors", { detail: errors })
    );

    // Check if there are any errors
    const isValid = Object.keys(errors).length === 0;
    // Always update additional specifications to ensure context is in sync
    const updatedAdditionalSpecs = { ...additionalSpecifications };
    Object.keys(updatedAdditionalSpecs).forEach((key) => {
      if (!updatedAdditionalSpecs[key]) {
        delete updatedAdditionalSpecs[key];
      }
    });
    setAdditionalSpecifications(updatedAdditionalSpecs);
    updateProductDetails("additionalSpecifications", updatedAdditionalSpecs);
    
    return isValid;
  };

  const handleNextAttributePage = () => {
    if (currentAttributePage < totalAttributePages) {
      // Validate current page before proceeding
      if (validateSpecifications()) {
        setCurrentAttributePage(currentAttributePage + 1);
        return false; // Prevent step change in NavigationButtons
      }
      return false;
    }
    // If on last attribute page and validation passes, allow step change
    return validateSpecifications();
  };

  const handlePrevAttributePage = () => {
    if (currentAttributePage > 1) {
      setCurrentAttributePage(currentAttributePage - 1);
      return true;
    } else {
      setStep(step - 1);
      return true;
    }
  };


  const renderOnMobileOrTablet = () => {
    return (
      <div className="p-2 sm:p-4 border border-gray-400 rounded-lg w-full">
        <h1 className="text-[16px] mb-4">Product Specifications</h1>
        <div className="grid grid-cols-2 items-center gap-4">
          {visibleAttributes.map((attr: Attribute) => (
            <div key={attr.name} className="col-span-2 md:col-span-1">
              {attr.type === "select" ? (
                <Select
                  label={attr.name}
                  value={
                    productDetails.productSpecifications?.[attr.name] || ""
                  }
                  options={attr.options || []}
                  onChange={(value) => handleAttributeChange(attr.name, value)}
                  placeholder={`Select ${attr.name.toLowerCase()}`}
                  className="w-full"
                  required={attr.required ? true : false}
                  error={errors[attr.name]}
                />
              ) : attr.type === "boolean" ? (
                <>
                  <div className="flex items-center gap-x-2">
                    <span className="text-xs">{attr.name}</span>
                    <div
                      className={`w-8 h-4 rounded-full flex items-center cursor-pointer transition-colors duration-200 ${
                        productDetails.productSpecifications?.[attr.name]
                          ? "bg-blue-600 justify-end"
                          : "bg-gray-300 justify-start"
                      }`}
                      onClick={() =>
                        handleAttributeChange(
                          attr.name,
                          !productDetails.productSpecifications?.[attr.name]
                        )
                      }
                    >
                      <div className="w-3 h-3 bg-white rounded-full mx-0.5 transition-transform duration-200"></div>
                    </div>
                  </div>

                  {attr.required && (
                    <div className="text-gray-500 text-[10px] flex gap-x-2 items-center mt-2">
                      <TriangleAlert size={16} /> Required
                    </div>
                  )}
                  {errors[attr.name] && (
                    <div className="text-red-500 text-[10px] mt-1">
                      {errors[attr.name]}
                    </div>
                  )}
                </>
              ) : (
                <Input
                  label={attr.name}
                  type={attr.type === "number" ? "number" : "text"}
                  id={attr.name}
                  className="w-full"
                  placeholder={`Enter ${attr.name.toLowerCase()}`}
                  value={
                    productDetails.productSpecifications?.[attr.name] || ""
                  }
                  onChange={(e) =>
                    handleAttributeChange(attr.name, e.target.value)
                  }
                  required={attr.required ? true : false}
                  error={errors[attr.name]}
                />
              )}
            </div>
          ))}
        </div>
        {currentAttributePage === totalAttributePages && (
          <div className="max-h-[300px] overflow-y-auto pr-2 mt-4">
            <div className="text-gray-500 text-xs">
              Note: If you have more specifications, you can add them below.
            </div>
            <div className="mt-4">
              <p className="text">Add addittional specifications</p>
              <button
                onClick={() => {
                  setModalConfig({
                    title: "Specification label",
                    message:
                      "Please enter the label for the new specification.",
                    action: () => {},
                  });
                  setIsModalOpen(true);
                }}
                className="px-2 py-1 border border-blue-500 rounded-md text-xs text-blue-500 hover:text-white hover:bg-blue-500 transition-colors"
              >
                Add Spec
              </button>
            </div>
            {Object.keys(additionalSpecifications).length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 xl:gap-x-4">
                {Object.keys(additionalSpecifications).map((key) => (
                  <div key={key} className="col-span-2 md:col-span-1 relative">
                    <Input
                      label={key}
                      type="text"
                      id={key}
                      className="w-full"
                      placeholder={`Enter ${key.toLowerCase()}`}
                      value={additionalSpecifications[key]}
                      onChange={(e) =>
                        setAdditionalSpecifications({
                          ...additionalSpecifications,
                          [key]: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() => {
                        const updated = { ...additionalSpecifications };
                        delete updated[key];
                        setAdditionalSpecifications(updated);
                        updateProductDetails("additionalSpecifications", updated);
                      }}
                      className="absolute top-0 right-0 text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Navigation Buttons */}
        {isMobileOrTablet && (
          <div className="mt-5">
            <NavigationButtons
              onNext={handleNextAttributePage}
              onBack={handlePrevAttributePage}
              currentAttributePage={currentAttributePage}
              totalAttributePages={totalAttributePages}
              onSaveDraft={props.onSaveDraft}
            />
          </div>
        )}
        {/* Modal for additional specification key */}
        <div className="">
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalConfig.title}
            confirmText="Add"
            cancelText="Cancel"
            onConfirm={() => {
              if (newSpecKey.trim()) {
                setAdditionalSpecifications({
                  ...additionalSpecifications,
                  [newSpecKey]: "",
                });
                setNewSpecKey("");
                setIsModalOpen(false);
              }
            }}
          >
            <Input
              label="Specification Label"
              type="text"
              id="specificationLabel"
              className="w-full"
              placeholder="Enter the label for the new specification"
              value={newSpecKey}
              onChange={(e) => setNewSpecKey(e.target.value)}
              required
            />
          </Modal>
        </div>
      </div>
    );
  };

  const renderOnDesktop = () => {
    // Calculate total number of forms needed
    const totalForms = Math.ceil(attributes.length / 16);
    const formsPerPage = 2; // 2 forms per page (32 attributes max per page)
    const totalPages = Math.ceil(totalForms / formsPerPage);

    // Calculate which forms to show on current page
    const startFormIndex = (currentAttributePage - 1) * formsPerPage;
    const endFormIndex = Math.min(startFormIndex + formsPerPage, totalForms);

    // Create array of forms for current page
    const currentPageForms = [];
    for (
      let formIndex = startFormIndex;
      formIndex < endFormIndex;
      formIndex++
    ) {
      const startAttrIndex = formIndex * 16;
      const endAttrIndex = Math.min(startAttrIndex + 16, attributes.length);
      const formAttributes = attributes.slice(startAttrIndex, endAttrIndex);

      currentPageForms.push(
        <div key={formIndex}>
          <div className="flex flex-col justify-between" key={formIndex}>
            <div
              key={formIndex}
              className="p-4 border border-gray-400 rounded-lg mb-6"
            >
              <h1 className="text-[16px] mb-4">
                {formIndex === 0
                  ? "Product Specifications"
                  : `Product Specifications page - ${formIndex + 1}`}
              </h1>
              <div className="grid grid-cols-2 gap-4 items-center">
                {formAttributes.map((attr: Attribute) => (
                  <div key={attr.name} className="col-span-2 md:col-span-1">
                    {attr.type === "select" ? (
                      <Select
                        label={attr.name}
                        value={
                          productDetails.productSpecifications?.[attr.name] ||
                          ""
                        }
                        options={attr.options || []}
                        onChange={(value) =>
                          handleAttributeChange(attr.name, value)
                        }
                        placeholder={`Select ${attr.name.toLowerCase()}`}
                        className="w-full"
                        required={attr.required ? true : false}
                        error={errors[attr.name]}
                      />
                    ) : attr.type === "boolean" ? (
                      <>
                        <div className="flex items-center gap-x-2">
                          <span className="text-xs">{attr.name}</span>
                          <div
                            className={`w-8 h-4 rounded-full flex items-center cursor-pointer transition-colors duration-200 ${
                              productDetails.productSpecifications?.[attr.name]
                                ? "bg-blue-600 justify-end"
                                : "bg-gray-300 justify-start"
                            }`}
                            onClick={() =>
                              handleAttributeChange(
                                attr.name,
                                !productDetails.productSpecifications?.[attr.name]
                              )
                            }
                          >
                            <div className="w-3 h-3 bg-white rounded-full mx-0.5 transition-transform duration-200"></div>
                          </div>
                        </div>

                        {attr.required && (
                          <div className="text-gray-500 text-[10px] flex gap-x-2 items-center mt-2">
                            <TriangleAlert size={16} /> Required
                          </div>
                        )}
                        {errors[attr.name] && (
                          <div className="text-red-500 text-[10px] mt-1">
                            {errors[attr.name]}
                          </div>
                        )}
                      </>
                    ) : (
                      <Input
                        label={attr.name}
                        type={attr.type === "number" ? "number" : "text"}
                        id={attr.name}
                        className="w-full"
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                        value={
                          productDetails.productSpecifications?.[attr.name] ||
                          ""
                        }
                        onChange={(e) =>
                          handleAttributeChange(attr.name, e.target.value)
                        }
                        required={attr.required ? true : false}
                        error={errors[attr.name]}
                      />
                    )}
                  </div>
                ))}
              </div>
              {currentAttributePage === totalAttributePages && (
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  <div className="text-gray-500 text-xs mt-4">
                    Note: If you have more specifications, you can add them
                    below.
                  </div>

                  <div className="mt-4">
                    <p className="text">Add additional specifications</p>
                    <button
                      onClick={() => {
                        setModalConfig({
                          title: "Specification label",
                          message:
                            "Please enter the label for the new specification.",
                          action: () => {},
                        });
                        setIsModalOpen(true);
                      }}
                      className="px-2 py-1 border border-blue-500 rounded-md text-xs text-blue-500 hover:text-white hover:bg-blue-500 transition-colors"
                    >
                      Add Spec
                    </button>
                  </div>
                  {Object.keys(additionalSpecifications).length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 xl:gap-4">
                      {Object.keys(additionalSpecifications).map((key) => (
                        <div key={key} className="col-span-1 relative">
                          <Input
                            label={key}
                            type="text"
                            id={key}
                            className="w-full"
                            placeholder={`Enter ${key.toLowerCase()}`}
                            value={additionalSpecifications[key]}
                            onChange={(e) => {
                              setAdditionalSpecifications({
                                ...additionalSpecifications,
                                [key]: e.target.value,
                              })
                              updateProductDetails("additionalSpecifications", {
                                ...additionalSpecifications,
                                [key]: e.target.value,
                              })
                            }}
                          />
                          <button
                            onClick={() => {
                              const updated = { ...additionalSpecifications };
                              delete updated[key];
                              setAdditionalSpecifications(updated);
                              updateProductDetails("additionalSpecifications", updated);
                            }}
                            className="absolute top-0 right-0 text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Modal for additional specification key */}
            <div className="">
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalConfig.title}
                confirmText="Add"
                cancelText="Cancel"
                onConfirm={() => {
                  if (newSpecKey.trim()) {
                    setAdditionalSpecifications({
                      ...additionalSpecifications,
                      [newSpecKey]: "",
                    });
                    setNewSpecKey("");
                    setIsModalOpen(false);
                  }
                }}
              >
                <Input
                  label="Specification Label"
                  type="text"
                  id="specificationLabel"
                  className="w-full"
                  placeholder="Enter the label for the new specification"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  required
                />
              </Modal>
            </div>
          </div>
          {totalAttributePages === 2 && formIndex === 1 && (
            <NavigationButtons
              onNext={handleNextAttributePage}
              onBack={handlePrevAttributePage}
              currentAttributePage={currentAttributePage}
              totalAttributePages={totalPages}
              onSaveDraft={props.onSaveDraft}
            />
          )}
        </div>
      );
    }

    return <div className="w-full">{currentPageForms}</div>;
  };

  return (
    <div className="w-full">
      {isMobileOrTablet ? renderOnMobileOrTablet() : renderOnDesktop()}
    </div>
  );
}
