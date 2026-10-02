import React, { useMemo, useEffect, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import type { LocationData } from '../../../common/hooks/useRideTracking';

interface RideMapProps {
  pickup: { latitude: number; longitude: number; address?: string };
  drop: { latitude: number; longitude: number; address?: string };
  liveLocation?: LocationData | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export const RideMap: React.FC<RideMapProps> = ({ pickup, drop, liveLocation }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const center = useMemo(() => ({
    lat: pickup?.latitude || 0,
    lng: pickup?.longitude || 0,
  }), [pickup]);

  // Use Directions API to draw the route between pickup and drop
  useEffect(() => {
    if (!isLoaded || !pickup?.latitude || !drop?.latitude) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: pickup.latitude, lng: pickup.longitude },
        destination: { lat: drop.latitude, lng: drop.longitude },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  }, [isLoaded, pickup, drop]);

  if (loadError) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100 text-red-500 p-4 text-center rounded-lg">Error loading Google Maps. Please check your API key.</div>;
  }

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse rounded-lg">Loading Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={13}
      center={center}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {/* Route Line */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // We will draw our own custom markers
            polylineOptions: {
              strokeColor: '#3b82f6', // blue-500
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          }}
        />
      )}

      {/* Pickup Marker */}
      {pickup?.latitude && (
        <Marker
          position={{ lat: pickup.latitude, lng: pickup.longitude }}
          label={{ text: 'P', color: 'white', fontWeight: 'bold' }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#10b981', // emerald-500
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
            scale: 12,
          }}
        />
      )}

      {/* Drop Marker */}
      {drop?.latitude && (
        <Marker
          position={{ lat: drop.latitude, lng: drop.longitude }}
          label={{ text: 'D', color: 'white', fontWeight: 'bold' }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#ef4444', // red-500
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
            scale: 12,
          }}
        />
      )}

      {/* Live Rider Marker */}
      {liveLocation && (
        <Marker
          position={{ lat: liveLocation.latitude, lng: liveLocation.longitude }}
          icon={{
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#3b82f6', // blue-500
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
            scale: 6,
            rotation: 0, // In a real app, calculate bearing based on previous location
          }}
          zIndex={100}
        />
      )}
    </GoogleMap>
  );
};
