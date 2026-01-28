"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentLocation, isGeolocationSupported } from "@/utils/geolocation.util";
import { useUpdateVendorLocation, useFindNearestStation } from "@/hooks/useLocation";
import { useVendorStore } from "@/stores/useVendorStore";

export default function VendorPickupLocation() {
  const { vendor } = useVendorStore();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nearestStation, setNearestStation] = useState<any>(null);

  const updateLocationMutation = useUpdateVendorLocation();
  const findStationMutation = useFindNearestStation();

  const hasPickupLocation = vendor?.businessInfo?.location?.hasExactLocation;
  const currentCoordinates = vendor?.businessInfo?.location?.coordinates;

  useEffect(() => {
    if (currentCoordinates && currentCoordinates.length === 2) {
      setTempLocation({
        longitude: currentCoordinates[0],
        latitude: currentCoordinates[1],
      });
    }
  }, [currentCoordinates]);

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

    updateLocationMutation.mutate({
      latitude: tempLocation.latitude,
      longitude: tempLocation.longitude,
    });
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-2">Pickup Location</h3>
      <p className="text-sm text-gray-600 mb-4">
        Set your exact pickup location for GIGL shipping. This is required to calculate accurate shipping costs.
      </p>

      {!hasPickupLocation && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-2 text-orange-800">
                  ⚠️ Pickup Location Required
                </h4>
                <p className="text-xs text-gray-700 mb-3">
                  You must set your exact pickup location before you can receive orders. This helps us calculate shipping costs accurately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={`mt-4 ${hasPickupLocation ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <MapPin className={`w-5 h-5 mt-1 ${hasPickupLocation ? 'text-green-600' : 'text-blue-600'}`} />
            <div className="flex-1">
              {hasPickupLocation ? (
                <>
                  <h4 className="font-medium text-sm mb-2 text-green-800">
                    ✅ Pickup Location Set
                  </h4>
                  <div className="bg-white p-3 rounded border mb-3">
                    <p className="text-xs font-medium mb-1">📍 Current Location:</p>
                    <p className="text-xs text-gray-600">
                      Lat: {currentCoordinates?.[1]?.toFixed(6)}, Lng: {currentCoordinates?.[0]?.toFixed(6)}
                    </p>
                    {nearestStation && (
                      <p className="text-xs text-green-600 mt-2">
                        Nearest GIGL Station: {nearestStation.StationName}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Update Pickup Location
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {!tempLocation ? (
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
                          Set Pickup Location
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-xs font-medium mb-1">📍 Location Detected:</p>
                        <p className="text-xs text-gray-600">
                          Lat: {tempLocation.latitude.toFixed(6)}, Lng: {tempLocation.longitude.toFixed(6)}
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
                              Confirm Pickup Location
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
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 p-4 bg-gray-50 rounded border">
        <h4 className="font-medium text-sm mb-2">💡 How it works:</h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>Click "Set Pickup Location" to get your current location</li>
          <li>We'll find the nearest GIGL station to your location</li>
          <li>You can choose to drop off packages at the station (free) or request pickup (₦1,000)</li>
          <li>GIGL will handle delivery from the station to your customers</li>
        </ul>
      </div>
    </div>
  );
}
