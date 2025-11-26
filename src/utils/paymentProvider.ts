// Country name to ISO code mapping
const countryNameToISO: Record<string, string> = {
  'United States': 'US',
  'Canada': 'CA',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Austria': 'AT',
  'Switzerland': 'CH',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Nigeria': 'NG',
  'Ghana': 'GH',
  'South Africa': 'ZA',
  'Kenya': 'KE',
  'Uganda': 'UG',
  'Tanzania': 'TZ',
  'Rwanda': 'RW',
  'Ivory Coast': 'CI',
  'Senegal': 'SN',
  'China': 'CN',
  'Hong Kong': 'HK',
  'Taiwan': 'TW'
};

export function getPaymentProvider(countryName: string): 'paystack' | 'stripe' | 'alipay' {
  const countryCode = countryNameToISO[countryName];
  
  const africanCountries = ['NG', 'GH', 'ZA', 'KE', 'UG', 'TZ', 'RW', 'CI', 'SN'];
  const stripeCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI'];
  const chinaCountries = ['CN', 'HK', 'TW'];
  
  if (africanCountries.includes(countryCode)) return 'paystack';
  if (chinaCountries.includes(countryCode)) return 'alipay';
  return 'stripe';
}

export function getAvailablePaymentMethods(countryName: string): ('card' | 'bank_transfer' | 'mobile_money')[] {
  const provider = getPaymentProvider(countryName);
  
  switch (provider) {
    case 'paystack':
      return ['card', 'bank_transfer', 'mobile_money'];
    case 'stripe':
      return ['card', 'bank_transfer'];
    case 'alipay':
      return ['card'];
    default:
      return ['card'];
  }
}