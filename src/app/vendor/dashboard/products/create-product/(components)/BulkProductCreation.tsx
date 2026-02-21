import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, FileText, ShoppingCart, Package, Plus, Trash2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useProductImport } from '@/hooks/useProductImport';
import { toast } from 'react-toastify';
import { toastConfigSuccess, toastConfigError } from '@/app/config/toast.config';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

type ImportType = 'csv' | 'json' | 'shopify' | 'woocommerce' | 'manual';

interface ShopifyCredentials {
  apiKey: string;
  storeUrl: string;
}

interface WooCommerceCredentials {
  apiKey: string;
  apiSecret: string;
  storeUrl: string;
}

interface BulkProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  condition: 'new' | 'used' | 'refurbished';
  price: number;
  quantity: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationErrors: string[];
  fieldErrors: Record<string, string>;
  submissionStatus?: 'pending' | 'success' | 'failed';
  submissionError?: string;
}

interface SubmissionProgress {
  current: number;
  total: number;
  successCount: number;
  failedCount: number;
  isComplete: boolean;
}

interface Props {
  onClose: () => void;
}

interface ParseError {
  line?: number;
  field?: string;
  message: string;
}

interface ParseResult {
  success: boolean;
  products: BulkProduct[];
  errors: ParseError[];
}

const THEME_COLOR = '#002f7a';

const createEmptyProduct = (): BulkProduct => ({
  id: crypto.randomUUID(),
  name: '',
  brand: '',
  description: '',
  condition: 'new',
  price: 0,
  quantity: 0,
  weight: 0,
  dimensions: { length: 0, width: 0, height: 0 },
  validationStatus: 'pending',
  validationErrors: [],
  fieldErrors: {},
});

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

const validateProduct = (product: BulkProduct): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  
  if (!product.name.trim()) {
    errors.push('Product name is required');
    fieldErrors.name = 'Product name is required';
  }
  if (!product.brand.trim()) {
    errors.push('Brand is required');
    fieldErrors.brand = 'Brand is required';
  }
  if (!product.description.trim()) {
    errors.push('Description is required');
    fieldErrors.description = 'Description is required';
  }
  if (product.price <= 0) {
    errors.push('Price must be greater than 0');
    fieldErrors.price = 'Price must be greater than 0';
  }
  if (product.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
    fieldErrors.quantity = 'Quantity must be greater than 0';
  }
  if (product.weight <= 0) {
    errors.push('Weight must be greater than 0');
    fieldErrors.weight = 'Weight must be greater than 0';
  }
  
  return { isValid: errors.length === 0, errors, fieldErrors };
};

export default function BulkProductCreation({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ImportType>('manual');
  const [products, setProducts] = useState<BulkProduct[]>([createEmptyProduct()]);
  const [shopifyCredentials, setShopifyCredentials] = useState<ShopifyCredentials>({ apiKey: '', storeUrl: '' });
  const [wooCredentials, setWooCredentials] = useState<WooCommerceCredentials>({ apiKey: '', apiSecret: '', storeUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<SubmissionProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const importMutation = useProductImport();

  const createMultipleProducts = useMutation({
    mutationFn: async (products: any[]) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/products/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create products');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate product list queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      queryClient.invalidateQueries({ queryKey: ['allProducts'] });
      queryClient.invalidateQueries({ queryKey: ['bestDeals'] });
      queryClient.invalidateQueries({ queryKey: ['productsByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['productsOnAuction'] });
      // Invalidate vendor analytics queries
      queryClient.invalidateQueries({ queryKey: ['vendor-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['vendorAnalytics'] });
      toast.success(`Created ${data.summary?.successful || 0} of ${data.summary?.total || 0} products successfully!`, toastConfigSuccess);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create products', toastConfigError);
    },
  });

  const addProduct = useCallback(() => {
    setProducts(prev => [...prev, createEmptyProduct()]);
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateProduct = useCallback((id: string, field: string, value: any) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      const validation = validateProduct(updated);
      return {
        ...updated,
        validationStatus: validation.isValid ? 'valid' : 'invalid',
        validationErrors: validation.errors,
        fieldErrors: validation.fieldErrors,
      };
    }));
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParseErrors([]);
      parseFile(file);
    }
  };

  /**
   * Parse a CSV line handling quoted values with commas inside
   */
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Push the last value
    result.push(current.trim());
    return result;
  };

  /**
   * Parse CSV file content into products
   */
  const parseCSVContent = (text: string): ParseResult => {
    const errors: ParseError[] = [];
    const products: BulkProduct[] = [];
    
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push({ message: 'CSV file is empty' });
      return { success: false, products: [], errors };
    }
    
    if (lines.length < 2) {
      errors.push({ message: 'CSV file must have a header row and at least one product row' });
      return { success: false, products: [], errors };
    }
    
    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g, ''));
    
    // Validate required headers
    const requiredHeaders = ['name', 'brand', 'description', 'price', 'quantity'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push({ 
        line: 1, 
        message: `Missing required headers: ${missingHeaders.join(', ')}` 
      });
    }
    
    // Parse each product row
    for (let i = 1; i < lines.length; i++) {
      const lineNumber = i + 1;
      const line = lines[i].trim();
      
      if (!line) continue;
      
      try {
        const values = parseCSVLine(line);
        
        if (values.length !== headers.length) {
          errors.push({
            line: lineNumber,
            message: `Row has ${values.length} values but expected ${headers.length} (matching header count)`
          });
          continue;
        }
        
        const product = createEmptyProduct();
        const rowErrors: ParseError[] = [];
        
        headers.forEach((header, index) => {
          const value = values[index]?.replace(/^"|"$/g, '') || '';
          
          try {
            switch (header) {
              case 'name':
                product.name = value;
                break;
              case 'brand':
                product.brand = value;
                break;
              case 'description':
                product.description = value;
                break;
              case 'condition':
                const condition = value.toLowerCase();
                if (['new', 'used', 'refurbished'].includes(condition)) {
                  product.condition = condition as 'new' | 'used' | 'refurbished';
                } else if (value) {
                  rowErrors.push({
                    line: lineNumber,
                    field: 'condition',
                    message: `Invalid condition "${value}". Must be "new", "used", or "refurbished"`
                  });
                  product.condition = 'new';
                }
                break;
              case 'price':
                const price = parseFloat(value);
                if (isNaN(price)) {
                  rowErrors.push({
                    line: lineNumber,
                    field: 'price',
                    message: `Invalid price "${value}". Must be a number`
                  });
                } else {
                  product.price = price;
                }
                break;
              case 'quantity':
                const quantity = parseInt(value);
                if (isNaN(quantity)) {
                  rowErrors.push({
                    line: lineNumber,
                    field: 'quantity',
                    message: `Invalid quantity "${value}". Must be a whole number`
                  });
                } else {
                  product.quantity = quantity;
                }
                break;
              case 'weight':
                const weight = parseFloat(value);
                if (value && isNaN(weight)) {
                  rowErrors.push({
                    line: lineNumber,
                    field: 'weight',
                    message: `Invalid weight "${value}". Must be a number`
                  });
                } else {
                  product.weight = weight || 0;
                }
                break;
              case 'length':
                const length = parseFloat(value);
                if (value && !isNaN(length)) {
                  product.dimensions.length = length;
                }
                break;
              case 'width':
                const width = parseFloat(value);
                if (value && !isNaN(width)) {
                  product.dimensions.width = width;
                }
                break;
              case 'height':
                const height = parseFloat(value);
                if (value && !isNaN(height)) {
                  product.dimensions.height = height;
                }
                break;
            }
          } catch (fieldError) {
            rowErrors.push({
              line: lineNumber,
              field: header,
              message: `Error parsing field "${header}": ${fieldError}`
            });
          }
        });
        
        errors.push(...rowErrors);
        
        // Validate the product
        const validation = validateProduct(product);
        products.push({
          ...product,
          validationStatus: validation.isValid ? 'valid' : 'invalid',
          validationErrors: validation.errors,
          fieldErrors: validation.fieldErrors
        });
        
      } catch (lineError) {
        errors.push({
          line: lineNumber,
          message: `Failed to parse row: ${lineError instanceof Error ? lineError.message : 'Unknown error'}`
        });
      }
    }
    
    return {
      success: products.length > 0,
      products,
      errors
    };
  };

  /**
   * Parse JSON file content into products
   */
  const parseJSONContent = (text: string): ParseResult => {
    const errors: ParseError[] = [];
    const products: BulkProduct[] = [];
    
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      const errorMessage = parseError instanceof SyntaxError 
        ? parseError.message 
        : 'Invalid JSON format';
      errors.push({ message: `JSON parsing error: ${errorMessage}` });
      return { success: false, products: [], errors };
    }
    
    // Handle both { products: [...] } and direct array format
    const productArray = Array.isArray(data) ? data : (data.products || []);
    
    if (!Array.isArray(productArray)) {
      errors.push({ 
        message: 'JSON must contain an array of products or an object with a "products" array' 
      });
      return { success: false, products: [], errors };
    }
    
    if (productArray.length === 0) {
      errors.push({ message: 'No products found in JSON file' });
      return { success: false, products: [], errors };
    }
    
    productArray.forEach((item: any, index: number) => {
      const productNumber = index + 1;
      
      if (typeof item !== 'object' || item === null) {
        errors.push({
          line: productNumber,
          message: `Product ${productNumber} is not a valid object`
        });
        return;
      }
      
      try {
        const product: BulkProduct = {
          id: crypto.randomUUID(),
          name: '',
          brand: '',
          description: '',
          condition: 'new',
          price: 0,
          quantity: 0,
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 },
          validationStatus: 'pending',
          validationErrors: [],
          fieldErrors: {},
        };
        
        // Parse name
        if (typeof item.name === 'string') {
          product.name = item.name;
        } else if (item.name !== undefined) {
          errors.push({
            line: productNumber,
            field: 'name',
            message: `Product ${productNumber}: "name" must be a string`
          });
        }
        
        // Parse brand
        if (typeof item.brand === 'string') {
          product.brand = item.brand;
        } else if (item.brand !== undefined) {
          errors.push({
            line: productNumber,
            field: 'brand',
            message: `Product ${productNumber}: "brand" must be a string`
          });
        }
        
        // Parse description
        if (typeof item.description === 'string') {
          product.description = item.description;
        } else if (item.description !== undefined) {
          errors.push({
            line: productNumber,
            field: 'description',
            message: `Product ${productNumber}: "description" must be a string`
          });
        }
        
        // Parse condition
        if (item.condition !== undefined) {
          const condition = String(item.condition).toLowerCase();
          if (['new', 'used', 'refurbished'].includes(condition)) {
            product.condition = condition as 'new' | 'used' | 'refurbished';
          } else {
            errors.push({
              line: productNumber,
              field: 'condition',
              message: `Product ${productNumber}: "condition" must be "new", "used", or "refurbished"`
            });
          }
        }
        
        // Parse price
        if (typeof item.price === 'number') {
          product.price = item.price;
        } else if (typeof item.price === 'string') {
          const price = parseFloat(item.price);
          if (!isNaN(price)) {
            product.price = price;
          } else {
            errors.push({
              line: productNumber,
              field: 'price',
              message: `Product ${productNumber}: "price" must be a valid number`
            });
          }
        } else if (item.price !== undefined) {
          errors.push({
            line: productNumber,
            field: 'price',
            message: `Product ${productNumber}: "price" must be a number`
          });
        }
        
        // Parse quantity
        if (typeof item.quantity === 'number') {
          product.quantity = Math.floor(item.quantity);
        } else if (typeof item.quantity === 'string') {
          const quantity = parseInt(item.quantity);
          if (!isNaN(quantity)) {
            product.quantity = quantity;
          } else {
            errors.push({
              line: productNumber,
              field: 'quantity',
              message: `Product ${productNumber}: "quantity" must be a valid integer`
            });
          }
        } else if (item.quantity !== undefined) {
          errors.push({
            line: productNumber,
            field: 'quantity',
            message: `Product ${productNumber}: "quantity" must be a number`
          });
        }
        
        // Parse weight
        if (typeof item.weight === 'number') {
          product.weight = item.weight;
        } else if (typeof item.weight === 'string') {
          const weight = parseFloat(item.weight);
          if (!isNaN(weight)) {
            product.weight = weight;
          }
        }
        
        // Parse dimensions
        if (item.dimensions && typeof item.dimensions === 'object') {
          if (typeof item.dimensions.length === 'number') {
            product.dimensions.length = item.dimensions.length;
          }
          if (typeof item.dimensions.width === 'number') {
            product.dimensions.width = item.dimensions.width;
          }
          if (typeof item.dimensions.height === 'number') {
            product.dimensions.height = item.dimensions.height;
          }
        }
        
        // Validate the product
        const validation = validateProduct(product);
        products.push({
          ...product,
          validationStatus: validation.isValid ? 'valid' : 'invalid',
          validationErrors: validation.errors,
          fieldErrors: validation.fieldErrors
        });
        
      } catch (itemError) {
        errors.push({
          line: productNumber,
          message: `Product ${productNumber}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`
        });
      }
    });
    
    return {
      success: products.length > 0,
      products,
      errors
    };
  };

  const parseFile = async (file: File) => {
    setIsParsing(true);
    setParseErrors([]);
    
    try {
      const text = await file.text();
      let result: ParseResult;
      
      if (activeTab === 'csv') {
        result = parseCSVContent(text);
      } else if (activeTab === 'json') {
        result = parseJSONContent(text);
      } else {
        result = { success: false, products: [], errors: [{ message: 'Unsupported file type' }] };
      }
      
      if (result.errors.length > 0) {
        setParseErrors(result.errors);
      }
      
      if (result.products.length > 0) {
        setProducts(result.products);
        const validCount = result.products.filter(p => p.validationStatus === 'valid').length;
        toast.success(
          `Parsed ${result.products.length} products (${validCount} valid)${result.errors.length > 0 ? ` with ${result.errors.length} warnings` : ''}`,
          toastConfigSuccess
        );
      } else if (result.errors.length > 0) {
        toast.error('Failed to parse file. Check the errors below.', toastConfigError);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setParseErrors([{ message: `Failed to read file: ${errorMessage}` }]);
      toast.error('Failed to read file. Please check the format.', toastConfigError);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    const validProducts = products.filter(p => p.validationStatus === 'valid' && p.submissionStatus !== 'success');
    if (validProducts.length === 0) {
      toast.error('No valid products to create', toastConfigError);
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionProgress({
      current: 0,
      total: validProducts.length,
      successCount: 0,
      failedCount: 0,
      isComplete: false,
    });
    
    // Reset submission status for products being submitted
    setProducts(prev => prev.map(p => {
      if (validProducts.find(vp => vp.id === p.id)) {
        return { ...p, submissionStatus: 'pending', submissionError: undefined };
      }
      return p;
    }));
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/products/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products: validProducts.map(p => ({
            name: p.name,
            brand: p.brand,
            description: p.description,
            condition: p.condition,
            price: p.price,
            quantity: p.quantity,
            weight: p.weight,
            dimensions: p.dimensions,
          }))
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create products');
      }
      
      // Process results and update product statuses
      const results = data.results || [];
      let successCount = 0;
      let failedCount = 0;
      
      setProducts(prev => prev.map((p, index) => {
        const validProductIndex = validProducts.findIndex(vp => vp.id === p.id);
        if (validProductIndex === -1) return p;
        
        const result = results[validProductIndex];
        if (result?.success) {
          successCount++;
          return { ...p, submissionStatus: 'success' as const };
        } else {
          failedCount++;
          return { 
            ...p, 
            submissionStatus: 'failed' as const,
            submissionError: result?.error || 'Unknown error'
          };
        }
      }));
      
      setSubmissionProgress({
        current: validProducts.length,
        total: validProducts.length,
        successCount: data.summary?.successful || successCount,
        failedCount: data.summary?.failed || failedCount,
        isComplete: true,
      });
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      if (data.summary?.failed === 0) {
        toast.success(`Created ${data.summary?.successful || 0} products successfully!`, toastConfigSuccess);
        setTimeout(() => onClose(), 1500);
      } else {
        toast.warning(
          `Created ${data.summary?.successful || 0} of ${data.summary?.total || 0} products. ${data.summary?.failed || 0} failed.`,
          toastConfigSuccess
        );
      }
    } catch (error: any) {
      // Mark all pending products as failed
      setProducts(prev => prev.map(p => {
        if (validProducts.find(vp => vp.id === p.id) && p.submissionStatus === 'pending') {
          return { 
            ...p, 
            submissionStatus: 'failed' as const,
            submissionError: error?.message || 'Failed to create product'
          };
        }
        return p;
      }));
      
      setSubmissionProgress(prev => prev ? {
        ...prev,
        failedCount: validProducts.length,
        isComplete: true,
      } : null);
      
      toast.error(error?.message || 'Failed to create products', toastConfigError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryFailed = () => {
    // Reset failed products to allow retry
    setProducts(prev => prev.map(p => {
      if (p.submissionStatus === 'failed') {
        return { ...p, submissionStatus: undefined, submissionError: undefined };
      }
      return p;
    }));
    setSubmissionProgress(null);
  };

  const removeSuccessfulProducts = () => {
    setProducts(prev => prev.filter(p => p.submissionStatus !== 'success'));
    setSubmissionProgress(null);
  };

  const handleImport = async () => {
    try {
      let data: any;
      if (activeTab === 'shopify') {
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
      // CSV template with all required fields
      const csvHeaders = [
        'name',
        'brand', 
        'description',
        'condition',
        'category',
        'price',
        'quantity',
        'weight',
        'length',
        'width',
        'height',
        'images',
        'specifications'
      ].join(',');
      
      const csvSampleRow = [
        '"Sample Product"',
        '"Sample Brand"',
        '"Sample product description with details about the item"',
        '"new"',
        '"Electronics"',
        '99.99',
        '10',
        '1.5',
        '30',
        '20',
        '10',
        '"https://example.com/image1.jpg;https://example.com/image2.jpg"',
        '"Color:Red;Size:Large;Material:Cotton"'
      ].join(',');
      
      const csvContent = `${csvHeaders}\n${csvSampleRow}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // JSON template with all required fields
      const jsonTemplate = {
        products: [{
          name: 'Sample Product',
          brand: 'Sample Brand',
          description: 'Sample product description with details about the item',
          condition: 'new',
          category: 'Electronics',
          price: 99.99,
          quantity: 10,
          weight: 1.5,
          dimensions: {
            length: 30,
            width: 20,
            height: 10
          },
          images: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg'
          ],
          specifications: [
            { key: 'Color', value: 'Red' },
            { key: 'Size', value: 'Large' },
            { key: 'Material', value: 'Cotton' }
          ]
        }]
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

  const validCount = products.filter(p => p.validationStatus === 'valid').length;
  const invalidCount = products.filter(p => p.validationStatus === 'invalid').length;
  const pendingCount = products.filter(p => p.validationStatus === 'pending').length;
  const successfulCount = products.filter(p => p.submissionStatus === 'success').length;
  const failedSubmissionCount = products.filter(p => p.submissionStatus === 'failed').length;
  const retryableCount = products.filter(p => p.validationStatus === 'valid' && p.submissionStatus !== 'success').length;

  const getValidationIcon = (status: BulkProduct['validationStatus']) => {
    switch (status) {
      case 'valid': return <CheckCircle className="text-green-500" size={20} />;
      case 'invalid': return <XCircle className="text-red-500" size={20} />;
      default: return <AlertCircle className="text-yellow-500" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-roboto">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#002f7a] font-roboto">Bulk Product Creation</h2>
            {/* Product Count Indicator */}
            <div className="flex items-center gap-4 mt-2 text-sm font-roboto">
              <span className="flex items-center gap-1">
                <Package size={16} className="text-[#002f7a]" />
                <span className="font-medium">{products.length}</span> products
              </span>
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} /> {validCount} valid
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle size={14} /> {invalidCount} invalid
              </span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle size={14} /> {pendingCount} pending
                </span>
              )}
              {successfulCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle size={14} /> {successfulCount} created
                </span>
              )}
              {failedSubmissionCount > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <XCircle size={14} /> {failedSubmissionCount} failed
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {/* CSV Template Download Button */}
            <button
              onClick={() => downloadTemplate('csv')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-[#002f7a] border border-[#002f7a] rounded-md hover:bg-gray-200 transition-colors font-roboto text-sm"
              title="Download CSV Template"
            >
              <Download size={14} />
              CSV
            </button>
            {/* JSON Template Download Button */}
            <button
              onClick={() => downloadTemplate('json')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-[#002f7a] border border-[#002f7a] rounded-md hover:bg-gray-200 transition-colors font-roboto text-sm"
              title="Download JSON Template"
            >
              <Download size={14} />
              JSON
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-roboto"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Progress Bar Section */}
        {(isSubmitting || submissionProgress) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#002f7a] font-roboto">
                {isSubmitting ? 'Creating products...' : 'Submission Complete'}
              </span>
              {submissionProgress && (
                <span className="text-sm text-gray-600 font-roboto">
                  {submissionProgress.current} / {submissionProgress.total}
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              {isSubmitting ? (
                <div 
                  className="h-full bg-[#002f7a] rounded-full transition-all duration-300 animate-pulse"
                  style={{ width: '100%' }}
                />
              ) : submissionProgress && (
                <div className="h-full flex">
                  {submissionProgress.successCount > 0 && (
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ 
                        width: `${(submissionProgress.successCount / submissionProgress.total) * 100}%` 
                      }}
                    />
                  )}
                  {submissionProgress.failedCount > 0 && (
                    <div 
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ 
                        width: `${(submissionProgress.failedCount / submissionProgress.total) * 100}%` 
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Success/Failure Summary */}
            {submissionProgress?.isComplete && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm font-roboto">
                  {submissionProgress.successCount > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      <span className="font-medium">{submissionProgress.successCount}</span> succeeded
                    </span>
                  )}
                  {submissionProgress.failedCount > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle size={16} />
                      <span className="font-medium">{submissionProgress.failedCount}</span> failed
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {submissionProgress.failedCount > 0 && (
                    <button
                      onClick={handleRetryFailed}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 border border-orange-300 rounded-md hover:bg-orange-200 transition-colors font-roboto"
                    >
                      <RefreshCw size={14} />
                      Retry Failed ({submissionProgress.failedCount})
                    </button>
                  )}
                  {submissionProgress.successCount > 0 && submissionProgress.failedCount > 0 && (
                    <button
                      onClick={removeSuccessfulProducts}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 border border-green-300 rounded-md hover:bg-green-200 transition-colors font-roboto"
                    >
                      <CheckCircle size={14} />
                      Remove Successful
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Type Tabs */}
        <div className="flex border-b mb-6">
          {[
            { key: 'manual', label: 'Manual Entry', icon: Plus },
            { key: 'csv', label: 'CSV Upload', icon: FileText },
            { key: 'json', label: 'JSON Upload', icon: Package },
            { key: 'shopify', label: 'Shopify', icon: ShoppingCart },
            { key: 'woocommerce', label: 'WooCommerce', icon: ShoppingCart }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as ImportType)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-roboto transition-colors ${
                activeTab === key
                  ? 'border-[#002f7a] text-[#002f7a] font-medium'
                  : 'border-transparent text-gray-500 hover:text-[#002f7a]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* File Upload Section for CSV/JSON */}
        {(activeTab === 'csv' || activeTab === 'json') && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => downloadTemplate(activeTab)}
                className="flex items-center gap-2 px-4 py-2 bg-[#002f7a] text-white rounded-md hover:bg-[#002f7a]/80 transition-colors font-roboto"
              >
                <Download size={16} />
                Download {activeTab.toUpperCase()} Template
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-roboto">Upload {activeTab.toUpperCase()} File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={activeTab === 'csv' ? '.csv' : '.json'}
                onChange={handleFileSelect}
                className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2 font-roboto">
                  Selected: {selectedFile.name}
                  {isParsing && <span className="ml-2 text-[#002f7a]">Parsing...</span>}
                </p>
              )}
            </div>
            
            {/* Parsing Errors Display */}
            {parseErrors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md max-h-48 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-sm font-medium text-red-700 font-roboto">
                    {parseErrors.length} parsing {parseErrors.length === 1 ? 'issue' : 'issues'} found
                  </span>
                </div>
                <ul className="space-y-1">
                  {parseErrors.slice(0, 10).map((error, index) => (
                    <li key={index} className="text-xs text-red-600 font-roboto flex items-start gap-1">
                      <span className="text-red-400">•</span>
                      <span>
                        {error.line && <span className="font-medium">Row {error.line}: </span>}
                        {error.field && <span className="font-medium">[{error.field}] </span>}
                        {error.message}
                      </span>
                    </li>
                  ))}
                  {parseErrors.length > 10 && (
                    <li className="text-xs text-red-500 font-roboto italic">
                      ... and {parseErrors.length - 10} more issues
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Shopify Import */}
        {activeTab === 'shopify' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-roboto">Store URL</label>
              <input
                type="text"
                value={shopifyCredentials.storeUrl}
                onChange={(e) => setShopifyCredentials({ ...shopifyCredentials, storeUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                placeholder="your-store.myshopify.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-roboto">API Key</label>
              <input
                type="password"
                value={shopifyCredentials.apiKey}
                onChange={(e) => setShopifyCredentials({ ...shopifyCredentials, apiKey: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                placeholder="Your Shopify API key"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-[#002f7a] text-white rounded-md hover:bg-[#002f7a]/80 disabled:opacity-50 transition-colors font-roboto"
            >
              <Upload size={16} />
              {importMutation.isPending ? 'Importing...' : 'Import from Shopify'}
            </button>
          </div>
        )}

        {/* WooCommerce Import */}
        {activeTab === 'woocommerce' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 font-roboto">Store URL</label>
              <input
                type="text"
                value={wooCredentials.storeUrl}
                onChange={(e) => setWooCredentials({ ...wooCredentials, storeUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                placeholder="https://your-store.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-roboto">Consumer Key</label>
              <input
                type="text"
                value={wooCredentials.apiKey}
                onChange={(e) => setWooCredentials({ ...wooCredentials, apiKey: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                placeholder="Your WooCommerce consumer key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 font-roboto">Consumer Secret</label>
              <input
                type="password"
                value={wooCredentials.apiSecret}
                onChange={(e) => setWooCredentials({ ...wooCredentials, apiSecret: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                placeholder="Your WooCommerce consumer secret"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-[#002f7a] text-white rounded-md hover:bg-[#002f7a]/80 disabled:opacity-50 transition-colors font-roboto"
            >
              <Upload size={16} />
              {importMutation.isPending ? 'Importing...' : 'Import from WooCommerce'}
            </button>
          </div>
        )}

        {/* Product List - Manual Entry or Parsed Products */}
        {(activeTab === 'manual' || activeTab === 'csv' || activeTab === 'json') && (
          <div className="space-y-4 mb-6">
            {products.map((product, index) => (
              <div 
                key={product.id} 
                className={`border rounded-lg p-4 transition-colors ${
                  product.submissionStatus === 'success'
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : product.submissionStatus === 'failed'
                    ? 'border-orange-400 bg-orange-50/50'
                    : product.validationStatus === 'valid' 
                    ? 'border-green-300 bg-green-50/30' 
                    : product.validationStatus === 'invalid' 
                    ? 'border-red-300 bg-red-50/30' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-[#002f7a] font-roboto">Product {index + 1}</h3>
                    {product.submissionStatus === 'success' ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-roboto">
                        <CheckCircle size={18} className="text-emerald-500" />
                        Created
                      </span>
                    ) : product.submissionStatus === 'failed' ? (
                      <span className="flex items-center gap-1 text-orange-600 text-sm font-roboto">
                        <XCircle size={18} className="text-orange-500" />
                        Failed
                      </span>
                    ) : (
                      getValidationIcon(product.validationStatus)
                    )}
                  </div>
                  {products.length > 1 && (
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                {/* Submission Error Display */}
                {product.submissionStatus === 'failed' && product.submissionError && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={16} className="text-orange-500" />
                      <span className="text-sm font-medium text-orange-700 font-roboto">
                        Submission Failed
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 font-roboto">
                      {product.submissionError}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {product.submissionStatus === 'success' && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700 font-roboto">
                        Product created successfully!
                      </span>
                    </div>
                  </div>
                )}

                {/* Validation Summary for Invalid Products */}
                {product.validationStatus === 'invalid' && product.validationErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-sm font-medium text-red-700 font-roboto">
                        {product.validationErrors.length} validation {product.validationErrors.length === 1 ? 'error' : 'errors'}
                      </span>
                    </div>
                    <p className="text-xs text-red-600 font-roboto">
                      Please fix the highlighted fields below to proceed.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 font-roboto">Product Name *</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 font-roboto outline-none transition-colors ${
                        product.fieldErrors.name 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a]'
                      }`}
                      placeholder="Enter product name"
                    />
                    {product.fieldErrors.name && (
                      <p className="text-xs text-red-500 mt-1 font-roboto">{product.fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 font-roboto">Brand *</label>
                    <input
                      type="text"
                      value={product.brand}
                      onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 font-roboto outline-none transition-colors ${
                        product.fieldErrors.brand 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a]'
                      }`}
                      placeholder="Enter brand name"
                    />
                    {product.fieldErrors.brand && (
                      <p className="text-xs text-red-500 mt-1 font-roboto">{product.fieldErrors.brand}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 font-roboto">Condition *</label>
                    <select
                      value={product.condition}
                      onChange={(e) => updateProduct(product.id, 'condition', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 font-roboto">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={product.price || ''}
                      onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 font-roboto outline-none transition-colors ${
                        product.fieldErrors.price 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a]'
                      }`}
                      placeholder="0.00"
                    />
                    {product.fieldErrors.price && (
                      <p className="text-xs text-red-500 mt-1 font-roboto">{product.fieldErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 font-roboto">Quantity *</label>
                    <input
                      type="number"
                      value={product.quantity || ''}
                      onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 font-roboto outline-none transition-colors ${
                        product.fieldErrors.quantity 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a]'
                      }`}
                      placeholder="0"
                    />
                    {product.fieldErrors.quantity && (
                      <p className="text-xs text-red-500 mt-1 font-roboto">{product.fieldErrors.quantity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 font-roboto">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.weight || ''}
                      onChange={(e) => updateProduct(product.id, 'weight', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 font-roboto outline-none transition-colors ${
                        product.fieldErrors.weight 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a]'
                      }`}
                      placeholder="0.0"
                    />
                    {product.fieldErrors.weight && (
                      <p className="text-xs text-red-500 mt-1 font-roboto">{product.fieldErrors.weight}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium mb-1 font-roboto">Description *</label>
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 font-roboto outline-none transition-colors ${
                        product.fieldErrors.description 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a]'
                      }`}
                      rows={3}
                      placeholder="Enter product description"
                    />
                    {product.fieldErrors.description && (
                      <p className="text-xs text-red-500 mt-1 font-roboto">{product.fieldErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 font-roboto">Length (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={product.dimensions.length || ''}
                        onChange={(e) => updateProduct(product.id, 'dimensions', {
                          ...product.dimensions,
                          length: parseFloat(e.target.value) || 0
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 font-roboto">Width (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={product.dimensions.width || ''}
                        onChange={(e) => updateProduct(product.id, 'dimensions', {
                          ...product.dimensions,
                          width: parseFloat(e.target.value) || 0
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 font-roboto">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={product.dimensions.height || ''}
                        onChange={(e) => updateProduct(product.id, 'dimensions', {
                          ...product.dimensions,
                          height: parseFloat(e.target.value) || 0
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 font-roboto focus:border-[#002f7a] focus:ring-1 focus:ring-[#002f7a] outline-none"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        {(activeTab === 'manual' || activeTab === 'csv' || activeTab === 'json') && (
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={addProduct}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#002f7a] text-[#002f7a] rounded-md hover:bg-[#002f7a] hover:text-white transition-colors font-roboto"
            >
              <Plus size={16} />
              Add Another Product
            </button>

            <div className="flex items-center gap-4">
              {/* Product Count Summary */}
              <div className="text-sm text-gray-600 font-roboto">
                {successfulCount > 0 ? (
                  <>
                    <span className="font-medium text-emerald-600">{successfulCount}</span> created,{' '}
                    <span className="font-medium text-[#002f7a]">{retryableCount}</span> remaining
                  </>
                ) : (
                  <>
                    <span className="font-medium text-[#002f7a]">{validCount}</span> of{' '}
                    <span className="font-medium">{products.length}</span> products ready
                  </>
                )}
              </div>
              
              {/* Retry Failed Button */}
              {failedSubmissionCount > 0 && !isSubmitting && (
                <button
                  onClick={handleRetryFailed}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-300 rounded-md hover:bg-orange-200 transition-colors font-roboto"
                >
                  <RefreshCw size={16} />
                  Retry Failed ({failedSubmissionCount})
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || createMultipleProducts.isPending || retryableCount === 0}
                className="px-6 py-2 bg-[#002f7a] text-white rounded-md hover:bg-[#002f7a]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-roboto flex items-center gap-2"
              >
                {(isSubmitting || createMultipleProducts.isPending) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSubmitting || createMultipleProducts.isPending 
                  ? 'Creating...' 
                  : failedSubmissionCount > 0
                  ? `Retry ${retryableCount} Product${retryableCount !== 1 ? 's' : ''}`
                  : `Create ${retryableCount} Product${retryableCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
