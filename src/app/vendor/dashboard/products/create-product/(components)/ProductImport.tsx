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
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import Products</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>

        {/* Import Type Tabs */}
        <div className="flex border-b mb-6">
          {[
            { key: 'csv', label: 'CSV Upload', icon: FileText },
            { key: 'json', label: 'JSON Upload', icon: Package },
            { key: 'shopify', label: 'Shopify', icon: ShoppingCart },
            { key: 'woocommerce', label: 'WooCommerce', icon: ShoppingCart }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as ImportType)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Import Content */}
        <div className="mb-6">
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => downloadTemplate('csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => downloadTemplate('json')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Download size={16} />
                  Download JSON Template
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shopify' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Store URL</label>
                <input
                  type="text"
                  value={shopifyCredentials.storeUrl}
                  onChange={(e) => setShopifyCredentials({ ...shopifyCredentials, storeUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="your-store.myshopify.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={shopifyCredentials.apiKey}
                  onChange={(e) => setShopifyCredentials({ ...shopifyCredentials, apiKey: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Your Shopify API key"
                />
              </div>
            </div>
          )}

          {activeTab === 'woocommerce' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Store URL</label>
                <input
                  type="text"
                  value={wooCredentials.storeUrl}
                  onChange={(e) => setWooCredentials({ ...wooCredentials, storeUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="https://your-store.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Consumer Key</label>
                <input
                  type="text"
                  value={wooCredentials.apiKey}
                  onChange={(e) => setWooCredentials({ ...wooCredentials, apiKey: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Your WooCommerce consumer key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Consumer Secret</label>
                <input
                  type="password"
                  value={wooCredentials.apiSecret}
                  onChange={(e) => setWooCredentials({ ...wooCredentials, apiSecret: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Your WooCommerce consumer secret"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload size={16} />
            {importMutation.isPending ? 'Importing...' : 'Import Products'}
          </button>
        </div>
      </div>
    </div>
  );
}