/**
 * Feature flags for controlling incomplete or in-progress features.
 * 
 * These flags allow features to be toggled on/off via environment variables
 * without code changes. Set the corresponding NEXT_PUBLIC_* env var to 'true'
 * to enable a feature.
 */

/**
 * Controls visibility of crypto payment UI elements (crypto withdrawal method,
 * crypto wallet tab, etc.). The CryptoPaymentService backend remains available
 * for future use regardless of this flag.
 */
export const CRYPTO_PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_CRYPTO_PAYMENTS_ENABLED === 'true';
