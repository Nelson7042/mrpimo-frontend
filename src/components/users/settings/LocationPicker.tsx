"use client";

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentLocation, isGeolocationSupported } from "@/utils/geolocation.util";
import { useUpdateUserLocation, useFindNearestStation } from "@/hooks/useLocation";

interface LocationPickerProps {
  addressId: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  hasExactLocation?: boolean;
  onLocationUpdated?: () => void;
}

export default function LocationPicker({
  addressId,
  currentLocation,
  hasExactLocation,
  onLocationUpdated,
}: LocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(currentLocation || null);
  const [nearestStation, setNearestStation] = useState<any>(null);

  const updateLocationMutation = useUpdateUserLocation();
  const findStationMutation = useFindNearestStation();

  const handleGetCurrentLocation = async () => {
    if (!isGeolocationSupported()) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setTempLocation(location);

      // Find nearest GIGL station
      const stationResult = await findStationMutation.mutateAsync(location);
      if (stationResult.success) {
        setNearestStation(stationResult.station);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleConfirmLocation = () => {
    if (!tempLocation) return;

    updateLocationMutation.mutate(
      {
        addressId,
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      },
      {
        onSuccess: () => {
          onLocationUpdated?.();
        },
      }
    );
  };

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-2">
              📍 Enable Home Delivery with Exact Location
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              {hasExactLocation
                ? "✅ Exact location set - Home delivery available"
                : "Set your exact location to enable home delivery. Without it, you'll need to pick up from the nearest GIGL station."}
            </p>

            {!hasExactLocation && !tempLocation && (
              <Button
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full sm:w-auto"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Get My Current Location
                  </>
                )}
              </Button>
            )}

            {tempLocation && !hasExactLocation && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs font-medium mb-1">📍 Location Detected:</p>
                  <p className="text-xs text-gray-600">
                    Lat: {tempLocation.latitude.toFixed(6)}, Lng:{" "}
                    {tempLocation.longitude.toFixed(6)}
                  </p>
                  {nearestStation && (
                    <p className="text-xs text-green-600 mt-2">
                      ✅ Nearest GIGL Station: {nearestStation.StationName}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleConfirmLocation}
                    disabled={updateLocationMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {updateLocationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        This is My Exact Location
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {hasExactLocation && (
              <div className="bg-green-100 border border-green-300 rounded p-3">
                <p className="text-xs text-green-800 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Home delivery enabled for this address
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  className="mt-2 text-xs"
                >
                  Update Location
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
