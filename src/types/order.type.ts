export interface IClientShipment {
  _id: string;
  vendorId: {
    _id: string;
    businessInfo: {
      name: string;
      address: {
        country: string;
        city: string;
        street: string;
      };
    };
  };
  items: Array<{
    productId: {
      _id: string;
      name: string;
      images: string[];
    };
    variantId: string;
    quantity: number;
    price: number;
  }>;
  origin: {
    vendorLocation: {
      country: string;
      city: string;
      address: string;
    };
  };
  shipping: {
    carrier: string;
    service: string;
    trackingNumber?: string;
    waybill?: string;
    status: string;
    estimatedDelivery: string;
    actualDelivery?: string;
    cost: {
      amount: number;
      currency: string;
    };
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface IClientOrder {
  _id: string;
  userId: string;
  items: Array<{
    productId: {
      _id: string;
      name: string;
      images: string[];
    };
    variantId: string;
    quantity: number;
    price: number;
  }>;
  paymentId: {
    _id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
  };
  shipments: IClientShipment[];
  deliveryCoordination: {
    estimatedDeliveryRange: {
      earliest: string;
      latest: string;
    };
    consolidatedDelivery: boolean;
    deliveryInstructions?: string;
  };
  status: "pending" | "processing" | "partially_shipped" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}