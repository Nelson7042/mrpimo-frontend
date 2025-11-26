import React from 'react';
import { X } from 'lucide-react';
import { useFetchProductById } from '@/hooks/queries';

interface ProductModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
}

const ProductModal = ({ isOpen, product, onClose }: ProductModalProps) => {
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  
  const {data: fetchedProduct} = useFetchProductById(product?._id);

  React.useEffect(() => {
    if (fetchedProduct) {
      setSelectedProduct(fetchedProduct.product);
    }
  }, [fetchedProduct]);

  if (!isOpen || !product) return null;

  // Get pricing from variants using displayPrice and displayCurrency
  const getPrice = () => {
    if (selectedProduct?.variants?.length > 0) {
      const option = selectedProduct.variants[0]?.options?.[0];
      if (option) {
        return {
          price: option.displayPrice || option.price,
          salePrice: option.displayPrice || option.salePrice,
          currency: option.displayCurrency || product.country?.currency || 'NGN'
        };
      }
    }
    return {
      price: product.inventory?.listing?.instant?.price || 0,
      salePrice: product.inventory?.listing?.instant?.salePrice || 0,
      currency: product.country?.currency || 'NGN'
    };
  };

  const getStock = () => {
    if (product.variants?.length > 0) {
      return product.variants[0]?.options?.[0]?.quantity || 0;
    }
    return product.inventory?.listing?.instant?.quantity || 0;
  };

  const pricing = getPrice();
  const stock = getStock();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200/50 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:scale-105"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Product Images */}
          <div className="relative">
            <img
              src={product.images?.[0] || '/placeholder.png'}
              alt={product.name}
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h4>
              <p className="text-gray-600 leading-relaxed">{selectedProduct?.description}</p>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <div className="flex items-center gap-2">
                    {pricing.salePrice < pricing.price ? (
                      <>
                        <span className="text-2xl font-bold text-green-600">
                          {pricing.currency} {pricing.salePrice}
                        </span>
                        <span className="text-lg text-gray-400 line-through">
                          {pricing.currency} {pricing.price}
                        </span>
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                          {Math.round(((pricing.price - pricing.salePrice) / pricing.price) * 100)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-green-600">
                        {pricing.currency} {pricing.price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock</p>
                  <p className={`text-lg font-semibold ${
                    stock < 5 ? 'text-red-600' : stock < 20 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stock} units
                  </p>
                </div>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50/80 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Brand</span>
                <p className="text-gray-900 font-semibold">{selectedProduct?.brand || 'N/A'}</p>
              </div>
              <div className="bg-gray-50/80 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Condition</span>
                <p className="text-gray-900 font-semibold capitalize">{selectedProduct?.condition || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;