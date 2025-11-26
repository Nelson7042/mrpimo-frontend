import { useState, useCallback } from 'react';
import { ProductMapper } from '@/utils/productMapper';
import { ProductFormValidator } from '@/utils/productFormValidation';

export interface ValidationError {
  field: string;
  message: string;
}

export const useProductValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasErrors, setHasErrors] = useState(false);

  const validateProduct = useCallback((productData: any) => {
    try {
      // Use comprehensive validation
      const validation = ProductMapper.validateMappedData(productData);
      
      const validationErrors: ValidationError[] = validation.errors.map(error => ({
        field: 'general',
        message: error
      }));

      setErrors(validationErrors);
      setHasErrors(!validation.isValid);

      return {
        isValid: validation.isValid,
        errors: validationErrors
      };
    } catch (error) {
      console.error('Validation error:', error);
      const fallbackError: ValidationError[] = [{
        field: 'general',
        message: 'Validation failed. Please check your product details.'
      }];
      
      setErrors(fallbackError);
      setHasErrors(true);
      
      return {
        isValid: false,
        errors: fallbackError
      };
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    setHasErrors(false);
  }, []);

  return {
    validateProduct,
    errors,
    hasErrors,
    clearErrors
  };
};