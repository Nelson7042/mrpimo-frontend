import React, { useState, useEffect } from 'react';
import { Plus, X, Grid } from 'lucide-react';
import Input from './Input';
import ColorPicker from './ColorPicker';
import SizePicker from './SizePicker';

interface Dimension {
  name: string;
  values: string[];
}

interface Combination {
  dimensions: Record<string, string>;
  price: number;
  salePrice?: number;
  quantity: number;
  sku: string;
}

interface Props {
  onCombinationsChange: (combinations: Combination[], dimensionNames: string[]) => void;
  initialCombinations?: Combination[];
  initialDimensions?: string[];
}

export default function VariantCombinationBuilder({ 
  onCombinationsChange, 
  initialCombinations = [],
  initialDimensions = []
}: Props) {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [combinations, setCombinations] = useState<Combination[]>(initialCombinations);
  const [showCombinations, setShowCombinations] = useState(false);

  // Initialize dimensions from initial data
  useEffect(() => {
    if (initialDimensions.length > 0 && dimensions.length === 0) {
      const initDims = initialDimensions.map(name => ({
        name,
        values: [...new Set(initialCombinations.map(c => c.dimensions[name]).filter(Boolean))]
      }));
      setDimensions(initDims);
      setShowCombinations(true);
    }
  }, [initialDimensions, initialCombinations]);

  const addDimension = () => {
    setDimensions([...dimensions, { name: '', values: [''] }]);
  };

  const updateDimensionName = (index: number, name: string) => {
    const updated = [...dimensions];
    updated[index].name = name;
    setDimensions(updated);
  };

  const addDimensionValue = (dimIndex: number) => {
    const updated = [...dimensions];
    updated[dimIndex].values.push('');
    setDimensions(updated);
  };

  const updateDimensionValue = (dimIndex: number, valueIndex: number, value: string) => {
    const updated = [...dimensions];
    updated[dimIndex].values[valueIndex] = value;
    setDimensions(updated);
  };

  const removeDimensionValue = (dimIndex: number, valueIndex: number) => {
    const updated = [...dimensions];
    updated[dimIndex].values.splice(valueIndex, 1);
    setDimensions(updated);
  };

  const removeDimension = (index: number) => {
    const updated = [...dimensions];
    updated.splice(index, 1);
    setDimensions(updated);
  };

  const generateCombinations = () => {
    const validDimensions = dimensions.filter(d => d.name && d.values.some(v => v));
    
    if (validDimensions.length === 0) return;

    const generateAllCombinations = (dims: Dimension[]): Record<string, string>[] => {
      if (dims.length === 0) return [{}];
      if (dims.length === 1) {
        return dims[0].values.filter(v => v).map(value => ({ [dims[0].name]: value }));
      }

      const [first, ...rest] = dims;
      const restCombinations = generateAllCombinations(rest);
      const combinations: Record<string, string>[] = [];

      for (const value of first.values.filter(v => v)) {
        for (const restCombination of restCombinations) {
          combinations.push({ [first.name]: value, ...restCombination });
        }
      }

      return combinations;
    };

    const allCombinations = generateAllCombinations(validDimensions);
    const newCombinations = allCombinations.map((combo, index) => {
      const existing = combinations.find(c => 
        JSON.stringify(c.dimensions) === JSON.stringify(combo)
      );

      if (existing) return existing;

      const comboString = Object.entries(combo).map(([k, v]) => `${k}:${v}`).join('-');
      return {
        dimensions: combo,
        price: 0,
        salePrice: undefined,
        quantity: 0,
        sku: `${comboString}-${Date.now()}-${index}`.toUpperCase()
      };
    });

    setCombinations(newCombinations);
    setShowCombinations(true);
  };

  const updateCombination = (index: number, field: keyof Combination, value: any) => {
    const updated = [...combinations];
    if (field === 'salePrice') {
      updated[index][field] = value ? Number(value) : undefined;
    } else if (field === 'price' || field === 'quantity') {
      updated[index][field] = Number(value);
    } else {
      (updated[index] as any)[field] = value;
    }
    setCombinations(updated);
  };

  // Notify parent of changes
  useEffect(() => {
    if (combinations.length > 0) {
      const dimensionNames = dimensions.map(d => d.name).filter(Boolean);
      onCombinationsChange(combinations, dimensionNames);
    }
  }, [combinations, dimensions, onCombinationsChange]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Variant Dimensions</h4>
        <button
          type="button"
          onClick={addDimension}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
        >
          <Plus size={16} />
          Add Dimension
        </button>
      </div>

      {dimensions.map((dimension, dimIndex) => (
        <div key={dimIndex} className="border border-gray-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <Input
              id={`dimension-${dimIndex}`}
              label="Dimension Name"
              type="text"
              value={dimension.name}
              onChange={(e) => updateDimensionName(dimIndex, e.target.value)}
              placeholder="e.g., Color, Size"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeDimension(dimIndex)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Values:</label>
            {dimension.name.toLowerCase().includes('color') || dimension.name.toLowerCase().includes('colour') ? (
              <ColorPicker
                selectedColors={dimension.values.filter(v => v)}
                onChange={(colors) => {
                  const updated = [...dimensions];
                  updated[dimIndex].values = colors;
                  setDimensions(updated);
                }}
              />
            ) : dimension.name.toLowerCase().includes('size') ? (
              <SizePicker
                selectedSizes={dimension.values.filter(v => v)}
                onChange={(sizes) => {
                  const updated = [...dimensions];
                  updated[dimIndex].values = sizes;
                  setDimensions(updated);
                }}
              />
            ) : (
              dimension.values.map((value, valueIndex) => (
                <div key={valueIndex} className="flex items-center gap-2">
                  <Input
                    id={`dimension-${dimIndex}-value-${valueIndex}`}
                    label=""
                    type="text"
                    value={value}
                    onChange={(e) => updateDimensionValue(dimIndex, valueIndex, e.target.value)}
                    placeholder="e.g., Material, Style"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeDimensionValue(dimIndex, valueIndex)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    disabled={dimension.values.length <= 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
            {!dimension.name.toLowerCase().includes('color') && 
             !dimension.name.toLowerCase().includes('colour') && 
             !dimension.name.toLowerCase().includes('size') && (
              <button
                type="button"
                onClick={() => addDimensionValue(dimIndex)}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Value
              </button>
            )}
          </div>
        </div>
      ))}

      {dimensions.length > 0 && (
        <button
          type="button"
          onClick={generateCombinations}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md"
        >
          <Grid size={16} />
          Generate Combinations
        </button>
      )}

      {showCombinations && combinations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Generated Combinations ({combinations.length})</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {combinations.map((combo, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="text-sm font-medium">Combination</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {Object.entries(combo.dimensions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </p>
                  </div>
                  <Input
                    id={`combo-${index}-price`}
                    label="Price"
                    type="number"
                    value={combo.price.toString()}
                    onChange={(e) => updateCombination(index, 'price', e.target.value)}
                    placeholder="0.00"
                  />
                  <Input
                    id={`combo-${index}-salePrice`}
                    label="Sale Price"
                    type="number"
                    value={combo.salePrice?.toString() || ''}
                    onChange={(e) => updateCombination(index, 'salePrice', e.target.value)}
                    placeholder="Optional"
                  />
                  <Input
                    id={`combo-${index}-quantity`}
                    label="Quantity"
                    type="number"
                    value={combo.quantity.toString()}
                    onChange={(e) => updateCombination(index, 'quantity', e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    id={`combo-${index}-sku`}
                    label="SKU"
                    type="text"
                    value={combo.sku}
                    onChange={(e) => updateCombination(index, 'sku', e.target.value)}
                    placeholder="SKU"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}