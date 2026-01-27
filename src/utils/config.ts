// API URL with version prefix - primary configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mprimo-production.up.railway.app/api/v1";

// Base URL for the backend server (derived from API_BASE_URL)
export const BASE_URL = API_BASE_URL.replace('/api/v1', '');

// Socket URL (same as base URL)
export const SOCKET_URL = BASE_URL;

export const getApiUrl = (endpoint: string) => API_BASE_URL + endpoint;

export const AllProduct = getApiUrl("/products");
export const AProduct = getApiUrl("/products/");
export const AProductBySlug = getApiUrl("/products/slug/");

