import Input from "./Input";
import React, { useEffect, useState } from "react";
import Select from "./Select";
import NavigationButtons from "./NavigationButtons";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useCountries } from "@/hooks/useCountries";
import { useCategories } from "@/hooks/queries";
import ICategory from "@/types/category.type";

type Props = {
  onSaveDraft?: () => void;
};

const ShippingDetails = (props: Props) => {
  const [ deepest, setDeepest ] = useState<ICategory | null>(null)
  const { updateProductDetails, productDetails } = useProductListing();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();

  const {data} = useCategories()

  useEffect(() => {
    if (data?.categories && data?.categories.length > 0) {
      const subcategoryNames = [
        productDetails.subCategory5,
        productDetails.subCategory4,
        productDetails.subCategory3,
        productDetails.subCategory2,
        productDetails.subCategory,
      ].find(Boolean);
    
      // Get the category object for the deepest subcategory
      const deepestCategory = subcategoryNames
        ? data.categories.find((cat: any) => cat.name === subcategoryNames)
        : data.categories.find((cat: any) => cat.name === productDetails.category);
      
      setDeepest(deepestCategory)
    }
  }, [data?.categories])
  
  const countryOptions = React.useMemo(() => {
    if (!countries || !Array.isArray(countries)) return [];
    return countries.map(country => country.name);
  }, [countries]);
  
  const [shippingDetails, setShippingDetails] = React.useState({
    productLocation: productDetails?.shippingDetails?.productLocation || "",
    productWeight: productDetails?.shippingDetails?.productWeight || "",
    weightUnit: productDetails?.shippingDetails?.weightUnit || "kg",
    productDimensions: {
      length: productDetails?.shippingDetails?.productDimensions?.length || "",
      width: productDetails?.shippingDetails?.productDimensions?.width || "",
      height: productDetails?.shippingDetails?.productDimensions?.height || "",
    },
    dimensionUnit: productDetails?.shippingDetails?.dimensionUnit || "cm",
    restrictions: productDetails?.shippingDetails?.restrictions || ["none"],
    warranty: {
      status: productDetails?.shippingDetails?.warranty?.status || "",
      period: productDetails?.shippingDetails?.warranty?.period || "",
      returnPolicy:
        productDetails?.shippingDetails?.warranty?.returnPolicy || "",
    },
  });
  const [dimensions, setDimensions] = React.useState("");
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const { isMobileOrTablet } = useResponsive();

  const validateShippingDetails = () => {
    const newErrors: { [key: string]: string } = {};
    // console.log("Validating with local state:", shippingDetails);
    
    if (!shippingDetails.productLocation || shippingDetails.productLocation === "") {
      newErrors.productLocation = "Shipping location is required";
    }
    if (deepest?.productWeightRequired && (!shippingDetails.productWeight || shippingDetails.productWeight === "")) {
      newErrors.productWeight = "Product weight is required";
    }
    if (deepest?.productWeightRequired && (!shippingDetails.weightUnit || shippingDetails.weightUnit === "")) {
      newErrors.weightUnit = "Weight unit is required";
    }
    if ((shippingDetails.productDimensions?.length || shippingDetails.productDimensions?.width || shippingDetails.productDimensions?.height) && 
        (!shippingDetails.productDimensions?.length || !shippingDetails.productDimensions?.width || !shippingDetails.productDimensions?.height) && deepest?.productDimensionsRequired) {
      newErrors.productDimensions = "Please enter the length, width, and height of the product"
      if (!shippingDetails.dimensionUnit && deepest?.productDimensionsRequired ) {
        newErrors.dimensionUnit = "Dimension unit is required";
      }
    }
    if (!shippingDetails.warranty?.status || shippingDetails.warranty?.status === "") {
      newErrors.warrantyStatus = "Warranty status is required";
    }
    if (
      shippingDetails.warranty?.status === "warranty" &&
      (!shippingDetails.warranty?.period || shippingDetails.warranty?.period === "")
    ) {
      newErrors.warrantyPeriod = "Warranty period is required";
    }
    if (!shippingDetails.warranty?.returnPolicy || shippingDetails.warranty?.returnPolicy === "") {
      newErrors.returnPolicy = "Return policy is required";
    }
    setErrors(newErrors);
    
    // Update productDetails with current local state before validation completes
    if (Object.keys(newErrors).length === 0) {
      updateProductDetails("shippingDetails", shippingDetails);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  React.useEffect(() => {
    const handleValidateEvent = () => {
      const newErrors: { [key: string]: string } = {};
      
      if (!shippingDetails.productLocation || shippingDetails.productLocation === "") {
        newErrors.productLocation = "Shipping location is required";
      }
      if (deepest?.productWeightRequired && (!shippingDetails.productWeight || shippingDetails.productWeight === "")) {
        newErrors.productWeight = "Product weight is required";
      }
      if (deepest?.productWeightRequired && (!shippingDetails.weightUnit || shippingDetails.weightUnit === "")) {
        newErrors.weightUnit = "Weight unit is required";
      }
      if (deepest?.productDimensionsRequired && 
          (!shippingDetails.productDimensions?.length || 
           !shippingDetails.productDimensions?.width || 
           !shippingDetails.productDimensions?.height)) {
        newErrors.productDimensions = "Please enter the length, width, and height of the product";
      }
      if (!shippingDetails.warranty?.status || shippingDetails.warranty?.status === "") {
        newErrors.warrantyStatus = "Warranty status is required";
      }
      if (
        shippingDetails.warranty?.status === "warranty" &&
        (!shippingDetails.warranty?.period || shippingDetails.warranty?.period === "")
      ) {
        newErrors.warrantyPeriod = "Warranty period is required";
      }
      if (!shippingDetails.warranty?.returnPolicy || shippingDetails.warranty?.returnPolicy === "") {
        newErrors.returnPolicy = "Return policy is required";
      }
      
      setErrors(newErrors);
      const isValid = Object.keys(newErrors).length === 0;
      
      if (isValid) {
        updateProductDetails("shippingDetails", shippingDetails);
      }
      
      document.dispatchEvent(
        new CustomEvent("shippingValidated", { detail: { isValid } })
      );
    };

    document.addEventListener("validateShipping", handleValidateEvent);

    return () => {
      document.removeEventListener("validateShipping", handleValidateEvent);
    };
  }, [shippingDetails, deepest]);

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full">
      <h1 className="text-[14px] mb-4 xl:text-center">Shipping Details</h1>
      {/* Available shipping methods */}
      <div className="flex flex-col gap-y-3">
        <Select
          label="Product Location"
          className="z-80"
          value={shippingDetails.productLocation}
          onChange={(value) => {
            const updatedShipping = {
              ...shippingDetails,
              productLocation: value,
            };
            setShippingDetails(updatedShipping);
            updateProductDetails("shippingDetails", updatedShipping);
            setErrors((prev) => ({
              ...prev,
              productLocation: "",
            }));
          }}
          options={isLoadingCountries ? ["Loading..."] : countryOptions}
          required={true}
          error={errors.productLocation}
          placeholder="Select product location"
        />
        <div className="flex justify-between gap-x-4">
          <Input
            label="Product Weight"
            placeholder="30"
            value={shippingDetails.productWeight}
            className="w-full"
            onChange={(e) => {
              const weight = parseFloat(e.target.value);
              if (isNaN(weight) || weight < 0) {
                setErrors((prev) => ({
                  ...prev,
                  productWeight: "Weight must be a positive number",
                }));
                return;
              } else {
                setErrors((prev) => ({
                  ...prev,
                  productWeight: "",
                }));
              }
              const updatedShipping = {
                ...shippingDetails,
                productWeight: e.target.value,
              };
              setShippingDetails(updatedShipping);
              updateProductDetails("shippingDetails", updatedShipping);
            }}
            required={deepest?.productWeightRequired}
            error={errors.productWeight}
            type="number"
            helperText="The weight of the product for shipping purposes."
          />
          <Select
            label="Weight Unit"
            value={shippingDetails.weightUnit || ""}
            onChange={(value) => {
              const updatedShipping = {
                ...shippingDetails,
                weightUnit: value,
              };
              setShippingDetails(updatedShipping);
              updateProductDetails("shippingDetails", updatedShipping);
              setErrors((prev) => ({
                ...prev,
                weightUnit: "",
              }));
            }}
            className="w-full z-50"
            options={["lbs", "kg"]}
            required={deepest?.productWeightRequired}
            error={errors.weightUnit}
            placeholder="Select unit"
            helperText="The unit of weight for the product."
          />
        </div>
        <Select
          label="Shipping Restrictions"
          value={shippingDetails.restrictions[0] || "none"}
          onChange={(value) => {
            const updatedShipping = {
              ...shippingDetails,
              restrictions: [value],
            };
            setShippingDetails(updatedShipping);
            updateProductDetails("shippingDetails", updatedShipping);
          }}
          options={["none", "hazardous", "fragile", "perishable", "oversized", "local"]}
          placeholder="Select shipping restrictions"
          helperText="Select any special handling requirements for this product."
        />
      </div>
      <div className="relative w-full my-5">
        <label className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-1 text-xs bg-white text-black z-10">
          Product Dimensions
        </label>
        <div className="border border-gray-300 rounded-md p-4 pt-6">
          <div className="mb-3">
            <Select
              label="Dimension Unit"
              value={shippingDetails.dimensionUnit}
              onChange={(value) => {
                const updatedShipping = {
                  ...shippingDetails,
                  dimensionUnit: value,
                };
                setShippingDetails(updatedShipping);
                updateProductDetails("shippingDetails", updatedShipping);
              }}
              options={["mm", "cm", "in"]}
              placeholder="Select unit"
              helperText="The unit for length, width, and height measurements."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Input
              label="Length"
              placeholder="Enter product length"
              value={shippingDetails.productDimensions.length}
              onChange={(e) => {
                setShippingDetails({
                  ...shippingDetails,
                  productDimensions: {
                    ...shippingDetails.productDimensions,
                    length: e.target.value,
                  },
                });
                updateProductDetails("shippingDetails", {
                  ...shippingDetails,
                  productDimensions: {
                    ...shippingDetails.productDimensions,
                    length: e.target.value,
                  },
                });
                setErrors((prev) => ({
                  ...prev,
                  productDimensions: "",
                }));
              }}
              error={errors.productDimensions}
              required={deepest?.productDimensionsRequired}
            />
            <Input
              label="Width"
              placeholder="Enter product width"
              value={shippingDetails.productDimensions.width}
              onChange={(e) => {
                setShippingDetails({
                  ...shippingDetails,
                  productDimensions: {
                    ...shippingDetails.productDimensions,
                    width: e.target.value,
                  },
                });
                updateProductDetails("shippingDetails", {
                  ...shippingDetails,
                  productDimensions: {
                    ...shippingDetails.productDimensions,
                    width: e.target.value,
                  },
                });
                setErrors((prev) => ({
                  ...prev,
                  productDimensions: "",
                }));
              }}
              error={errors.productDimensions}
              required={deepest?.productDimensionsRequired}
            />
            <Input
              label="Height"
              placeholder="Enter product height"
              value={shippingDetails.productDimensions.height}
              onChange={(e) => {
                setShippingDetails({
                  ...shippingDetails,
                  productDimensions: {
                    ...shippingDetails.productDimensions,
                    height: e.target.value,
                  },
                });
                updateProductDetails("shippingDetails", {
                  ...shippingDetails,
                  productDimensions: {
                    ...shippingDetails.productDimensions,
                    height: e.target.value,
                  },
                });
                setErrors((prev) => ({
                  ...prev,
                  productDimensions: "",
                }));
              }}
              error={errors.productDimensions}
              required={deepest?.productDimensionsRequired}
            />
          </div>
        </div>
        {errors.productDimensions && (<p className="mt-2 text-red-500">{errors.productDimensions}</p>)}
      </div>
      <h1 className="text-[14px] mb-2 xl:text-center">
        Warranty & Returns
      </h1>
      <div className="flex flex-col gap-y-3">
        <Select
          label="Warranty Status"
          value={shippingDetails.warranty.status}
          onChange={(value) => {
            setShippingDetails({
              ...shippingDetails,
              warranty: {
                ...shippingDetails.warranty,
                status: value.toLowerCase().replace(" ", ""),
              },
            })
            updateProductDetails("shippingDetails", {
              ...shippingDetails,
              warranty: {
                ...shippingDetails.warranty,
                status: value.toLowerCase().replace(" ", ""),
              },
            });
            setErrors((prev) => ({
              ...prev,
              warrantyStatus: "",
            }));
          }}
          options={["No Warranty", "Warranty"]}
          required={true}
          error={errors.warrantyStatus}
          placeholder="Select warranty status"
        />
        {shippingDetails.warranty.status === "warranty" && (
          <Input
            label="Warranty Period"
            placeholder="2 years"
            value={shippingDetails.warranty.period}
            onChange={(e) => {
              setShippingDetails({
                ...shippingDetails,
                warranty: {
                  ...shippingDetails.warranty,
                  period: e.target.value,
                },
              })
              updateProductDetails("shippingDetails", {
                ...shippingDetails,
                warranty: {
                  ...shippingDetails.warranty,
                  period: e.target.value,
                },
              });
              setErrors((prev) => ({
                ...prev,
                warrantyPeriod: "",
              }));
            }}
            required={shippingDetails.warranty.status === "warranty"}
            error={errors.warrantyPeriod || ""}
            type="text"
            helperText="Specify the warranty period for the product."
          />
        )}
        <Input
          label="Return Policy"
          placeholder="6 months return policy"
          value={shippingDetails.warranty.returnPolicy}
          onChange={(e) => {
            setShippingDetails({
              ...shippingDetails,
              warranty: {
                ...shippingDetails.warranty,
                returnPolicy: e.target.value,
              },
            })
            updateProductDetails("shippingDetails", {
              ...shippingDetails,
              warranty: {
                ...shippingDetails.warranty,
                returnPolicy: e.target.value,
              },
            });
            setErrors((prev) => ({
              ...prev,
              returnPolicy: "",
            }));
          }}
          required={true}
          type="text"
          error={errors.returnPolicy}
          helperText="Provide details about the return policy for the product."
        />
      </div>
      {isMobileOrTablet && (
        <div className="mt-4">
          <NavigationButtons onNext={validateShippingDetails} onSaveDraft={props.onSaveDraft} />
        </div>
      )}
    </div>
  );
};

export default ShippingDetails;