"use client";

import React, { useCallback, useState } from "react";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow, OverlayView } from "@react-google-maps/api";
import { Package, MapPin, Navigation } from "lucide-react";

interface LocationWithAddress {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface TrackingMapProps {
  origin: LocationWithAddress;
  destination: LocationWithAddress;
  currentLocation: { lat: number; lng: number };
  apiKey: string;
  currentStep?: number;
  totalSteps?: number;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

export default function GoogleTrackingMap({
  origin,
  destination,
  currentLocation,
  apiKey,
  currentStep = 2,
  totalSteps = 5,
}: TrackingMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showOriginInfo, setShowOriginInfo] = useState(false);
  const [showDestInfo, setShowDestInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: origin.lat, lng: origin.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });
    bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
    map.fitBounds(bounds);
    setMap(map);
    setIsLoaded(true);
  }, [origin, destination, currentLocation]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Route path
  const routePath = [
    { lat: origin.lat, lng: origin.lng },
    { lat: currentLocation.lat, lng: currentLocation.lng },
    { lat: destination.lat, lng: destination.lng },
  ];

  // Completed path (from origin to current location)
  const completedPath = [
    { lat: origin.lat, lng: origin.lng },
    { lat: currentLocation.lat, lng: currentLocation.lng },
  ];

  // Remaining path (from current to destination)
  const remainingPath = [
    { lat: currentLocation.lat, lng: currentLocation.lng },
    { lat: destination.lat, lng: destination.lng },
  ];

  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Create marker icon URLs (using data URIs to avoid google object before load)
  const createCircleMarker = (color: string) => ({
    path: 0, // google.maps.SymbolPath.CIRCLE
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 3,
    scale: 8,
  });

  const currentLocationIcon = {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#2563EB" opacity="0.2">
          <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="20" r="8" fill="#2563EB" stroke="white" stroke-width="3"/>
      </svg>
    `),
    scaledSize: isLoaded && window.google ? new window.google.maps.Size(40, 40) : undefined,
    anchor: isLoaded && window.google ? new window.google.maps.Point(20, 20) : undefined,
  };

  return (
    <div className="w-full h-full relative">
      <LoadScript googleMapsApiKey={apiKey} loadingElement={<div>Loading...</div>}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {isLoaded && (
            <>
              {/* Remaining route (dashed gray) */}
              <Polyline
                path={remainingPath}
                options={{
                  strokeColor: "#D1D5DB",
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                  icons: [
                    {
                      icon: {
                        path: "M 0,-1 0,1",
                        strokeOpacity: 1,
                        scale: 3,
                      },
                      offset: "0",
                      repeat: "15px",
                    },
                  ],
                }}
              />

              {/* Completed route (solid blue with gradient effect) */}
              <Polyline
                path={completedPath}
                options={{
                  strokeColor: "#2563EB",
                  strokeOpacity: 1,
                  strokeWeight: 5,
                  geodesic: true,
                }}
              />

              {/* Origin Marker */}
              <Marker
                position={{ lat: origin.lat, lng: origin.lng }}
                icon={createCircleMarker("#2563EB")}
                onClick={() => setShowOriginInfo(!showOriginInfo)}
              />

              {showOriginInfo && (
                <InfoWindow
                  position={{ lat: origin.lat, lng: origin.lng }}
                  onCloseClick={() => setShowOriginInfo(false)}
                >
                  <div className="text-xs">
                    <strong>Origin</strong>
                    <br />
                    {origin.address}
                  </div>
                </InfoWindow>
              )}

              {/* Destination Marker */}
              <Marker
                position={{ lat: destination.lat, lng: destination.lng }}
                icon={createCircleMarker("#10B981")}
                onClick={() => setShowDestInfo(!showDestInfo)}
              />

              {showDestInfo && (
                <InfoWindow
                  position={{ lat: destination.lat, lng: destination.lng }}
                  onCloseClick={() => setShowDestInfo(false)}
                >
                  <div className="text-xs">
                    <strong>Destination</strong>
                    <br />
                    {destination.address}
                  </div>
                </InfoWindow>
              )}

              {/* Current Location Marker (animated) */}
              <Marker
                position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                icon={currentLocationIcon}
              />

              {/* Origin Label - Aligned with marker */}
              <OverlayView
                position={{ lat: origin.lat, lng: origin.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="transform -translate-y-12 -translate-x-1/2 flex justify-center">
                  <div className="bg-white rounded-md shadow-lg px-2.5 py-1.5 inline-block">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="font-medium text-gray-900 text-[9px]">{origin.address}</span>
                    </div>
                    <div className="text-[8px] text-gray-500 text-center mt-0.5">{origin.city}, {origin.country}</div>
                  </div>
                </div>
              </OverlayView>

              {/* Destination Label - Aligned with marker */}
              <OverlayView
                position={{ lat: destination.lat, lng: destination.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="transform -translate-y-12 -translate-x-1/2 flex justify-center">
                  <div className="bg-white rounded-md shadow-lg px-2.5 py-1.5 inline-block">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="font-medium text-gray-900 text-[9px]">{destination.address}</span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                    </div>
                    <div className="text-[8px] text-gray-500 text-center mt-0.5">{destination.city}, {destination.country}</div>
                  </div>
                </div>
              </OverlayView>
            </>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
        <button
          onClick={() => map?.setZoom((map?.getZoom() || 13) + 1)}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110 pointer-events-auto"
        >
          <span className="text-gray-700 font-bold text-lg">+</span>
        </button>
        <button
          onClick={() => map?.setZoom((map?.getZoom() || 13) - 1)}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110 pointer-events-auto"
        >
          <span className="text-gray-700 font-bold text-lg">−</span>
        </button>
        <button
          onClick={() => {
            if (map) {
              const bounds = new window.google.maps.LatLngBounds();
              bounds.extend({ lat: origin.lat, lng: origin.lng });
              bounds.extend({ lat: destination.lat, lng: destination.lng });
              bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
              map.fitBounds(bounds);
            }
          }}
          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-110 pointer-events-auto"
        >
          <MapPin size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
