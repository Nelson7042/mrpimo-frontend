"use client";

import { useEffect, useState } from "react";
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
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import { Lock } from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { productDetails, setProductDetails } = useProductListing();
  const [promoLockExpiry, setPromoLockExpiry] = useState<string | null>(null);

  const { data: productData, isLoading } = useFetchProductBySlug(slug);
  const product = productData?.product;

  // Check if this product has an active promo lock
  useEffect(() => {
    if (!product?._id) return;

    const checkPromoLock = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/vendors/advertisements`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const activePromoAd = result.data.advertisements.find(
              (ad: any) =>
                ad.productId?._id === product._id &&
                ad.status === "active" &&
                ad.promoConfig?.mode &&
                ad.promoConfig.mode !== "none"
            );
            if (activePromoAd) {
              setPromoLockExpiry(activePromoAd.endDate);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check promo lock:", error);
      }
    };
    checkPromoLock();
  }, [product?._id]);

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
      <div className="w-full">
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

          {promoLockExpiry && (
            <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Lock size={18} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Prices locked — active promotion expires{" "}
                {new Date(promoLockExpiry).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          <div className="space-y-8">
            <ProductImages />
            {/* <ProductDetailForm /> */}
            <ProductSpecifications />
            <ProductVariants priceLocked={!!promoLockExpiry} />
            <PricingInformation priceLocked={!!promoLockExpiry} />
            <ShippingDetails />
          </div>
        </div>
      </div>
    </div>
  );
}
