
interface ITransaction {
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  date: Date;
  relatedOrder?: string;
}



export interface IWallet {
  userId: string;
  currency: string;
  balance: number;
  pending: number;
  transactions: ITransaction[];
  createdAt: Date;
}


interface Subscription {
  currentPlan: string;
  isTrial: boolean;
  startDate: Date;
  endDate?: Date;
  autoDowngradeAt?: Date;
  status: "active" | "expired" | "cancelled";
}

interface VerificationDocument {
  name: string;
  type: "ID" | "Proof of Address" | "Business Registration" | "Tax Document" | "Passport" | "BVN";
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: "pending" | "verified" | "rejected";
  remarks?: string;
}

export interface IVendor {
  _id?: string;
  userId: string;
  accountType: "personal" | "business";
  kycStatus: "pending" | "verified" | "rejected";
  verificationDocuments: VerificationDocument[];
  stripeAccountId?: string;
  stripeVerificationStatus: string;
  identityVerification?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    idNumber: string;
    idType: "passport" | "drivers_license" | "national_id" | "voters_card" | "nin";
    idFrontUrl?: string;
    idBackUrl?: string;
    verified: boolean;
  };
  businessType?: "individual" | "company";
  businessInfo?: {
    name: string;
    registrationNumber?: string;
    taxId?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
    bankCode?: string;
  };
  sellingLimits?: {
    maxProducts: number | null;
  };
  ratings?: {
    average: number;
    count: number;
  };
  analytics: {
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    productCount: number;
    featuredProducts: number;
    payoutRequests: number;
    lastPayoutRequest?: Date;
    adsCreated: number;
    lastAdCreated?: Date;
    bulkUploadsUsed: number;
    lastBulkUpload?: Date;
    analyticsViews: number;
    lastAnalyticsView?: Date;
  };
  settings: {
    autoAcceptOrders: boolean;
    minOrderAmount: number;
    shippingMethods: [
      {
        name: string;
        price: number;
        estimatedDays: number;
      }
    ];
  };
  wallet: IWallet;
  subscription: Subscription;
  warnings?: {
    type:
      | "Product Quality Issues"
      | "Late Shipping"
      | "Policy Violation"
      | "Customer Complaints"
      | "Others";
    message: string;
    createdAt: Date;
  }[];
  suspension?: {
    reason: string;
    explanation: string;
    suspendedAt: Date;
    resumesAt: Date;
    enforcedBy: string;
  };
  status: "pending" | "active" | "suspended";
  createdAt?: Date;
  updatedAt?: Date;
}
