import { useProductListing } from '@/contexts/ProductLisitngContext';
import { ProductMapper } from '@/utils/productMapper';
import { useCreateProduct } from './mutations';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { toastConfigSuccess, toastConfigError } from '@/app/config/toast.config';

export const useEnhancedProductForm = () => {
  const {
    productDetails,
    setProductDetails,
    setStep,
    draftId,
    saveDraftEnhanced,
    validateCurrentStep,
    validationResults,
    completionPercentage,
    isLoading
  } = useProductListing();

  const createProductMutation = useCreateProduct();
  const router = useRouter();

  const mapProductDetailsToSchema = () => {
    return ProductMapper.mapToBackendSchema(productDetails);
  };

  const validateProduct = (mappedData: any) => {
    return ProductMapper.validateMappedData(mappedData);
  };

  const submitProduct = async () => {
    try {
      // Map product details to backend schema
      const mappedData = mapProductDetailsToSchema();
      console.log('Mapped product data:', mappedData);
      
      // Validate the mapped data
      const validation = validateProduct(mappedData);
      
      if (!validation.isValid) {
        toast.error('Please fix validation errors before submitting', toastConfigError);
        console.log('Validation errors:', validation.errors);
        return { success: false, errors: validation.errors };
      }

      // Submit to backend
      const result = await createProductMutation.mutateAsync(mappedData);
      
      toast.success('Product created successfully!', toastConfigSuccess);
      
      // Clear form data
      setProductDetails({});
      setStep(1);
      
      // Redirect to products page
      router.push('/vendor/dashboard/products');
      
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product. Please try again.', toastConfigError);
      return { success: false, error: error.message };
    }
  };

  const saveDraft = async (showToast = true) => {
    return await saveDraftEnhanced(showToast);
  };

  const loadDraftData = (draftData: any) => {
    const mappedData = ProductMapper.mapFromBackendSchema(draftData.productDetails);
    setProductDetails(mappedData);
    setStep(draftData.step || 1);
  };

  return {
    // State
    productDetails,
    validationResults,
    completionPercentage,
    isLoading: isLoading || createProductMutation.isPending,
    
    // Actions
    mapProductDetailsToSchema,
    validateProduct,
    validateCurrentStep,
    submitProduct,
    saveDraft,
    loadDraftData,
    
    // Mutation states
    isSubmitting: createProductMutation.isPending,
    submitError: createProductMutation.error,
  };
};