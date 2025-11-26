import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, ShoppingCart, Package } from 'lucide-react';
import { useProductImport } from '@/hooks/useProductImport';
import { toast } from 'react-toastify';
import { toastConfigSuccess, toastConfigError } from '@/app/config/toast.config';

type ImportType = 'csv' | 'json' | 'shopify' | 'woocommerce';

interface ShopifyCredentials {
  apiKey: string;
  storeUrl: string;
}

interface WooCommerceCredentials {
  apiKey: string;
  apiSecret: string;
  storeUrl: string;
}

interface Props {
  onClose: () => void;
}

export default function ProductImport({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ImportType>('csv');
  const [shopifyCredentials, setShopifyCredentials] = useState<ShopifyCredentials>({ apiKey: '', storeUrl: '' });
  const [wooCredentials, setWooCredentials] = useState<WooCommerceCredentials>({ apiKey: '', apiSecret: '', storeUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importMutation = useProductImport();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    try {
      let data: any;
      
      if (activeTab === 'csv') {
        if (!selectedFile) {
          toast.error('Please select a CSV file', toastConfigError);
          return;
        }
        data = { file: selectedFile };
      } else if (activeTab === 'json') {
        if (!selectedFile) {
          toast.error('Please select a JSON file', toastConfigError);
          return;
        }
        data = { file: selectedFile };
      } else if (activeTab === 'shopify') {
        if (!shopifyCredentials.apiKey || !shopifyCredentials.storeUrl) {
          toast.error('Please provide Shopify credentials', toastConfigError);
          return;
        }
        data = shopifyCredentials;
      } else if (activeTab === 'woocommerce') {
        if (!wooCredentials.apiKey || !wooCredentials.apiSecret || !wooCredentials.storeUrl) {
          toast.error('Please provide WooCommerce credentials', toastConfigError);
          return;
        }
        data = wooCredentials;
      }

      await importMutation.mutateAsync({ type: activeTab, data });
      onClose();
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const downloadTemplate = (type: 'csv' | 'json') => {
    if (type === 'csv') {
      const csvContent = 'name,brand,description,condition,category,price,quantity,weight,images,specifications\n"Sample Product","Sample Brand","Sample description","new","Electronics",99.99,10,1.5,"https://example.com/image.jpg","Color:Red;Size:Large"';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonTemplate = {
        products: [
          {
            name: 'Sample Product',
            brand: 'Sample Brand',
            description: 'Sample description',
            condition: 'new',
            category: 'Electronics',
            price: 99.99,
            quantity: 10,
            weight: 1.5,
            images: ['https://example.com/image.jpg'],
            specifications: [{ key: 'Color', value: 'Red' }]
          }
        ]
      };
      const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-template.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Bulk Product Creation</h2>
          <div className="flex gap-2">
            <button
              onClick={exportTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              <Download size={16} />
              Template
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {products.map((product, index) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Product {index + 1}</h3>
                {products.length > 1 && (
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Brand *</label>
                  <input
                    type="text"
                    value={product.brand}
                    onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Condition *</label>
                  <select
                    value={product.condition}
                    onChange={(e) => updateProduct(product.id, 'condition', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={product.weight}
                    onChange={(e) => updateProduct(product.id, 'weight', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.0"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    value={product.description}
                    onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.dimensions.length}
                      onChange={(e) => updateProduct(product.id, 'dimensions', {
                        ...product.dimensions,
                        length: parseFloat(e.target.value) || 0
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.dimensions.width}
                      onChange={(e) => updateProduct(product.id, 'dimensions', {
                        ...product.dimensions,
                        width: parseFloat(e.target.value) || 0
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.dimensions.height}
                      onChange={(e) => updateProduct(product.id, 'dimensions', {
                        ...product.dimensions,
                        height: parseFloat(e.target.value) || 0
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={addProduct}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus size={16} />
            Add Another Product
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={createMultipleProducts.isPending}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {createMultipleProducts.isPending ? 'Creating...' : `Create ${products.length} Products`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}