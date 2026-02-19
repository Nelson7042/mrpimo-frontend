/**
 * Convert address to coordinates for GIGL shipping
 */

export interface AddressCoordinates {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Geocode address to get coordinates using Google Maps API
 */
export const getCoordinatesFromAddress = async (address: {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}): Promise<AddressCoordinates> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Build address string
    const addressString = [
      address.street,
      address.city,
      address.state,
      address.country,
      address.postalCode
    ].filter(Boolean).join(', ');

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(data.error_message || 'Address not found');
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('Address geocoding failed:', error);
    throw error;
  }
};
