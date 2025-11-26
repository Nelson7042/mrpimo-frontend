const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

let cachedRates: { [key: string]: number } | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

export const getExchangeRates = async (): Promise<{ [key: string]: number }> => {
  const now = Date.now();
  
  if (cachedRates && now - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(EXCHANGE_API_URL);
    const data = await response.json();
    cachedRates = data.rates;
    lastFetch = now;
    return data.rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return cachedRates || {};
  }
};

export const convertFromUSD = async (
  amountInUSD: number,
  toCurrency: string
): Promise<number> => {
  if (toCurrency === "USD") return amountInUSD;
  
  const rates = await getExchangeRates();
  const rate = rates[toCurrency.toUpperCase()];
  return rate ? amountInUSD * rate : amountInUSD;
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    NGN: "₦",
    CAD: "C$",
    AUD: "A$",
    CNY: "¥",
    INR: "₹",
    CHF: "Fr",
    KRW: "₩",
    BRL: "R$",
    ZAR: "R",
    MXN: "$",
  };
  return symbols[currency.toUpperCase()] || currency;
};

export const getCurrencyFromTimezone = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzMap: { [key: string]: string } = {
      // Americas
      "America/New_York": "USD", "America/Chicago": "USD", "America/Denver": "USD",
      "America/Los_Angeles": "USD", "America/Phoenix": "USD", "America/Anchorage": "USD",
      "America/Toronto": "CAD", "America/Vancouver": "CAD", "America/Montreal": "CAD",
      "America/Mexico_City": "MXN", "America/Sao_Paulo": "BRL", "America/Buenos_Aires": "ARS",
      // Europe
      "Europe/London": "GBP", "Europe/Paris": "EUR", "Europe/Berlin": "EUR",
      "Europe/Madrid": "EUR", "Europe/Rome": "EUR", "Europe/Amsterdam": "EUR",
      "Europe/Brussels": "EUR", "Europe/Vienna": "EUR", "Europe/Zurich": "CHF",
      "Europe/Stockholm": "SEK", "Europe/Oslo": "NOK", "Europe/Copenhagen": "DKK",
      "Europe/Warsaw": "PLN", "Europe/Prague": "CZK", "Europe/Budapest": "HUF",
      "Europe/Moscow": "RUB", "Europe/Istanbul": "TRY",
      // Asia
      "Asia/Tokyo": "JPY", "Asia/Seoul": "KRW", "Asia/Shanghai": "CNY",
      "Asia/Hong_Kong": "HKD", "Asia/Singapore": "SGD", "Asia/Bangkok": "THB",
      "Asia/Dubai": "AED", "Asia/Kolkata": "INR", "Asia/Mumbai": "INR",
      "Asia/Jakarta": "IDR", "Asia/Manila": "PHP", "Asia/Kuala_Lumpur": "MYR",
      // Africa
      "Africa/Lagos": "NGN", "Africa/Johannesburg": "ZAR", "Africa/Cairo": "EGP",
      "Africa/Nairobi": "KES", "Africa/Accra": "GHS",
      // Oceania
      "Australia/Sydney": "AUD", "Australia/Melbourne": "AUD", "Australia/Brisbane": "AUD",
      "Pacific/Auckland": "NZD",
    };
    return tzMap[timezone] || "USD";
  } catch {
    return "USD";
  }
};
