interface Subscription {
  currentPlan: string;
  isTrial: boolean;
  startDate: Date;
  endDate?: Date;
  autoDowngradeAt?: Date;
  status: 'active' | 'expired' | 'cancelled';
}

interface VerificationDocument {
  name: string;
  type: 'ID' | 'Proof of Address' | 'Business Registration' | 'Tax Document' | 'Passport' | 'BVN' | 'Bank Statement';
  url: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  status: 'pending' | 'verified' | 'rejected';
  remarks?: string;
  documentNumber?: string;
  expiryDate?: Date;
}

export interface IVendor {
  _id?: string;
  userId?: string;
  registrationEmail?: string;
  accountType: 'personal' | 'business';
  kycStatus: 'pending' | 'verified' | 'rejected' | 'requires_review';
  kycScore?: string | null;
  kybStatus?: 'pending' | 'verified' | 'rejected' | 'requires_review' | null;
  kybStatusIsVerified?: boolean | null;
  kybScore?: string | null;
  kybRejectionReason?: string | null;
  verificationDocuments: VerificationDocument[];
  stripeAccountId?: string;
  stripeVerificationStatus: string;
  payStack?: {
    paystackSubAccountCode?: string;
    paystackVerificationStatus?: string;
    paystackAccountName?: string;
    paystackBankCode?: string;
    paystackBankName?: string;
    paystackRecipientCode?: string;
    paystackStatus?: 'pending' | 'verified' | 'rejected';
  };
  identityVerification?: {
    documentType?: 'passport' | 'drivers_license' | 'national_id' | 'voters_card' | 'nin';
    documentNumber?: string;
    bvn?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: string;
    email?: string;
    phoneNumber?: string;
    verified?: boolean;
    voterCardType?: 'old_voter_card' | 'new_voter_card';
    civIdType?: 'national_id' | 'old_national_id';
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      houseNumber?: string;
      street?: string;
      city?: string;
      postalCode?: string;
      state?: string;
      countryCode?: string;
    };
    // Legacy fields
    idNumber?: string;
    idType?: 'passport' | 'drivers_license' | 'national_id' | 'voters_card' | 'nin';
    idFrontUrl?: string;
    idBackUrl?: string;
  };
  businessType?: 'individual' | 'company';
  businessInfo?: {
    name: string;
    registrationNumber?: string;
    shippingZone?: string;
    taxId?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    location?: {
      type: 'Point';
      coordinates: [number, number];
      hasExactLocation?: boolean;
    };
  };
  bankDetails?: {
    accountHolder: string;
    accountNumber?: string;
    bankName: string;
    bankCode?: string;
    routingNumber?: string;
    sortCode?: string;
    bsb?: string;
    institutionNumber?: string;
    transitNumber?: string;
    iban?: string;
    swiftBic?: string;
    bankStatementUrl?: string;
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
    spentAdsCredit: number;
    collectionProducts: number;
    activeCollectionProducts: number;
    payoutRequests: number;
    lastPayoutRequest?: Date;
    adsCreated: number;
    lastAdCreated?: Date;
    bulkUploadsUsed: number;
    lastBulkUpload?: Date;
    analyticsViews: number;
    lastAnalyticsView?: Date;
    totalFulfilledOrders: number;
    lastOrderFulfilled?: Date;
  };
  settings: {
    autoAcceptOrders: boolean;
    minOrderAmount: number;
    shippingMethods: Array<{
      name: string;
      price: number;
      estimatedDays: number;
    }>;
  };
  wallet: {
    balance: number;
    pending: number;
  };
  subscription: Subscription;
  warnings?: Array<{
    type:
      | 'Product Quality Issues'
      | 'Late Shipping'
      | 'Policy Violation'
      | 'Customer Complaints'
      | 'Others';
    message: string;
    createdAt: Date;
  }>;
  suspension?: {
    reason: string;
    explanation: string;
    suspendedAt: Date;
    resumesAt: Date;
    enforcedBy: string;
  };
  fulfillmentStrikes?: {
    orderId: string;
    reason: string;
    issuedAt: Date;
    expiresAt: Date;
  }[];
  fulfillmentSuspension?: {
    suspendedAt: Date;
    resumesAt: Date;
    reason: string;
  };
  notificationPreferences?: {
    newOrder: boolean;
    orderStatusChange: boolean;
    payoutProcessed: boolean;
    lowStockAlert: boolean;
    disputeNotification: boolean;
  };
  status: 'pending' | 'active' | 'suspended';
  agreeToTerms?: boolean;
  termsAgreedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
