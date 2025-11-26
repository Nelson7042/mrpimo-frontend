import React from 'react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface Props {
  selectedSizes: string[];
  onChange: (sizes: string[]) => void;
}

export default function SizePicker({ selectedSizes, onChange }: Props) {
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      onChange(selectedSizes.filter(s => s !== size));
    } else {
      onChange([...selectedSizes, size]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Sizes:</label>
      <div className="flex gap-1">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggleSize(size)}
            className={`px-3 py-2 border rounded text-sm font-medium ${
              selectedSizes.includes(size)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      {selectedSizes.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected: {selectedSizes.join(', ')}
        </div>
      )}
    </div>
  );
}