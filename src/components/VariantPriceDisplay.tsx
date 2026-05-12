import React, { useState } from 'react';
import { ChevronDown, Package, DollarSign } from 'lucide-react';
import { useVendorStore } from '@/stores/useVendorStore';

interface VariantOption {
  value: string;
  price: number;
  quantity: number;
  sku: string;
}

interface Variant {
  name: string;
  options: VariantOption[];
}

interface Props {
  product: any;
  currencySymbol?: string;
}

const VariantPriceDisplay = ({ product, currencySymbol: propCurrencySymbol }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasVariants = product.variants && product.variants.length > 0;
  const { vendor } = useVendorStore();

  // Get vendor's currency symbol
  const getVendorCurrencySymbol = () => {
    // First check if passed as prop
    if (propCurrencySymbol) return propCurrencySymbol;
    
    // Then check product's country
    if (typeof product.country !== "string" && product.country?.currencySymbol) {
      return product.country.currencySymbol;
    }
    if (typeof product.country !== "string" && product.country?.currency) {
      return product.country.currency;
    }
    
    // Finally fall back to vendor's wallet currency
    const currency = vendor?.wallet?.currency || 'USD';
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'ZAR': 'R',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'KES': 'KSh',
      'GHS': '₵',
      'INR': '₹',
      'BRL': 'R$',
    };
    return currencySymbols[currency] || currency;
  };

  const currencySymbol = getVendorCurrencySymbol();

  if (!hasVariants) {
    // Fallback to base pricing - prefer salePrice over price
    const salePrice = product.inventory?.listing?.instant?.salePrice;
    const basePrice = product.inventory?.listing?.instant?.price || 
                     product.inventory?.listing?.auction?.startBidPrice || 0;
    const displayPrice = (salePrice && salePrice > 0) ? salePrice : basePrice;
    const baseQuantity = product.inventory?.listing?.instant?.quantity || 
                        product.inventory?.listing?.auction?.quantity || 0;

    return (
      <div className="text-xs">
        <div className="font-medium">{currencySymbol}{displayPrice.toLocaleString()}</div>
        {salePrice && salePrice > 0 && salePrice < basePrice && (
          <div className="text-gray-400 line-through text-[10px]">{currencySymbol}{basePrice.toLocaleString()}</div>
        )}
        <div className="text-gray-500">{baseQuantity} in stock</div>
      </div>
    );
  }

  // Calculate summary for variants - prefer salePrice over price
  const allOptions = product.variants.flatMap((v: Variant) => v.options);
  const prices = allOptions.map((o: VariantOption) => {
    const salePrice = (o as any).salePrice;
    return (salePrice && salePrice > 0) ? salePrice : o.price;
  }).filter((p: any) => p > 0);
  const totalQuantity = allOptions.reduce((sum: number, o: VariantOption) => sum + (o.quantity || 0), 0);
  
  if (prices.length === 0) return <div className="text-xs text-gray-500">No pricing set</div>;
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceDisplay = minPrice === maxPrice 
    ? `${currencySymbol}${minPrice.toLocaleString()}` 
    : `${currencySymbol}${minPrice.toLocaleString()} - ${currencySymbol}${maxPrice.toLocaleString()}`;

  return (
    <div className="relative">
      <div 
        className="cursor-pointer flex items-center gap-1 text-xs hover:bg-gray-50 p-1 rounded"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="font-medium">{priceDisplay}</div>
          <div className="text-gray-500">{totalQuantity} total stock</div>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>

      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-64 max-w-80">
          <div className="p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Variant Details</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {product.variants.map((variant: Variant, vIndex: number) => (
                <div key={vIndex} className="border-b border-gray-100 last:border-b-0 pb-2 last:pb-0">
                  <div className="font-medium text-xs text-gray-800 mb-1">{variant.name}</div>
                  <div className="grid gap-1">
                    {variant.options.map((option: VariantOption, oIndex: number) => {
                      const salePrice = (option as any).salePrice;
                      const displayPrice = (salePrice && salePrice > 0) ? salePrice : option.price;
                      const hasDiscount = salePrice && salePrice > 0 && salePrice < option.price;
                      
                      return (
                        <div key={oIndex} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.value}</span>
                            <span className="text-gray-500 text-[10px]">SKU: {option.sku}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <DollarSign size={10} className="text-green-600" />
                              <span className="font-medium">{currencySymbol}{displayPrice.toLocaleString()}</span>
                              {hasDiscount && (
                                <span className="text-gray-400 line-through text-[10px]">{currencySymbol}{option.price.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package size={10} className="text-blue-600" />
                              <span className={`font-medium ${option.quantity < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                {option.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantPriceDisplay;