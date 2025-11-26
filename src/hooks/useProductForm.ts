import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ProductFormData, ProductFormValidator, ValidationResult } from '@/utils/productFormValidation';
import { DraftManager, DraftData } from '@/utils/draftManager';
import { useCreateProduct, useSaveDraft, useUpdateDraft } from './mutations';

interface UseProductFormOptions {
  initialData?: Partial<ProductFormData>;
  draftId?: string;
  autoSave?: boolean;
  onStepChange?: (step: number) => void;
  onSaveSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useProductForm = (options: UseProductFormOptions = {}) => {
  const {
    initialData = {},
    draftId: initialDraftId,
    autoSave = true,
    onStepChange,
    onSaveSuccess,
    onError
  } = options;

  const router = useRouter();
  const [formData, setFormData] = useState<Partial<ProductFormData>>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState(initialDraftId || DraftManager.generateDraftId());
  const [isLoading, setIsLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {}
  });

  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);

  // Update refs when state changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const createProductMutation = useCreateProduct();
  const saveDraftMutation = useSaveDraft();
  const updateDraftMutation = useUpdateDraft();

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    const result = ProductFormValidator.validateStep(currentStep, formData);
    setValidationResults(result);
    return result;
  }, [currentStep, formData]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Handle nested updates properly
      if (updates.category) {
        newData.category = { ...prev.category, ...updates.category };
      }
      if (updates.inventory) {
        newData.inventory = {
          ...prev.inventory,
          ...updates.inventory,
          listing: {
            ...prev.inventory?.listing,
            ...updates.inventory.listing
          }
        };
      }
      if (updates.shipping) {
        newData.shipping = {
          ...prev.shipping,
          ...updates.shipping,
          dimensions: {
            ...prev.shipping?.dimensions,
            ...updates.shipping.dimensions
          }
        };
      }

      return newData;
    });
  }, []);

  // Save draft function
  const saveDraft = useCallback(async (showToast = true) => {
    try {
      setIsLoading(true);
      
      const draftData = DraftManager.prepareDraftData(
        draftId,
        formDataRef.current,
        currentStepRef.current
      );

      // Validate draft data
      const validation = DraftManager.validateDraftData(formDataRef.current);
      if (!validation.isValid) {
        console.warn('Draft validation warnings:', validation.errors);
      }

      // Save locally first
      DraftManager.saveLocalDraft(draftData);

      // Save to server
      if (initialDraftId) {
        await updateDraftMutation.mutateAsync({ id: draftId, draft: draftData });
      } else {
        await saveDraftMutation.mutateAsync(draftData);
      }

      if (showToast) {
        toast.success('Draft saved successfully');
      }
      
      onSaveSuccess?.();
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      if (showToast) {
        toast.error(error.message || 'Failed to save draft');
      }
      onError?.(error.message || 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  }, [draftId, initialDraftId, saveDraftMutation, updateDraftMutation, onSaveSuccess, onError]);

  // Auto-save setup
  useEffect(() => {
    if (autoSave) {
      DraftManager.startAutoSave(
        draftId,
        () => formDataRef.current,
        () => currentStepRef.current,
        () => saveDraft(false)
      );

      return () => {
        DraftManager.stopAutoSave();
      };
    }
  }, [draftId, autoSave, saveDraft]);

  // Navigate to step
  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > 6) return;
    
    setCurrentStep(step);
    onStepChange?.(step);
  }, [onStepChange]);

  // Next step
  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (validation.isValid && currentStep < 6) {
      goToStep(currentStep + 1);
      return true;
    }
    return false;
  }, [currentStep, validateCurrentStep, goToStep]);

  // Previous step
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
      return true;
    }
    return false;
  }, [currentStep, goToStep]);

  // Submit product
  const submitProduct = useCallback(async () => {
    try {
      setIsLoading(true);

      // Final validation
      const validation = ProductFormValidator.validateComplete(formData as ProductFormData);
      if (!validation.isValid) {
        setValidationResults(validation);
        toast.error('Please fix all validation errors before submitting');
        return false;
      }

      // Prepare product data
      const productData = { ...formData };

      // Handle variant combinations if present
      if (formData.combinations && formData.variantDimensions) {
        // This will be processed by the backend
        productData.combinations = formData.combinations;
        productData.variantDimensions = formData.variantDimensions;
      }

      // Create product
      const result = await createProductMutation.mutateAsync(productData);
      
      toast.success('Product created successfully!');
      
      // Clean up draft
      try {
        DraftManager.removeLocalDraft(draftId);
        // Note: Server-side draft cleanup should be handled by the backend
      } catch (error) {
        console.warn('Failed to clean up draft:', error);
      }

      // Redirect to product page or dashboard
      router.push(`/dashboard/products/${result.product._id}`);
      
      return true;
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error(error.message || 'Failed to create product');
      onError?.(error.message || 'Failed to create product');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, draftId, createProductMutation, router, onError]);

  // Load draft data
  const loadDraft = useCallback((draftData: DraftData) => {
    const mergedData = DraftManager.mergeDraftData(formData, draftData.productDetails);
    setFormData(mergedData);
    setCurrentStep(draftData.step);
    setDraftId(draftData.draftId);
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setCurrentStep(1);
    setDraftId(DraftManager.generateDraftId());
    setValidationResults({ isValid: true, errors: {}, warnings: {} });
  }, [initialData]);

  // Get completion percentage
  const completionPercentage = DraftManager.calculateCompletionPercentage(formData);

  // Check if step is valid
  const isStepValid = useCallback((step: number) => {
    const result = ProductFormValidator.validateStep(step, formData);
    return result.isValid;
  }, [formData]);

  // Get step validation
  const getStepValidation = useCallback((step: number) => {
    return ProductFormValidator.validateStep(step, formData);
  }, [formData]);

  return {
    // State
    formData,
    currentStep,
    draftId,
    isLoading: isLoading || createProductMutation.isPending || saveDraftMutation.isPending || updateDraftMutation.isPending,
    validationResults,
    completionPercentage,

    // Actions
    updateFormData,
    saveDraft,
    goToStep,
    nextStep,
    prevStep,
    submitProduct,
    loadDraft,
    resetForm,
    validateCurrentStep,

    // Utilities
    isStepValid,
    getStepValidation,

    // Mutation states
    isCreating: createProductMutation.isPending,
    isSaving: saveDraftMutation.isPending || updateDraftMutation.isPending,
    createError: createProductMutation.error,
    saveError: saveDraftMutation.error || updateDraftMutation.error,
  };
};