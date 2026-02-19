/**
 * Geolocation utilities for GIGL shipping integration
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface IPLocationData {
  city: string;
  region: string;
  country: string;
  country_code: string;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ip: string;
}

export interface LocationData {
  coordinates?: Coordinates;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    formattedAddress?: string;
  };
  source: 'gps' | 'ip';
}

/**
 * Get user's IP-based location
 */
export const getIPLocation = async (): Promise<IPLocationData> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch IP location');
    }
    const data = await response.json();
    return {
      city: data.city || '',
      region: data.region || '',
      country: data.country_name || '',
      country_code: data.country_code || '',
      postal: data.postal || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || '',
      ip: data.ip || '',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Reverse geocode coordinates to address using Google Maps API
 */
export const reverseGeocode = async (coordinates: Coordinates): Promise<{
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(data.error_message || 'No address found');
    }

    const result = data.results[0];
    const components = result.address_components;

    const getComponent = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name || '';

    return {
      street: getComponent('route') || getComponent('sublocality'),
      city: getComponent('locality') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      country: getComponent('country'),
      postalCode: getComponent('postal_code'),
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Get comprehensive location data with fallbacks
 * Uses GPS + Google Maps reverse geocoding
 */
export const getLocationWithFallback = async (): Promise<LocationData | null> => {
  try {
    const coordinates = await getCurrentLocation();
    
    try {
      const address = await reverseGeocode(coordinates);
      
      return {
        coordinates,
        address,
        source: 'gps',
      };
    } catch (geocodeError) {
      return {
        coordinates,
        source: 'gps',
      };
    }
  } catch (gpsError) {
    return null;
  }
};

/**
 * Check if geolocation is supported
 */
export const isGeolocationSupported = (): boolean => {
  return 'geolocation' in navigator;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
