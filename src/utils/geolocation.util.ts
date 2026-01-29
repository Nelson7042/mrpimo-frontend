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
  ipLocation?: IPLocationData;
  source: 'gps' | 'ip';
}

/**
 * Get location from IP address using ipapi.co
 */
export const getIPLocation = async (): Promise<IPLocationData> => {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IP location');
    }

    const data = await response.json();
    
    // Check if we got an error response
    if (data.error) {
      throw new Error(data.reason || 'IP location service error');
    }

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
    console.warn('IP location fetch failed:', error);
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
 * Tries GPS first, falls back to IP geolocation
 */
export const getLocationWithFallback = async (): Promise<LocationData | null> => {
  // Try GPS first
  try {
    console.log('📍 Attempting GPS location...');
    const coordinates = await getCurrentLocation();
    console.log('✅ GPS location successful:', coordinates);
    
    return {
      coordinates,
      source: 'gps',
    };
  } catch (gpsError) {
    console.warn('⚠️ GPS failed:', gpsError);
    
    // Fallback to IP geolocation
    try {
      console.log('📍 Attempting IP geolocation...');
      const ipLocation = await getIPLocation();
      console.log('✅ IP geolocation successful:', ipLocation);
      
      return {
        coordinates: {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
        },
        ipLocation,
        source: 'ip',
      };
    } catch (ipError) {
      console.warn('⚠️ IP geolocation failed:', ipError);
      
      // Both methods failed
      console.log('❌ All location methods failed');
      return null;
    }
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
