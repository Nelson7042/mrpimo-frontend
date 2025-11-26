import { useQuery } from "@tanstack/react-query";

interface CountryVerificationResponse {
  success: boolean;
  country: string;
  default_currency: string;
  supported_payment_currencies: string[];
  supported_payment_methods: string[];
  verification_fields: {
    company: {
      additional: string[];
      minimum: string[];
    };
    individual: {
      additional: string[];
      minimum: string[];
    };
  };
  supported_bank_currencies: Record<string, any>;
}

export const useCountryVerification = (country?: string) => {
  return useQuery({
    queryKey: ["country-verification", country],
    queryFn: async () => {
      const countryCode = country || 'NG'; // Default to NG if not provided
      const response = await fetch(
        `http://localhost:5800/api/v1/verification/country/${countryCode}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch country verification requirements');
      }
      return response.json();
    },
    enabled: !!country,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
