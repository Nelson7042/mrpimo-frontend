import Input from "./Input";
import React from "react";
import NavigationButtons from "./NavigationButtons";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useCreateProduct } from "@/hooks/useCreateProduct";
import { useProductMapper } from "./SubmitProduct";
import { toast } from "react-toastify";
import { useDeleteDraft } from "@/hooks/mutations";
import { useProductStore } from "@/stores/useProductStore";
import { useRouter } from "next/navigation";

type Props = {
  onSaveDraft?: () => void;
};

const SeoAndMetaSettings = (props: Props) => {
  const { updateProductDetails, productDetails, step, totalSteps, mobileTotalSteps, draftId } = useProductListing();
  console.log("Product Detailsxx:", productDetails)
  const [seoDetails, setSeoDetails] = React.useState({
    slug: productDetails?.seo?.slug || "",
    metaTitle: productDetails?.seo?.metaTitle || "",
    metaDescription: productDetails?.seo?.metaDescription || "",
  });
  const { isMobileOrTablet } = useResponsive();
  const createProductMutation = useCreateProduct();
  const { mapProductDetailsToSchema } = useProductMapper();
  const deleteDraftMutation = useDeleteDraft();
  const { listedProducts, setListedProducts } = useProductStore();
  const router = useRouter();

  const isLastStep = step === (isMobileOrTablet ? mobileTotalSteps : totalSteps);

  const handleCreateProduct = async () => {
    try {
      console.log('Starting product creation...');
      
      // Validate required fields
      if (!productDetails.productName || !productDetails.description) {
        toast.error('Please fill in all required fields');
        return false;
      }
      
      const mappedData = mapProductDetailsToSchema();
      console.log('Mapped data for API:', mappedData);
      
      const result = await createProductMutation.mutateAsync(mappedData);
      console.log('API response:', result);
      
      if (result.success || result.product) {
        toast.success("Product created successfully");
        
        // Clean up draft if exists
        if (draftId) {
          try {
            await deleteDraftMutation.mutateAsync(draftId);
            
            const draftsFromStorage = localStorage.getItem("productDrafts");
            const parsedDrafts = draftsFromStorage ? JSON.parse(draftsFromStorage) : [];
            const updatedDrafts = parsedDrafts.filter((draft: any) => draft.draftId !== draftId);
            
            localStorage.setItem("productDrafts", JSON.stringify(updatedDrafts));
          } catch (draftError) {
            console.warn('Failed to delete draft:', draftError);
          }
        }
        
        // Update product store
        const newProduct = result.product || result.data;
        if (newProduct) {
          setListedProducts([newProduct, ...listedProducts]);
        }
        
        router.push("/vendor/dashboard/products");
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Error creating product:", error);
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to create product. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  };

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full">
      <h1 className="text-[14px] mb-4 xl:text-center">Seo and Metadata</h1>
      {/* Available shipping methods */}
      <div className="flex flex-col gap-y-3">
        <Input
          label="Slug (URL Name"
          placeholder="Nike-baseball-cap"
          value={seoDetails.slug}
          onChange={(e) => {
            setSeoDetails({
              ...seoDetails,
              slug: e.target.value,
            });
            updateProductDetails("seo", {
              ...productDetails.seo,
              slug: e.target.value,
            });
          }}
          type="text"
          helperText="Auto-generated"
        />
        <Input
          label="Meta Title"
          placeholder="Buy Nike Baseball Cap Online | Mprimo"
          value={seoDetails.metaTitle}
          onChange={(e) => {
            setSeoDetails({
              ...seoDetails,
              metaTitle: e.target.value,
            });
            updateProductDetails("seo", {
              ...productDetails.seo,
              metaTitle: e.target.value,
            });
          }}
          type="text"
          helperText="Shown on search engine result."
        />
        <Input
          label="Meta Description"
          placeholder="High-quality Nike Baseball Cap for sports enthusiasts"
          value={seoDetails.metaDescription}
          onChange={(e) => {
            setSeoDetails({
              ...seoDetails,
              metaDescription: e.target.value,
            });
            updateProductDetails("seo", {
              ...productDetails.seo,
              metaDescription: e.target.value,
            });
          }}
          type="text"
          helperText="Shown on search engine result."
        />
      </div>
      {/* {isMobileOrTablet && ( */}
        <div className="mt-4">
          <NavigationButtons 
            onSaveDraft={props.onSaveDraft}
            // onNext={isLastStep ? handleCreateProduct : undefined}
            onNext={handleCreateProduct}
            nextDisabled={createProductMutation.isPending}
          />
        </div>
      {/* )} */}
    </div>
  );
};

export default SeoAndMetaSettings;
