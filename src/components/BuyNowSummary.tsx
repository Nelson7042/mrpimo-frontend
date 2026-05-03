"use client";

import React from 'react';
import { X, ShoppingBag, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BuyNowSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    productId: string;
    variantId: string;
    optionId: string;
    product: {
      name: string;
      images: string[];
      vendor: { businessName: string };
    };
    variant: {
      name: string;
      value?: string;
      price: number;
    };
    quantity: number;
    pricing: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
    };
    totalAmount: number;
    currency: string;
    currencySymbol: string;
  };
}

export default function BuyNowSummary({
  isOpen,
  onClose,
  orderData,
}: BuyNowSummaryProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const { product, variant, quantity, totalAmount, currency, currencySymbol } = orderData;

  const handleProceedToCheckout = () => {
    // Store buy now data in sessionStorage for the checkout page
    const buyNowData = {
      productId: orderData.productId,
      variantId: orderData.variantId,
      optionId: orderData.optionId,
      quantity: orderData.quantity,
      product: orderData.product,
      variant: orderData.variant,
      pricing: {
        subtotal: orderData.pricing.subtotal,
        tax: orderData.pricing.tax,
        shipping: orderData.pricing.shipping,
        total: orderData.pricing.total,
        currency: orderData.currency,
        currencySymbol: orderData.currencySymbol,
      },
    };

    sessionStorage.setItem('buyNowData', JSON.stringify(buyNowData));
    sessionStorage.setItem('buyNowCheckoutAuthorized', 'true');
    sessionStorage.setItem('checkoutTimestamp', Date.now().toString());

    router.push('/home/checkout');
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-60">
      <div className="bg-white rounded-lg scrollbar-hide p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg md:text-xl font-bold">Order Summary</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details */}
        <div className="border rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 line-clamp-2">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.vendor.businessName}</p>
              <div className="flex gap-2 mt-1">
                {variant.value && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                    {variant.name}: 
                    {/^#[0-9A-F]{6}$/i.test(variant.value) ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300" 
                          style={{ backgroundColor: variant.value }}
                        />
                        {variant.value}
                      </>
                    ) : (
                      variant.value
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <span className="text-sm text-gray-600">Quantity: {quantity}</span>
            <span className="font-medium">{currencySymbol}{variant.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="border rounded-lg p-4 mb-3 md:mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{currencySymbol}{orderData.pricing.subtotal.toFixed(2)}</span>
          </div>
          {orderData.pricing.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{currencySymbol}{orderData.pricing.tax.toFixed(2)}</span>
            </div>
          )}
          {orderData.pricing.shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">{currencySymbol}{orderData.pricing.shipping.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-blue-900">
                {currencySymbol}{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Proceed to Checkout Button */}
        <button
          onClick={handleProceedToCheckout}
          className="w-full p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          Proceed to Checkout
        </button>

        <div className="mt-4 flex justify-center">
          <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-xs">
            <Shield className="w-3 h-3" />
            <span>Secure checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
