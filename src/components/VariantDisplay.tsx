import React from 'react';
import { NumericFormat } from 'react-number-format';

interface VariantDisplayProps {
  variants: any[];
  selectedOptions: { [variantId: string]: string };
  onOptionChange: (variantId: string, optionId: string) => void;
  currencySymbol?: string;
  priceInfo?: {
    exchangeRate: number;
    currencySymbol: string;
  };
}

const VariantDisplay: React.FC<VariantDisplayProps> = ({
  variants,
  selectedOptions,
  onOptionChange,
  currencySymbol = '₦',
  priceInfo
}) => {
  
  const getDisplayPrice = (price: number) => {
    if (priceInfo?.exchangeRate) {
      return price * priceInfo.exchangeRate;
    }
    return price;
  };
  
  const getDisplayCurrency = () => {
    return priceInfo?.currencySymbol || currencySymbol;
  };
  const isColorVariant = (variantName: string) => {
    return variantName.toLowerCase().includes('color') || variantName.toLowerCase().includes('colour');
  };

  const isSizeVariant = (variantName: string) => {
    return variantName.toLowerCase().includes('size');
  };

  const isSizeValue = (value: string) => {
    const sizeValues = ['xs', 'x', 's', 'm', 'l', 'lg', 'xl', 'xxl', 'xxxl', 'small', 'medium', 'large', 'extra'];
    return sizeValues.some(size => value.toLowerCase().includes(size));
  };

  const getColorName = (value: string) => {
    const colorMap: Record<string, string> = {
      '#fee2e2': 'Light Red',
      '#fecaca': 'Light Red',
      '#fca5a5': 'Light Red',
      '#f87171': 'Red',
      '#ef4444': 'Red',
      '#dc2626': 'Dark Red',
      '#b91c1c': 'Dark Red',
      '#991b1b': 'Dark Red',
      '#7f1d1d': 'Dark Red',
      '#dbeafe': 'Light Blue',
      '#bfdbfe': 'Light Blue',
      '#93c5fd': 'Light Blue',
      '#60a5fa': 'Blue',
      '#3b82f6': 'Blue',
      '#2563eb': 'Dark Blue',
      '#1d4ed8': 'Dark Blue',
      '#1e40af': 'Dark Blue',
      '#1e3a8a': 'Dark Blue',
      '#dcfce7': 'Light Green',
      '#bbf7d0': 'Light Green',
      '#86efac': 'Light Green',
      '#4ade80': 'Green',
      '#22c55e': 'Green',
      '#16a34a': 'Dark Green',
      '#15803d': 'Dark Green',
      '#166534': 'Dark Green',
      '#14532d': 'Dark Green',
      '#fef9c3': 'Light Yellow',
      '#fef08a': 'Light Yellow',
      '#fde047': 'Yellow',
      '#facc15': 'Yellow',
      '#eab308': 'Yellow',
      '#ca8a04': 'Dark Yellow',
      '#a16207': 'Dark Yellow',
      '#854d0e': 'Dark Yellow',
      '#713f12': 'Dark Yellow',
      '#f3e8ff': 'Light Purple',
      '#e9d5ff': 'Light Purple',
      '#d8b4fe': 'Light Purple',
      '#c084fc': 'Purple',
      '#a855f7': 'Purple',
      '#9333ea': 'Dark Purple',
      '#7e22ce': 'Dark Purple',
      '#6b21a8': 'Dark Purple',
      '#581c87': 'Dark Purple',
      '#ffedd5': 'Light Orange',
      '#fed7aa': 'Light Orange',
      '#fdba74': 'Light Orange',
      '#fb923c': 'Orange',
      '#f97316': 'Orange',
      '#ea580c': 'Dark Orange',
      '#c2410c': 'Dark Orange',
      '#9a3412': 'Dark Orange',
      '#7c2d12': 'Dark Orange',
      '#ccfbf1': 'Light Teal',
      '#99f6e4': 'Light Teal',
      '#5eead4': 'Light Teal',
      '#2dd4bf': 'Teal',
      '#14b8a6': 'Teal',
      '#0d9488': 'Dark Teal',
      '#0f766e': 'Dark Teal',
      '#115e59': 'Dark Teal',
      '#134e4a': 'Dark Teal',
      '#f3f4f6': 'Light Gray',
      '#e5e7eb': 'Light Gray',
      '#d1d5db': 'Light Gray',
      '#9ca3af': 'Gray',
      '#6b7280': 'Gray',
      '#4b5563': 'Dark Gray',
      '#374151': 'Dark Gray',
      '#1f2937': 'Dark Gray',
      '#111827': 'Dark Gray',
      '#000000': 'Black',
      '#ffffff': 'White'
    };
    
    return colorMap[value.toLowerCase()] || (isHexColor(value) ? 'Color' : value);
  };

  const isStorageVariant = (variantName: string) => {
    return variantName.toLowerCase().includes('storage');
  };

  const isCombinedVariant = (variantName: string) => {
    return variantName.includes('&') || variantName.includes('+');
  };

  const isHexColor = (value: string) => {
    return /^#[0-9A-F]{6}$/i.test(value);
  };

  const extractColorFromValue = (value: string) => {
    const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'gray', 'grey', 'silver', 'gold', 'rose', 'space'];
    const lowerValue = value.toLowerCase();
    return colors.find(color => lowerValue.includes(color)) || null;
  };

  const getColorForValue = (value: string) => {
    const colorMap: { [key: string]: string } = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'orange': '#FFA500',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'rose': '#FF69B4',
      'space': '#2F2F2F'
    };
    
    const colorName = extractColorFromValue(value);
    return colorName ? colorMap[colorName] : null;
  };

  const renderColorOption = (option: any, isSelected: boolean, onClick: () => void) => {
    const colorValue = isHexColor(option.value) ? option.value : getColorForValue(option.value);
    
    return (
      <button
        key={option._id || option.id}
        onClick={onClick}
        className={`relative w-12 h-12 rounded-full border-2 transition-all ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        }`}
        title={`${getColorName(option.value)} - ${getDisplayCurrency()}${(option.displayPrice || option.salePrice || option.price).toFixed(2)}`}
      >
        {colorValue ? (
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: colorValue }}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {option.value.charAt(0).toUpperCase()}
          </div>
        )}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>
    );
  };

  const renderSizeOption = (option: any, isSelected: boolean, onClick: () => void) => (
    <button
      key={option._id || option.id}
      onClick={onClick}
      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 text-blue-700' 
          : 'border-gray-300 hover:border-gray-400 text-gray-700'
      }`}
      title={`${option.value} - ${getDisplayCurrency()}${(option.displayPrice || option.salePrice || option.price).toFixed(2)}`}
    >
      {option.value}
    </button>
  );

  const renderCombinedOption = (option: any, isSelected: boolean, onClick: () => void) => {
    const colorValue = getColorForValue(option.value);
    
    return (
      <button
        key={option._id || option.id}
        onClick={onClick}
        className={`relative flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 text-blue-700' 
            : 'border-gray-300 hover:border-gray-400 text-gray-700'
        }`}
        title={`${option.value} - ${getDisplayCurrency()}${(option.displayPrice || option.salePrice || option.price).toFixed(2)}`}
      >
        {colorValue && (
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: colorValue }}
          />
        )}
        <span className="text-xs font-medium">{option.value}</span>
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>
    );
  };

  const renderDefaultOption = (option: any, isSelected: boolean, onClick: () => void) => (
    <button
      key={option._id || option.id}
      onClick={onClick}
      className={`px-3 py-2 border rounded-md text-sm transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 text-blue-700' 
          : 'border-gray-300 hover:border-gray-400 text-gray-700'
      }`}
    >
      {option.value}
      {option.price && (
        <span className="ml-2 text-xs text-gray-500">
          <NumericFormat
            value={option.displayPrice || option.salePrice || option.price}
            displayType="text"
            thousandSeparator={true}
            prefix={getDisplayCurrency()}
            decimalScale={2}
            fixedDecimalScale={true}
          />
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {variants?.map((variant) => {
        const selectedOptionId = selectedOptions[variant._id || variant.id];
        const selectedOption = variant.options?.find((opt: any) => 
          (opt._id || opt.id) === selectedOptionId
        );

        return (
          <div key={variant._id || variant.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                {variant.name}
              </h3>
              {selectedOption && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {getColorName(selectedOption.value)}
                  </span>
                  {selectedOption.price && (
                    <span className="ml-2 text-green-600 font-semibold">
                      <NumericFormat
                        value={selectedOption.displayPrice || selectedOption.salePrice || selectedOption.price}
                        displayType="text"
                        thousandSeparator={true}
                        prefix={getDisplayCurrency()}
                        decimalScale={2}
                        fixedDecimalScale={true}
                      />
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {variant.options?.map((option: any) => {
                // Skip options without proper data
                if (!option.value && !option._id && !option.id) return null;
                
                const isSelected = (option._id || option.id) === selectedOptionId;
                const onClick = () => onOptionChange(variant._id || variant.id, option._id || option.id);

                // Handle options with missing value property
                if (!option.value) {
                  return (
                    <div key={option._id || option.id} className="text-sm text-gray-500">
                      Invalid option data
                    </div>
                  );
                }

                if (isCombinedVariant(variant.name) && (isColorVariant(variant.name) || isStorageVariant(variant.name))) {
                  return renderCombinedOption(option, isSelected, onClick);
                } else if (isColorVariant(variant.name) || isHexColor(option.value)) {
                  return renderColorOption(option, isSelected, onClick);
                } else if (isSizeVariant(variant.name) || isSizeValue(option.value)) {
                  return renderSizeOption(option, isSelected, onClick);
                } else {
                  return renderDefaultOption(option, isSelected, onClick);
                }
              })}
            </div>

            {/* Stock information */}
            {selectedOption?.quantity !== undefined && (
              <div className="text-xs text-gray-500">
                {selectedOption.quantity > 0 ? (
                  <span className="text-green-600">
                    {selectedOption.quantity} in stock
                  </span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VariantDisplay;