export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface StripeAccountData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Address Information
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  
  // Date of Birth
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  
  // Bank Information
  accountNumber: string;
  bankCode: string;
  
  // Terms Acceptance
  acceptTerms: boolean;
}

export interface VerificationDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'voters_card';
  frontFile: File | null;
  backFile?: File | null; // For documents that have two sides
  documentNumber: string;
}

export interface BusinessVerificationData {
  businessName: string;
  businessRegistrationNumber: string;
  businessType: 'sole_proprietorship' | 'llc' | 'partnership' | 'corporation';
  registrationDocument: File | null;
  taxId?: string;
}

export type VerificationStep = 'account-creation' | 'identity-verification' | 'business-verification';