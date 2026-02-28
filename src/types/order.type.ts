export interface IVendorAddress {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

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
    optionId?: string;
    quantity: number;
    price: number;
  }>;
  origin: {
    vendor?: {
      id: string;
      name: string;
      address: IVendorAddress;
    };
    vendorLocation?: {
      address: IVendorAddress;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    warehouseId?: string;
  };
  shipping: {
    carrier: string;
    service: 'standard' | 'express' | 'overnight';
    trackingNumber?: string;
    waybill?: string;
    status: 'pending' | 'processing' | 'preparingOrder' | 'sentToWarehouse' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'awaiting_pickup' | 'awaiting_vendor_dropoff';
    estimatedPickup?: string;
    actualPickup?: string;
    estimatedDelivery: string;
    actualDelivery?: string;
    dropoffDeadline?: string;
    fulfillmentMethod?: 'dropoff' | 'pickup';
    tempCode?: string;
    vendorPickupCost?: number;
    dropoffPrice?: number;
    pickupPrice?: number;
    experienceCentre?: {
      id: number;
      name: string;
      address: string;
    };
    cost: {
      amount: number;
      currency: string;
    };
    customs?: {
      declarationNumber?: string;
      dutyPaid: boolean;
      customsStatus: 'pending' | 'cleared' | 'held';
    };
    gigLogistics?: {
      senderStationId?: number;
      receiverStationId?: number;
      serviceCenterId?: number;
      pricingDetails?: any;
    };
  };
  deliveryAddress?: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IConfirmationEntry {
  role: 'buyer' | 'courier' | 'system';
  confirmedAt: Date;
}

export interface IReceivedItem {
  productId: string;
  variantId?: string;
  optionId?: string;
  vendorId: string;
  receivedAt?: Date;
  receivedBy?: string;
}

export interface IRejectedItem {
  productId: string;
  variantId?: string;
  optionId?: string;
  vendorId: string;
  reason: string;
  explanation: string;
  rejectedAt?: Date;
  rejectedBy?: string;
}

export interface IOrderConversionRates {
  userToUsd: number;
  usdToUser: number;
  vendorRates: {
    [vendorId: string]: {
      currency: string;
      toUsd: number;
      fromUsd: number;
      toUserCurrency: number;
      fromUserCurrency: number;
    };
  };
  userCurrency: string;
  capturedAt: Date;
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
    optionId?: string;
    quantity: number;
    price: number;
    vendorPrice: number;
    deliveryAddress?: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    metadata?: {
      userCurrency: string;
      amountPaidByUser: number;
      conversionRate: number;
      vendorId?: string;
      vendorName?: string;
      amountInVendorCurrency?: number;
      amountInUserCurrency?: number;
      vendorCurrency?: string;
      platformFee?: number;
      paymentId?: string;
    };
  }>;
  paymentId: {
    _id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
  };
  shipments: IClientShipment[];
  conversionRates?: IOrderConversionRates;
  deliveryCoordination: {
    estimatedDeliveryRange: {
      earliest: string;
      latest: string;
    };
    consolidatedDelivery: boolean;
    deliveryInstructions?: string;
  };
  status: 'pending' | 'pending_payment' | 'payment_failed' | 'processing' | 'partially_shipped' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  cancellationReason?: string;
  cancelledAt?: string;
  confirmations?: IConfirmationEntry[];
  receivedItems?: IReceivedItem[];
  rejectedItems?: IRejectedItem[];
  deliveryMethod?: string;
  createdAt: string;
  updatedAt: string;
}
