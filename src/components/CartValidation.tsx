import { UnavailableItem } from '@/types/checkout.types';
import React from 'react';



interface CartValidationProps {
  unavailableItems: UnavailableItem[];
}

export const CartValidation: React.FC<CartValidationProps> = ({ unavailableItems }) => {
  if (unavailableItems.length === 0) {
    return <div className="text-green-600">All items are available!</div>;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-red-800 font-semibold mb-4">Cart Validation Issues</h3>
      <div className="space-y-4">
        {unavailableItems.map((item) => (
          <div key={item.productId} className="flex gap-4 p-3 bg-white rounded border">
            <img 
              src={item.images[0]} 
              alt={item.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <div className="text-sm text-gray-600 mt-1">
                <p>Requested: {item.quantity} | Available: {item.availableQuantity}</p>
                <p>Price: ${(item.price / 100).toFixed(2)}</p>
                <p className="text-red-600 font-medium">{item.reason}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};