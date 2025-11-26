import React, { useState, useEffect } from 'react';
import { checkoutService, CartValidationResponse } from '../utils/checkoutService';
import { CartValidation } from './CartValidation';

export const CheckoutPage: React.FC = () => {
  const [validationData, setValidationData] = useState<CartValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateCart = async () => {
      try {
        const data = await checkoutService.validateCart();
        setValidationData(data);
      } catch (error) {
        console.error('Cart validation failed:', error);
      } finally {
        setLoading(false);
      }
    };

    validateCart();
  }, []);

  if (loading) return (
    <div className="container-responsive section-spacing">
      <div className="text-center text-responsive-base">Validating cart...</div>
    </div>
  );
  
  if (!validationData) return (
    <div className="container-responsive section-spacing">
      <div className="text-center text-responsive-base text-red-600">Failed to validate cart</div>
    </div>
  );

  return (
    <div className="container-responsive section-spacing">
      <h2 className="text-responsive-xl font-bold element-spacing">Checkout</h2>
      
      <CartValidation unavailableItems={validationData.checkout.unavailableItems} />
      
      {validationData.checkout.canProceed && (
        <div className="mt-6 card-responsive bg-green-50 border border-green-200">
          <p className="text-green-800 font-medium">Ready to proceed with checkout!</p>
          <div className="mt-2 text-sm sm:text-base text-gray-600">
            Total: {validationData.checkout.pricing.currency} ${(validationData.checkout.pricing.total / 100).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};