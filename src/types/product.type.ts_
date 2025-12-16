type ListingType = "instant" | "auction";

export type PopulatedCategory = {
  _id: string;
  name: string;
  slug: string;
};

type CategoryType = {
  main: PopulatedCategory;
  sub?: string[] | any;
  path?: string[];
};

type InventoryType = {
  sku?: string;
  lowStockAlert?: number;
  listing: {
    type: ListingType;
    instant?: {
      acceptOffer?: boolean;
      price?: number;
      // salePrice?: number;
      quantity?: number;
    };
    auction?: {
      startBidPrice?: number;
      reservePrice?: number;
      buyNowPrice?: number;
      startTime?: string;
      endTime?: string;
      quantity?: number;
      bidIncrement?: number;
      isStarted?: boolean;
      isExpired?: boolean;
      reservePriceMet?: boolean;
      priorityScore?: number;
      relistCount?: number;
    };
  };
};



type CountryType = {
  _id: string;
  name: string;
  currency: string;
};

type VariantOptionType = {
  id: string;
  isDefault: boolean;
  sku: string;
  value: string;
  price: number;
  salePrice?: number;
  displayPrice?: number;
  currencySymbol?: string;
  quantity: number;
  _id: string;
};




export type VariantType = {
  id: string;
  isDefault: boolean;
  name: string;
  options: VariantOptionType[];
  _id: string;
};

type ReviewType = {
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

type BidType = {
  userId: string;
  maxAmount: number;
  currentAmount: number;
  createdAt: Date;
  isWinning?: boolean;
};

type OfferType = {
  userId: string;
  userOffers: { amount: number; accepted: boolean; createdAt: Date }[];
  counterOffers: { amount: number; accepted: boolean; createdAt: Date }[];
};

type AnalyticsType = {
  views: number;
  purchases: number;
  conversionRate: number;
  addToCart: number;
  wishlist: number;
};

type SpecificationType = {
  _id: string;
  key: string;
  value: string;
};

type ShippingType = {
  weight: number;
  unit: "kg" | "lbs";
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  restrictions?: (
    | "hazardous"
    | "fragile"
    | "perishable"
    | "oversized"
    | "none"
  )[];
};

export type ProductType = {
  _id?: string;
  slug?: string;
  vendorId?: string;
  name?: string;
  brand?: string;
  description?: string;
  condition?: "new" | "used" | "refurbished";
  conditionDescription?: string;
  category?: CategoryType;
  country?: string | CountryType;
  inventory?: InventoryType;
  images?: string[];
  specifications?: SpecificationType[];
  shipping?: ShippingType;
  status?: "active" | "inactive" | "outOfStock";
  reviews?: ReviewType[];
  rating?: number;
  variants?: VariantType[];
  analytics?: AnalyticsType;
  offers?: OfferType[];
  bids?: BidType[];
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  price?: string;
  priceInfo?: {
    originalPrice: number;
    displayPrice: number;
    currencySymbol: string;
    displayCurrency: string;
  };
};

export type ProductProps = {
  _id: string;
  vendorId: {
    _id: string;
  };
  name: string;
  brand: string;
  description: string;
  condition: "new" | "used";
  conditionDescription: string;
  category: {
    _id: string;
    path: string[];
    main: Category;
    sub: Category[];
  };
  country: string;
  inventory: {
    lowStockAlert: number;
    sku: string;
    listing: {
      type: "instant" | "auction";
      instant: {
        acceptOffer: boolean;
        price: number;
        salePrice: number;
        quantity: number;
      };
      auction: {
        quantity: number;
        bidIncrement: number;
      };
    };
  };
  images: string[];
  specifications: {
    key: string;
    value: string;
    _id: string;
  }[];
  shipping: {
    weight: number;
    unit: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    restrictions: string[];
  };
  status: "active" | "inactive";
  rating: number;
  variants: {
    name: string;
    options: {
      value: string;
      price: number;
      inventory: number;
      _id: string;
    }[];
    _id: string;
  }[];
  analytics: {
    views: number;
    purchases: number;
    conversionRate: number;
    addToCart: number;
    wishlist: number;
  };
  reviews: any[];
  offers: any[];
  bids: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  slug: string;
};

export interface Category {
  _id: string;
  name: string;
  description: string;
  parent: string | null;
  level: number;
  path: string[];
  attributes: ProductAttribute[];
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  __v: number;
  image?: string;
  productDimensionsRequired: boolean;
}

// Product Types based on your sample data
export interface ProductAttribute {
  _id: string;
  name: string;
  type: "text" | "number" | "select";
  required: boolean;
  options: string[];
}

export interface ProductCategory {
  main: Category;
  sub: Category[];
  path: string[];
  _id: string;
}

export interface ProductInventory {
  lowStockAlert: number;
  listing: {
    type: "instant" | "auction";
    instant: {
      acceptOffer: boolean;
      price: number;
      salePrice: number;
      quantity: number;
    };
    auction: {
      quantity: number;
      bidIncrement: number;
    };
  };
  sku: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
  _id: string;
}

export interface ProductShipping {
  weight: number;
  unit: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  restrictions: string[];
}

export interface ProductVariantOption {
  value: string;
  price: number;
  inventory: number;
  _id: string;
}

export interface ProductVariant {
  name: string;
  options: ProductVariantOption[];
  _id: string;
}

export interface ProductAnalytics {
  views: number;
  purchases: number;
  conversionRate: number;
  addToCart: number;
  wishlist: number;
}


// Cart specific types
export interface CartItem {
  product: ProductType;
  quantity: number;
  selectedVariant?: {
    variantId: string;
    optionId: string;
    variantName: string;
    optionValue: string;
    price: number;
  };
  addedAt: string;
  priceInfo?: {
    currencySymbol: string;
    displayCurrency: string;
    displayPrice: number;
    exchangeRate: number;
    originalPrice: number;
    originalCurrency: string;
  }
}

export interface CartSummary {
  subtotal: number;
  total: number;
  totalItems: number;
  totalQuantity: number;
  validationData?: any;
}
