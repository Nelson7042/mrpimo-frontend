"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateProduct } from "@/hooks/useProducts";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { toast } from "react-toastify";
import {
  toastConfigSuccess,
  toastConfigError,
} from "@/app/config/toast.config";
import ProductImages from "../../create-product/(components)/ProductImages";
import ProductDetailForm from "../../create-product/(components)/ProductDetailForm";
import ProductSpecifications from "../../create-product/(components)/ProductSpecifications";
import ProductVariants from "../../create-product/(components)/ProductVariants";
import PricingInformation from "../../create-product/(components)/PricingInformation";
import ShippingDetails from "../../create-product/(components)/ShippingDetails";
import { useFetchProductBySlug } from "@/hooks/queries";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { productDetails, setProductDetails } = useProductListing();

  const { data: productData, isLoading } = useFetchProductBySlug(slug);
  const product = productData?.product;

  useEffect(() => {
    if (product) {
      setProductDetails({
        productName: product.name,
        description: product.description,
        brandName: product.brand,
        condition: product.condition,
        conditionDescription: product.conditionDescription,
        category: product.category,
        images: product.images,
        productSpecifications: product.specifications,
        variants: product.variants,
        inventory: product.inventory,
        shipping: product.shipping,
        status: product.status,
      });
    }
  }, [product, setProductDetails]);

  const handleUpdate = async () => {
    if (!product?._id) {
      toast.error("Unable to update product", toastConfigError);
      return;
    }

    try {
      await updateProduct(product._id, productDetails);
      toast.success("Product updated successfully", toastConfigSuccess);
      router.push("/vendor/dashboard/products");
    } catch (error) {
      toast.error("Failed to update product", toastConfigError);
      console.error(error);
    }
  };

  if (isLoading || !product || !productDetails.productName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <div className="flex gap-4">
              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Update Product
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <ProductImages />
            {/* <ProductDetailForm /> */}
            <ProductSpecifications />
            <ProductVariants />
            <PricingInformation />
            <ShippingDetails />
          </div>
        </div>
      </div>
    </div>
  );
}
