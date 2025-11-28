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
  console.log("Product details:", product);

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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-light">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200/50 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-normal text-gray-900">Product Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:scale-105"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Product Images */}
          <div className="relative">
            <img
              src={product.images?.[0] || '/placeholder.png'}
              alt={product.name}
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-1 md:mt-3 overflow-x-auto">
                {product.images.slice(1, 4).map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name} ${idx + 2}`}
                    className="w-10 h-10 md:w-16 md:h-16 object-cover rounded-lg border-1 border-white shadow-md flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2 md:space-y-4">
            <div>
              <h4 className="text-base md:text-lg font-normal text-gray-900 mb-1 md:mb-2">{product.name}</h4>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">{selectedProduct?.description}</p>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 md:p-4 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Price</p>
                  <div className="flex items-center gap-2">
                    {pricing.salePrice < pricing.price ? (
                      <>
                        <span className="text-sm md:text-base font-normal text-green-600">
                          {pricing.currency} {pricing.salePrice}
                        </span>
                        <span className="text-sm md:text-base text-gray-400 line-through">
                          {pricing.currency} {pricing.price}
                        </span>
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs ">
                          {Math.round(((pricing.price - pricing.salePrice) / pricing.price) * 100)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-sm md:text-base font-normal text-green-600">
                        {pricing.currency} {pricing.price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock</p>
                  <p className={`text-base md:text-lg font-normal ${
                    stock < 5 ? 'text-red-600' : stock < 20 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stock} units
                  </p>
                </div>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50/80 p-2 md:p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Brand</span>
                <p className="text-gray-900 text-xs md:text-sm font-semibold">{selectedProduct?.brand || 'N/A'}</p>
              </div>
              <div className="bg-gray-50/80  p-2 md:p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Condition</span>
                <p className="text-gray-900 text-xs md:text-sm font-semibold capitalize">{selectedProduct?.condition || 'N/A'}</p>
              </div>
              <div className="bg-gray-50/80 p-2 md:p-4 rounded-xl">
                <span className="text-sm text-xs md:text-sm font-medium text-gray-700">Rating</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-900 font-semibold">{selectedProduct?.rating || 0}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${
                        i < (selectedProduct?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      }`}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50/80 p-2 md:p-4 rounded-xl">
                <span className="text-sm  font-medium text-gray-700">Status</span>
                <p className={`font-semibold capitalize text-xs md:text-sm ${
                  selectedProduct?.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>{selectedProduct?.status || 'N/A'}
                </p>
              </div>
            </div>

            {/* Analytics */}
            {selectedProduct?.analytics && (
              <div className="bg-blue-50/80 p-2 md:p-4 rounded-xl">
                <h5 className="font-medium text-sm md:text-base  text-gray-900 mb-3">Product Analytics</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-sm md:text-base font-bold text-blue-600">{selectedProduct?.analytics.views}</p>
                    <p className="text-xs md:text-sm text-gray-600">Views</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;