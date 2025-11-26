import React, { useState } from 'react';
import { ChevronDown, Package, DollarSign } from 'lucide-react';

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
}

const VariantPriceDisplay = ({ product }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasVariants = product.variants && product.variants.length > 0;

  if (!hasVariants) {
    // Fallback to base pricing
    const basePrice = product.inventory?.listing?.instant?.price || 
                     product.inventory?.listing?.auction?.startBidPrice || 0;
    const baseQuantity = product.inventory?.listing?.instant?.quantity || 
                        product.inventory?.listing?.auction?.quantity || 0;
    const currency = typeof product.country !== "string" ? product.country?.currency : "";

    return (
      <div className="text-xs">
        <div className="font-medium">{currency} {basePrice}</div>
        <div className="text-gray-500">{baseQuantity} in stock</div>
      </div>
    );
  }

  // Calculate summary for variants
  const allOptions = product.variants.flatMap((v: Variant) => v.options);
  const prices = allOptions.map((o: VariantOption) => o.price).filter((p: any) => p > 0);
  const totalQuantity = allOptions.reduce((sum: number, o: VariantOption) => sum + (o.quantity || 0), 0);
  
  if (prices.length === 0) return <div className="text-xs text-gray-500">No pricing set</div>;
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currency = typeof product.country !== "string" ? product.country?.currency : "";
  const priceDisplay = minPrice === maxPrice ? `${currency} ${minPrice}` : `${currency} ${minPrice} - ${maxPrice}`;

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
                    {variant.options.map((option: VariantOption, oIndex: number) => (
                      <div key={oIndex} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.value}</span>
                          <span className="text-gray-500 text-[10px]">SKU: {option.sku}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <DollarSign size={10} className="text-green-600" />
                            <span className="font-medium">{currency} {option.price}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package size={10} className="text-blue-600" />
                            <span className={`font-medium ${option.quantity < 5 ? 'text-red-600' : 'text-green-600'}`}>
                              {option.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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