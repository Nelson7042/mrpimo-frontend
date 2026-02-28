export interface IUser {
    _id: string;
    email: string;
    password?: string;
    businessName?: string;
    profile?: {
        firstName?: string;
        middleName?: string;
        lastName?: string;
        phoneNumber?: string;
        email?: string;
        avatar?: string;
        sex?: string;
    };
    country?: string;
    addresses?: Array<{
        _id?: string;
        type: 'billing' | 'shipping';
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        isDefault: boolean;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        hasExactLocation?: boolean;
    }>;
    socialLogins?: Array<{
        provider: string;
        providerId: string;
    }>;
    role: 'user' | 'admin';
    adminRole?: string;
    permissions?: string[];
    status: 'active' | 'inactive' | 'suspended';
    canMakeSales: boolean;
    saleLimit: number;
    salesCount: number;
    preferences: {
        language?: string;
        currency?: string;
        notifications: {
            email: {
                stockAlert: boolean;
                orderStatus: boolean;
                pendingReviews: boolean;
                paymentUpdates: boolean;
                newsletter: boolean;
            };
            push?: boolean;
            sms?: boolean;
        };
        marketing?: boolean;
    };
    activity: {
        lastLogin?: Date;
        lastPurchase?: Date;
        totalOrders?: number;
        totalSpent?: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
    resetPasswordToken?: string;
    resetPasswordExpiresAt?: Date;
    verificationToken: string;
    verificationTokenExpiresAt: Date;
    isEmailVerified: boolean;
    twoFactorAuth: {
        enabled: boolean;
        secret?: string;
        tempSecret?: string;
        backupCodes?: Array<{
            code: string;
            used: boolean;
        }>;
    };
    paymentInformation?: {
        stripeCustomerId?: string;
        paystackCustomerCode?: string;
        flutterwaveCustomerKey?: string;
        defaultGateway?: 'stripe' | 'paystack' | 'flutterwave';
    };
    vendorId?: string;
}

/** @deprecated Use IUser instead */
export type User = IUser;
