"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { ProductFormValidator, ValidationResult } from "@/utils/productFormValidation";
import { DraftManager } from "@/utils/draftManager";
import { useSaveDraft, useUpdateDraft } from "@/hooks/mutations";
import { toast } from "react-toastify";
import { AutoSaveStatus } from "@/app/vendor/dashboard/products/create-product/(components)/AutoSaveIndicator";

type AttributeOption = string;

type Attribute = {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: AttributeOption[];
};

type ProductListingContextType = {
  step: number;
  setStep: (step: number) => void;
  totalSteps: number;
  mobileTotalSteps: number;
  attributes: Attribute[];
  setAttributes: (attributes: Attribute[]) => void;
  currentAttributePage: number;
  setCurrentAttributePage: (page: number) => void;
  totalAttributePages: number;
  productDetails: Record<string, any>;
  updateProductDetails: (key: string, value: any) => void;
  setProductDetails: (details: Record<string, any>) => void;
  draftId: string;
  setDraftId: (draft: string) => void;
  // Enhanced validation and draft functionality
  validationResults: ValidationResult;
  validateCurrentStep: () => ValidationResult;
  saveDraftEnhanced: (showToast?: boolean) => Promise<void>;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  completionPercentage: number;
  isLoading: boolean;
  // Auto-save status tracking
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: Date | null;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  // Draft restoration
  restoreFromDraft: (draft: any) => void;
  checkForExistingDraft: () => any | null;
};

const ProductListingContext = createContext<ProductListingContextType | undefined>(undefined);

export const ProductListingProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState(1);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [draftId, setDraftId] = useState(DraftManager.generateDraftId());
  const [currentAttributePage, setCurrentAttributePage] = useState(1);
  const [totalAttributePages, setTotalAttributePages] = useState(1);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {}
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-save status tracking
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const previousProductDetailsRef = useRef<Record<string, any>>({});

  const saveDraftMutation = useSaveDraft();
  const updateDraftMutation = useUpdateDraft();

  // Calculate total steps based on attributes
  const totalSteps = 3;
  const mobileTotalSteps = 8;

  // Calculate completion percentage
  const completionPercentage = DraftManager.calculateCompletionPercentage(productDetails);

  // Calculate attribute pages based on screen size and attributes
  useEffect(() => {
    if (attributes.length === 0) return;
    
    const calculatePages = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      const attributesPerPage = isMobile ? 7 : isTablet ? 16 : 16;
      const pages = Math.ceil((attributes.length + 2) / attributesPerPage);
      
      setTotalAttributePages(pages);
    };

    calculatePages();
    window.addEventListener('resize', calculatePages);
    
    return () => window.removeEventListener('resize', calculatePages);
  }, [attributes]);

  // Enhanced validation function
  const validateCurrentStep = useCallback(() => {
    const result = ProductFormValidator.validateStep(step, productDetails);
    setValidationResults(result);
    return result;
  }, [step, productDetails]);

  // Enhanced draft saving - localStorage + optional server save
  const saveDraftEnhanced = useCallback(async (showToast = true) => {
    try {
      setIsLoading(true);
      setAutoSaveStatus("saving");
      
      const draftData = DraftManager.prepareDraftData(draftId, productDetails, step);
      
      // Always save to localStorage first
      DraftManager.saveLocalDraft(draftData);

      // Only save to server when explicitly requested (showToast = true)
      if (showToast) {
        const existingDrafts = DraftManager.getLocalDrafts();
        const existingDraft = existingDrafts.find((d: any) => d.draftId === draftId);
        
        if (existingDraft?.savedToServer) {
          await updateDraftMutation.mutateAsync({ id: draftId, draft: draftData });
        } else {
          await saveDraftMutation.mutateAsync(draftData);
        }
        
        // Mark as saved to server
        DraftManager.markDraftSavedToServer(draftId);
        
        toast.success('Draft saved to server');
      }
      
      setAutoSaveStatus("saved");
      setLastSavedAt(new Date());
      setIsDirty(false);
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      setAutoSaveStatus("error");
      if (showToast) {
        toast.error(error.message || 'Failed to save draft to server');
      }
    } finally {
      setIsLoading(false);
    }
  }, [draftId, productDetails, step, saveDraftMutation, updateDraftMutation]);

  // Track changes to mark form as dirty
  useEffect(() => {
    const hasData = productDetails.productName || productDetails.brandName || productDetails.description;
    const hasChanged = JSON.stringify(productDetails) !== JSON.stringify(previousProductDetailsRef.current);
    
    if (hasData && hasChanged) {
      setIsDirty(true);
      previousProductDetailsRef.current = { ...productDetails };
    }
  }, [productDetails]);

  // Auto-save to localStorage every 30 seconds when form is dirty
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const hasData = productDetails.productName || productDetails.brandName || productDetails.description;
    if (!hasData || !isDirty) return;

    const interval = setInterval(async () => {
      try {
        setAutoSaveStatus("saving");
        const draftData = DraftManager.prepareDraftData(draftId, productDetails, step);
        DraftManager.saveLocalDraft(draftData);
        setAutoSaveStatus("saved");
        setLastSavedAt(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus("error");
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [draftId, autoSaveEnabled, productDetails, step, isDirty]);

  // Check for existing draft on mount
  const checkForExistingDraft = useCallback(() => {
    const localDrafts = DraftManager.getLocalDrafts();
    if (localDrafts.length > 0) {
      // Return the most recent draft
      const sortedDrafts = localDrafts.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      return sortedDrafts[0];
    }
    return null;
  }, []);

  // Restore from draft
  const restoreFromDraft = useCallback((draft: any) => {
    if (draft && draft.productDetails) {
      setProductDetails(draft.productDetails);
      setDraftId(draft.draftId);
      if (draft.step) {
        setStep(draft.step);
      }
      if (draft.lastUpdated) {
        setLastSavedAt(new Date(draft.lastUpdated));
      }
      setIsDirty(false);
      setAutoSaveStatus("saved");
    }
  }, []);

  const updateProductDetails = (key: string, value: any) => {
    setProductDetails(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ProductListingContext.Provider 
      value={{ 
        step, 
        setStep, 
        totalSteps, 
        mobileTotalSteps,
        attributes, 
        setAttributes,
        currentAttributePage,
        setCurrentAttributePage,
        totalAttributePages,
        productDetails,
        setProductDetails,
        updateProductDetails,
        draftId,
        setDraftId,
        validationResults,
        validateCurrentStep,
        saveDraftEnhanced,
        autoSaveEnabled,
        setAutoSaveEnabled,
        completionPercentage,
        isLoading: isLoading || saveDraftMutation.isPending || updateDraftMutation.isPending,
        // Auto-save status tracking
        autoSaveStatus,
        lastSavedAt,
        isDirty,
        setIsDirty,
        // Draft restoration
        restoreFromDraft,
        checkForExistingDraft,
      }}
    >
      {children}
    </ProductListingContext.Provider>
  );
};

export const useProductListing = () => {
  const context = useContext(ProductListingContext);
  if (!context) {
    throw new Error("useProductListing must be used within ProductListingProvider");
  }
  return context;
};
