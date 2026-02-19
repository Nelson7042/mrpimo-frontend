/**
 * Fetch wrapper for public API endpoints that don't require authentication.
 * This wrapper ensures cookies are sent with requests, which is necessary for:
 * - Currency preference persistence (set by backend based on IP geolocation)
 * - Language preference persistence
 * - Other session-related preferences
 * 
 * Without credentials: "include", the browser won't send or store cookies,
 * causing the backend to re-determine preferences on every request.
 */
export const fetchPublic = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
};
