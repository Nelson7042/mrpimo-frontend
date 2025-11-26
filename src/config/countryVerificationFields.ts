// Country-specific verification field configurations

export interface DocumentOption {
  value: string;
  label: string;
  requiresBack: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface CountryVerificationConfig {
  country: string;
  personal: {
    documents: DocumentOption[];
    additionalFields?: {
      name: string;
      label: string;
      type: 'text' | 'file' | 'select';
      required: boolean;
      options?: SelectOption[];
    }[];
  };
  business: {
    documents: DocumentOption[];
    additionalFields?: {
      name: string;
      label: string;
      type: 'text' | 'file' | 'select';
      required: boolean;
      options?: SelectOption[];
    }[];
  };
}

export const COUNTRY_VERIFICATION_FIELDS: Record<string, CountryVerificationConfig> = {
  NG: {
    country: 'Nigeria',
    personal: {
      documents: [
        { value: 'passport', label: 'International Passport', requiresBack: false },
        { value: 'drivers_license', label: "Driver's License", requiresBack: true },
        { value: 'national_id', label: 'National ID Card', requiresBack: true },
        { value: 'nin', label: 'National Identification Number (NIN)', requiresBack: false },
      ],
      additionalFields: [
        {
          name: 'bvn',
          label: 'Bank Verification Number (BVN)',
          type: 'text',
          required: false,
        },
      ],
    },
    business: {
      documents: [
        { value: 'cac_certificate', label: 'CAC Certificate of Registration', requiresBack: false },
      ],
      additionalFields: [
        {
          name: 'cacNumber',
          label: 'CAC Registration Number',
          type: 'text',
          required: true,
        },
        {
          name: 'tin',
          label: 'Tax Identification Number (TIN)',
          type: 'text',
          required: true,
        },
        {
          name: 'businessType',
          label: 'Business Type',
          type: 'select',
          required: true,
          options: [
            { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
            { value: 'single_member_llc', label: 'Single Member LLC' },
            { value: 'multi_member_llc', label: 'Multi Member LLC' },
            { value: 'private_partnership', label: 'Private Partnership' },
            { value: 'private_corporation', label: 'Private Corporation' },
            { value: 'unincorporated_association', label: 'Unincorporated Association' },
            { value: 'incorporated_non_profit', label: 'Incorporated Non-Profit' },
          ],
        },
      ],
    },
  },
  US: {
    country: 'United States',
    personal: {
      documents: [
        { value: 'ssn', label: 'Social Security Number', requiresBack: false },
        { value: 'drivers_license', label: "Driver's License", requiresBack: true },
        { value: 'passport', label: 'Passport', requiresBack: false },
      ],
    },
    business: {
      documents: [
        { value: 'ein_letter', label: 'EIN Confirmation Letter', requiresBack: false },
      ],
      additionalFields: [
        {
          name: 'ein',
          label: 'Employer Identification Number (EIN)',
          type: 'text',
          required: true,
        },
      ],
    },
  },
};

export const getCountryConfig = (countryCode: string): CountryVerificationConfig | null => {
  return COUNTRY_VERIFICATION_FIELDS[countryCode] || null;
};
