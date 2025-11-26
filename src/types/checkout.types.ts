export interface CartValidationResponse {
  success: boolean;
  checkout: {
    items: ValidatedItem[];
    unavailableItems: UnavailableItem[];
    pricing: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
      currency: string;
    };
    paymentMethods: any[];
    userWallet: any;
    canProceed: boolean;
  };
}

export interface ValidatedItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  total: number;
  productName: string;
  productImage: string;
}

export interface UnavailableItem {
 productId: string;
  name: string;
  images: string[];
  quantity: number;
  price: number;
  reason: string;
  availableQuantity: number;
}