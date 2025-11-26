"use client";

import React, { useEffect, useState } from "react";
import Input from "./Input";
import Select from "./Select";
import NavigationButtons from "./NavigationButtons";
import { useCategories } from "@/hooks/queries";
import ICategory from "@/types/category.type";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";

type Props = {
  onSaveDraft?: () => void;
};

interface Attribute {
  name: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[];
}

const ProductDetailForm = (props: Props) => {
  const { setAttributes, updateProductDetails, productDetails, step } =
    useProductListing();
    console.log("the product details page" , productDetails )
  const [productDetail, setProductDetail] = React.useState({
    productName: productDetails?.productName || "",
    description: productDetails?.description || "",
    category: productDetails?.category || "",
    subCategory: productDetails?.subCategory || "",
    subCategory2: productDetails?.subCategory2 || "",
    subCategory3: productDetails?.subCategory3 || "",
    subCategory4: productDetails?.subCategory4 || "",
    subCategory5: productDetails?.subCategory5 || "",
    brandName: productDetails?.brandName || "",
    condition: productDetails?.condition || "",
    conditionDescription: productDetails?.conditionDescription || "",
  });
  const [subCategories, setSubCategories] = React.useState<string[]>([]);
  const [subCategories2, setSubCategories2] = React.useState<string[]>([]);
  const [subCategories3, setSubCategories3] = React.useState<string[]>([]);
  const [subCategories4, setSubCategories4] = React.useState<string[]>([]);
  const [subCategories5, setSubCategories5] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const { isMobileOrTablet } = useResponsive();
  const { data } = useCategories();
  let categories: string[] = [];

  if (data?.categories) {
    categories = data.categories
      .filter((category: ICategory) => category.level === 1)
      .map((category: ICategory) => category.name);
  }

  useEffect(() => {
    const handleValidateEvent = () => {
      const isValid = validateForm();
      console.log("isValid", isValid);
      if (isValid) {
        document.dispatchEvent(
          new CustomEvent("detailsValidated", { detail: { isValid: true } })
        );
      } else {
        document.dispatchEvent(
          new CustomEvent("detailsValidated", { detail: { isValid: false } })
        );
      }
    };

    document.addEventListener("validateDetails", handleValidateEvent);

    // Clean up
    return () => {
      document.removeEventListener("validateDetails", handleValidateEvent);
    };
  }, [productDetail]);

  useEffect(() => {
    if (productDetail.category && data?.categories) {
      // Find all relevant categories
      const selectedCategory = data.categories.find(
        (cat: ICategory) => cat.name === productDetail.category
      );
      const subCategory = data.categories.find(
        (cat: ICategory) => cat.name === productDetail.subCategory
      );
      const subCategory2 = data.categories.find(
        (cat: ICategory) => cat.name === productDetail.subCategory2
      );
      const subCategory3 = data.categories.find(
        (cat: ICategory) => cat.name === productDetail.subCategory3
      );
      const subCategory4 = data.categories.find(
        (cat: ICategory) => cat.name === productDetail.subCategory4
      );
      const subCategory5 = data.categories.find(
        (cat: ICategory) => cat.name === productDetail.subCategory5
      );

      // Start with main category attributes
      let combinedAttributes = selectedCategory
        ? [...(selectedCategory.attributes || [])]
        : [];

      // Add attributes from each subcategory level
      const addAttributesFromCategory = (category: ICategory | undefined) => {
        if (category?.attributes) {
          category.attributes.forEach((subAttr: Attribute) => {
            if (
              !combinedAttributes.some((attr) => attr.name === subAttr.name)
            ) {
              combinedAttributes.push(subAttr);
            }
          });
        }
      };

      // Add attributes from each level of subcategory
      addAttributesFromCategory(subCategory);
      addAttributesFromCategory(subCategory2);
      addAttributesFromCategory(subCategory3);
      addAttributesFromCategory(subCategory4);
      addAttributesFromCategory(subCategory5);

      setAttributes(combinedAttributes);
    }
  }, [
    productDetail.category,
    productDetail.subCategory,
    productDetail.subCategory2,
    productDetail.subCategory3,
    productDetail.subCategory4,
    productDetail.subCategory5,
    data?.categories,
    setAttributes,
  ]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!productDetail.productName) {
      newErrors.productName = "Product name is required";
    }

    if (productDetail.productName && productDetail.productName.length < 3) {
      newErrors.productName = "Product name should be at least 3 characters";
    }

    if (!productDetail.description) {
      newErrors.description = "Description is required";
    }

    if (productDetail.description && productDetail.description.length < 10) {
      newErrors.description = "Description needs to be at least 10 characters"
    }

    if (!productDetail.category) {
      newErrors.category = "Category is required";
    }

    if (!productDetail.brandName) {
      newErrors.brandName = "Brand name is required";
    }

    if (!productDetail.condition) {
      newErrors.condition = "Condition is required";
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Update all fields in context at once
      Object.keys(productDetail).forEach((key) => {
        updateProductDetails(
          key as keyof typeof productDetail,
          productDetail[key as keyof typeof productDetail]
        );
      });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleCategoryChanged = (val: string) => {
    setProductDetail({
      ...productDetail,
      category: val,
      subCategory: "",
      subCategory2: "",
      subCategory3: "",
      subCategory4: "",
      subCategory5: "",
    });
    setSubCategories(
      data.categories
        .filter((category: ICategory) => category.parent?.name === val)
        .map((category: ICategory) => category.name)
    );
    // Clear all deeper subcategories
    setSubCategories2([]);
    setSubCategories3([]);
    setSubCategories4([]);
    setSubCategories5([]);
  };

  const handleSubCategoryChanged = (val: string) => {
    setProductDetail({
      ...productDetail,
      subCategory: val,
      subCategory2: "",
      subCategory3: "",
      subCategory4: "",
      subCategory5: "",
    });
    setSubCategories2(
      data.categories
        .filter((category: ICategory) => category.parent?.name === val)
        .map((category: ICategory) => category.name)
    );
    // Clear all deeper subcategories
    setSubCategories3([]);
    setSubCategories4([]);
    setSubCategories5([]);
  };

  const handleSubCategory2Changed = (val: string) => {
    setProductDetail({
      ...productDetail,
      subCategory2: val,
      subCategory3: "",
      subCategory4: "",
      subCategory5: "",
    });
    setSubCategories3(
      data.categories
        .filter((category: ICategory) => category.parent?.name === val)
        .map((category: ICategory) => category.name)
    );
    // Clear all deeper subcategories
    setSubCategories4([]);
    setSubCategories5([]);
  };

  const handleSubCategory3Changed = (val: string) => {
    setProductDetail({
      ...productDetail,
      subCategory3: val,
      subCategory4: "",
      subCategory5: "",
    });
    setSubCategories4(
      data.categories
        .filter((category: ICategory) => category.parent?.name === val)
        .map((category: ICategory) => category.name)
    );
    // Clear deeper subcategory
    setSubCategories5([]);
  };

  const handleSubCategory4Changed = (val: string) => {
    setProductDetail({
      ...productDetail,
      subCategory4: val,
      subCategory5: "",
    });
    setSubCategories5(
      data.categories
        .filter((category: ICategory) => category.parent?.name === val)
        .map((category: ICategory) => category.name)
    );
  };

  return (
    <div className="p-2 sm:p-4 border border-gray-400 rounded-lg w-full max-w-full overflow-x-hidden">
      <h1 className="text-[16px] mb-4">Product details</h1>
      <form className="flex flex-col gap-y-3">
        <Input
          label="Product Name"
          type="text"
          id="productName"
          // className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Nike Baseball Cap"
          value={productDetail.productName}
          onChange={(e) => {
            setProductDetail({
              ...productDetail,
              productName: e.target.value,
            });
            updateProductDetails("productName", e.target.value);
            if (errors.productName) {
              const newErrors = { ...errors };
              delete newErrors.productName;
              setErrors(newErrors);
            }
          }}
          error={errors.productName}
          required={true}
        />
        <Input
          label="Description"
          type="textarea"
          id="description"
          // className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={`Elevate your everyday style with the Nke Baseball Cap. Made with high-quality cotton and an adjustable strap, this cap combines fashion with function. 
✅ 100% breathable cotton  
✅ Adjustable back strap for all sizes  
✅ Embroidered Nike logo  
Care Instructions:  
- Hand wash with cold water`}
          value={productDetail.description}
          onChange={(e) => {
            setProductDetail({
              ...productDetail,
              description: e.target.value,
            });
            updateProductDetails("description", e.target.value);
            if (errors.description) {
              const newErrors = { ...errors };
              delete newErrors.description;
              setErrors(newErrors);
            }
          }}
          error={errors.description}
          required={true}
        />
        <div className="flex flex-col w-full gap-4">
          <div className="flex flex-col md:flex-row w-full gap-4 items-center">
            <Select
              label="Category"
              value={productDetail.category}
              options={categories}
              onChange={(value) => {
                handleCategoryChanged(value);
                updateProductDetails("category", value);
                if (errors.category) {
                  const newErrors = { ...errors };
                  delete newErrors.category;
                  setErrors(newErrors);
                }
              }}
              placeholder="Select category"
              className="w-full"
              error={errors.category}
              required={true}
            />
            <Select
              label="Sub Category"
              value={productDetail.subCategory}
              options={subCategories}
              onChange={(value) => {
                handleSubCategoryChanged(value);
                updateProductDetails("subCategory", value);
                if (errors.subCategory) {
                  const newErrors = { ...errors };
                  delete newErrors.subCategory;
                  setErrors(newErrors);
                }
              }}
              placeholder="Select sub category"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Level 2 subcategory - only show if level 1 is selected */}
            {subCategories2.length > 0 && (
              <div className="md:col-span-1 col-span-2 flex flex-col md:flex-row w-full gap-4 items-center">
                <Select
                  label="Sub Category 2"
                  value={productDetail.subCategory2}
                  options={subCategories2}
                  onChange={(value) => {
                    handleSubCategory2Changed(value);
                    updateProductDetails("subCategory2", value);
                  }}
                  placeholder="Select sub category"
                  className="w-full"
                />
              </div>
            )}

            {/* Level 3 subcategory - only show if level 2 is selected */}
            {subCategories3.length > 0 && (
              <div className="md:col-span-1 col-span-2  flex flex-col md:flex-row w-full gap-4 items-center">
                <Select
                  label="Sub Category 3"
                  value={productDetail.subCategory3}
                  options={subCategories3}
                  onChange={(value) => {
                    handleSubCategory3Changed(value);
                    updateProductDetails("subCategory3", value);
                  }}
                  placeholder="Select sub category"
                  className="w-full"
                />
              </div>
            )}

            {/* Level 4 subcategory - only show if level 3 is selected */}
            {subCategories4.length > 0 && (
              <div className="md:col-span-1 col-span-2  flex flex-col md:flex-row w-full gap-4 items-center">
                <Select
                  label="Sub Category 4"
                  value={productDetail.subCategory4}
                  options={subCategories4}
                  onChange={(value) => {
                    handleSubCategory4Changed(value);
                    updateProductDetails("subCategory4", value);
                  }}
                  placeholder="Select sub category"
                  className="w-full"
                />
              </div>
            )}

            {/* Level 5 subcategory - only show if level 4 is selected */}
            {subCategories5.length > 0 && (
              <div className="md:col-span-1 col-span-2  flex flex-col md:flex-row w-full gap-4 items-center">
                <Select
                  label="Sub Category 5"
                  value={productDetail.subCategory5}
                  options={subCategories5}
                  onChange={(value) => {
                    setProductDetail({ ...productDetail, subCategory5: value });
                    updateProductDetails("subCategory5", value);
                  }}
                  placeholder="Select sub category"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row w-full gap-4 items-center">
          <Select
            label="Condition"
            value={productDetail.condition}
            options={["New", "Used", "Refurbished"]}
            onChange={(value) => {
              setProductDetail({ ...productDetail, condition: value });
              updateProductDetails("condition", value);
              if (errors.condition) {
                const newErrors = { ...errors };
                delete newErrors.condition;
                setErrors(newErrors);
              }
            }}
            placeholder="Select condition"
            className="w-full"
            error={errors.condition}
            required={true}
          />
          <Input
            label="Brand Name"
            type="text"
            id="brandName"
            className="w-full"
            placeholder="Enter brand name"
            value={productDetail.brandName}
            onChange={(e) => {
              setProductDetail({ ...productDetail, brandName: e.target.value });
              updateProductDetails("brandName", e.target.value);
              if (errors.brandName) {
                const newErrors = { ...errors };
                delete newErrors.brandName;
                setErrors(newErrors);
              }
            }}
            error={errors.brandName}
            required={true}
          />
        </div>

        <Input
          label="Condition Description"
          type="textarea"
          id="conditionDescription"
          descritpionHeight="min-h-20"
          placeholder="Enter condition description"
          value={productDetail.conditionDescription}
          onChange={(e) => {
            setProductDetail({
              ...productDetail,
              conditionDescription: e.target.value,
            });
            updateProductDetails("conditionDescription", e.target.value);
            if (errors.conditionDescription) {
              const newErrors = { ...errors };
              delete newErrors.conditionDescription;
              setErrors(newErrors);
            }
          }}
          error={errors.conditionDescription}
          required={productDetail.condition === "Used" || productDetail.condition === "Refurbished"}
        />
      </form>
      {isMobileOrTablet && (
        <div className="mt-5">
          <NavigationButtons
            onNext={validateForm}
            onSaveDraft={props.onSaveDraft}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetailForm;
