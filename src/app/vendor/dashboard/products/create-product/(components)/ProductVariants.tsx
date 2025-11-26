import React, { useState, useEffect, useRef } from "react";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { Plus, Trash2, TriangleAlert, X, Grid } from "lucide-react";
import NavigationButtons from "./NavigationButtons";
import { useResponsive } from "@/hooks/useResponsive";
import Input from "@/components/Input";
import VariantCombinationBuilder from "./VariantCombinationBuilder";
import ColorPicker from "./ColorPicker";

type VariantOption = {
  value: string;
  price: number;
  salePrice?: number;
  quantity: number;
  sku: string;
  isDefault?: boolean;
  dimensions?: Record<string, string>;
};

type Variant = {
  name: string;
  isDefault?: boolean;
  options: VariantOption[];
};

type Props = {
  onSaveDraft?: () => void;
};

export default function ProductVariants({ onSaveDraft }: Props) {
  const { productDetails, updateProductDetails } = useProductListing();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [useCombinations, setUseCombinations] = useState(false);
  const { isMobileOrTablet } = useResponsive();
  const initialRenderRef = useRef(true);

  // Initialize variants from context if they exist - only on mount
  useEffect(() => {
    if (productDetails.variants && Array.isArray(productDetails.variants)) {
      setVariants(JSON.parse(JSON.stringify(productDetails.variants)));
    }
  }, []);

  // Update context when variants change, but only after initial render
  // Using useRef to track previous variants to prevent infinite loops
  const prevVariantsRef = useRef<string>("");
  
  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      prevVariantsRef.current = JSON.stringify(variants);
      return;
    }

    const currentVariantsStr = JSON.stringify(variants);
    
    // Only update if variants have changed from previous render
    if (currentVariantsStr !== prevVariantsRef.current) {
      prevVariantsRef.current = currentVariantsStr;
      updateProductDetails("variants", JSON.parse(JSON.stringify(variants)));
    }
  }, [variants, updateProductDetails]);

  // Generate SKU for option
  const generateSKU = (variantName: string, optionValue: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const variantCode = variantName.substring(0, 3).toUpperCase();
    const optionCode = optionValue.substring(0, 3).toUpperCase();
    return `${variantCode}-${optionCode}-${timestamp}`;
  };

  // Add a new variant
  const addVariant = () => {
    const newVariant = {
      name: "",
      isDefault: variants.length === 0, // First variant is default
      options: [{ 
        value: "", 
        price: 0,
        salePrice: undefined,
        quantity: 0, 
        sku: `VAR-OPT-${Date.now()}`,
        isDefault: true, // First option is default
        dimensions: {}
      }],
    };
    setVariants([...variants, newVariant]);
  };

  // Remove a variant
  const removeVariant = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  // Update variant name
  const updateVariantName = (index: number, name: string) => {
    const updatedVariants = [...variants];
    updatedVariants[index].name = name;
    
    // Update SKUs for all options in this variant
    updatedVariants[index].options.forEach((option, optionIndex) => {
      if (option.value && name) {
        option.sku = generateSKU(name, option.value);
      }
    });
    
    setVariants(updatedVariants);

    // Clear error if exists
    if (errors[`variant-${index}-name`]) {
      setErrors({ ...errors, [`variant-${index}-name`]: "" });
    }
  };

  // Add option to variant
  const addOption = (variantIndex: number) => {
    const updatedVariants = [...variants];
    const variant = updatedVariants[variantIndex];
    const newOption = {
      value: "",
      price: 0,
      salePrice: undefined,
      quantity: 0,
      sku: `${variant.name ? variant.name.substring(0, 3).toUpperCase() : 'VAR'}-OPT-${Date.now()}`,
      isDefault: variant.options.length === 0, // First option is default
      dimensions: {}
    };
    updatedVariants[variantIndex].options.push(newOption);
    setVariants(updatedVariants);
  };

  // Remove option from variant
  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].options.splice(optionIndex, 1);
    setVariants(updatedVariants);
  };

  // Update option value
  const updateOptionValue = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOption,
    value: string | number | boolean
  ) => {
    const updatedVariants = [...variants];
    const variant = updatedVariants[variantIndex];
    const option = variant.options[optionIndex];

    if (field === "price" || field === "quantity") {
      (option as any)[field] = Number(value);
    } else if (field === "salePrice") {
      (option as any)[field] = value ? Number(value) : undefined;
    } else if (field === "value" || field === "sku") {
      (option as any)[field] = value as string;
      // Update SKU when option value changes
      if (field === "value" && variant.name && value) {
        option.sku = generateSKU(variant.name, value as string);
      }
    } else if (field === "isDefault") {
      (option as any)[field] = value as boolean;
      // If setting as default, unset other options in this variant
      if (value) {
        variant.options.forEach((opt, idx) => {
          if (idx !== optionIndex) opt.isDefault = false;
        });
      }
    }

    setVariants(updatedVariants);

    // Clear error if exists
    if (errors[`variant-${variantIndex}-option-${optionIndex}-${field}`]) {
      setErrors({
        ...errors,
        [`variant-${variantIndex}-option-${optionIndex}-${field}`]: "",
      });
    }
  };

  // Validate variants
  const validateVariants = () => {
    const newErrors: { [key: string]: string } = {};

    variants.forEach((variant, variantIndex) => {
      // Validate variant name
      if (!variant.name.trim()) {
        newErrors[`variant-${variantIndex}-name`] = "Variant name is required";
      } else if (variant.name.length > 50) {
        newErrors[`variant-${variantIndex}-name`] =
          "Variant name cannot exceed 50 characters";
      }

      // Validate options
      variant.options.forEach((option, optionIndex) => {
        if (!option.value.trim()) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-value`] =
            "Option value is required";
        } else if (option.value.length > 50) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-value`] =
            "Option value cannot exceed 50 characters";
        }

        if (option.price < 0.01) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-price`] =
            "Price must be at least 0.01";
        }

        if (option.quantity < 0) {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-quantity`] =
            "Quantity cannot be negative";
        }
        
        if (!option.sku || option.sku.trim() === "") {
          newErrors[`variant-${variantIndex}-option-${optionIndex}-sku`] =
            "SKU is required";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add validation event listener
  useEffect(() => {
    const handleValidateEvent = () => {
      const isValid = validateVariants();
      document.dispatchEvent(
        new CustomEvent("variantsValidated", {
          detail: { isValid },
        })
      );
    };

    document.addEventListener("validateVariants", handleValidateEvent);

    return () => {
      document.removeEventListener("validateVariants", handleValidateEvent);
    };
  }, [variants]);

  const handleCombinationsChange = (combinations: any[], dimensionNames: string[]) => {
    if (combinations.length > 0) {
      const combinedVariant = {
        name: dimensionNames.join(' & '),
        isDefault: true,
        options: combinations.map(combo => ({
          value: Object.entries(combo.dimensions).map(([k, v]) => `${k}: ${v}`).join(', '),
          price: combo.price,
          salePrice: combo.salePrice,
          quantity: combo.quantity,
          sku: combo.sku,
          isDefault: false,
          dimensions: combo.dimensions
        }))
      };
      
      setVariants([combinedVariant]);
      updateProductDetails('variantDimensions', dimensionNames);
      updateProductDetails('combinations', combinations);
    }
  };

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full font-[family-name:var(--font-alexandria)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="">Product Variants</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUseCombinations(!useCombinations)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
              useCombinations ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Grid size={16} />
            <span>Combinations</span>
          </button>
          {useCombinations && (
            <button
              type="button"
              onClick={() => {
                setUseCombinations(false);
                setVariants([]);
                updateProductDetails('variantDimensions', []);
                updateProductDetails('combinations', []);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}
          {!useCombinations && (
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-md text-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Variant</span>
            </button>
          )}
        </div>
      </div>

      {useCombinations ? (
        <VariantCombinationBuilder 
          onCombinationsChange={handleCombinationsChange}
          initialCombinations={productDetails.combinations}
          initialDimensions={productDetails.variantDimensions}
        />
      ) : variants.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
          <div className="flex gap-x-2 items-center text-blue-500 justify-center p-2">
            <TriangleAlert size={16} />
            <p className="text-xs">
              No variants added yet. Add variants if your product comes in
              different options like sizes or colors.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, variantIndex) => (
            <div
              key={variantIndex}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="">
                <label className="block text-xs mb-2">
                  Variant Name (e.g., Size, Color)
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      id={`variant-${variantIndex}-name`}
                      label="Variant Name"
                      type="text"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariantName(variantIndex, e.target.value)
                      }
                      placeholder="Enter variant name"
                      error={errors[`variant-${variantIndex}-name`]}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md mb-5 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-1">
                <label className="block text-sm mb-2">Options</label>
                <div className="space-y-1">
                  {variant.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex flex-wrap gap-2 items-end"
                    >
                      <div className="flex-1 min-w-[200px]">
                        {variant.name.toLowerCase() === 'color' || variant.name.toLowerCase() === 'colour' ? (
                          <div className="mb-5">
                            <label className="block text-xs mb-2">Color</label>
                            <div className="p-2 border border-gray-300 rounded-md bg-white">
                              <ColorPicker
                                selectedColors={option.value ? [option.value] : []}
                                onChange={(colors) => {
                                  updateOptionValue(
                                    variantIndex,
                                    optionIndex,
                                    "value",
                                    colors[0] || ""
                                  );
                                }}
                                maxSelection={1}
                              />
                            </div>
                          </div>
                        ) : variant.name.toLowerCase() === 'size' ? (
                          <div className="mb-5">
                            <label className="block text-xs mb-2">Size</label>
                            <select
                              className="w-full p-2 border border-gray-300 rounded-md h-10"
                              value={option.value}
                              onChange={(e) =>
                                updateOptionValue(
                                  variantIndex,
                                  optionIndex,
                                  "value",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select Size</option>
                              <option value="XS">XS</option>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                              <option value="XXXL">XXXL</option>
                            </select>
                          </div>
                        ) : (
                          <Input
                            id={`variant-${variantIndex}-option-${optionIndex}-value`}
                            label="Option Value"
                            type="text"
                            value={option.value}
                            onChange={(e) =>
                              updateOptionValue(
                                variantIndex,
                                optionIndex,
                                "value",
                                e.target.value
                              )
                            }
                            placeholder="Option value (e.g., Small, Red)"
                            error={
                              errors[
                                `variant-${variantIndex}-option-${optionIndex}-value`
                              ]
                            }
                          />
                        )}
                      </div>
                      <div className="w-[120px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-price`}
                          label="Price"
                          type="number"
                          value={option.price.toString()}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "price",
                              e.target.value
                            )
                          }
                          placeholder="Price"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-price`
                            ]
                          }
                        />
                      </div>
                      <div className="w-[120px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-salePrice`}
                          label="Sale Price"
                          type="number"
                          value={option.salePrice?.toString() || ""}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "salePrice",
                              e.target.value
                            )
                          }
                          placeholder="Sale Price"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-salePrice`
                            ]
                          }
                        />
                      </div>
                      <div className="w-[120px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-quantity`}
                          label="Quantity"
                          type="number"
                          value={option.quantity.toString()}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "quantity",
                              e.target.value
                            )
                          }
                          placeholder="Quantity"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-quantity`
                            ]
                          }
                        />
                      </div>
                      <div className="w-[150px]">
                        <Input
                          id={`variant-${variantIndex}-option-${optionIndex}-sku`}
                          label="SKU"
                          type="text"
                          value={option.sku}
                          onChange={(e) =>
                            updateOptionValue(
                              variantIndex,
                              optionIndex,
                              "sku",
                              e.target.value
                            )
                          }
                          placeholder="SKU"
                          error={
                            errors[
                              `variant-${variantIndex}-option-${optionIndex}-sku`
                            ]
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(variantIndex, optionIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md mb-5 cursor-pointer"
                        disabled={variant.options.length <= 1}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOption(variantIndex)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-gray-50 rounded-md text-sm cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Option</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isMobileOrTablet && (
        <div className="mt-6">
          <NavigationButtons
            onNext={validateVariants}
            onSaveDraft={onSaveDraft}
          />
        </div>
      )}
    </div>
  );
}
