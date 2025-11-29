//export const API_BASE_URL = "https://mprimo-production.up.railway.app/api/v1";


//dev
export const API_BASE_URL = `http://localhost:5800/api/v1`;

export const getApiUrl = (endpoint: string) => API_BASE_URL + endpoint;

export const AllProduct = getApiUrl("/products");
export const AProduct = getApiUrl("/products/");
export const AProductBySlug = getApiUrl("/products/slug/");

