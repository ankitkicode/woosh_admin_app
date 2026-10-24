import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Radio, Eye, Navigation, Compass } from 'lucide-react';

export interface MapRider {
  _id?: string;
  riderId?: string;
  userId?: string;
  name?: string;
  phoneNumber?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleType?: string;
  city?: string;
  isOnline?: boolean;
  onTrip?: boolean;
  currentLocation?: {
    type?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  currentTrip?: {
    rideId: string;
    status: string;
    pickup?: string;
    drop?: string;
  };
  user?: {
    _id?: string;
    name?: string;
    phoneNumber?: string;
    city?: string;
  };
}

export interface MapRide {
  _id: string;
  status: string;
  passenger?: { name?: string; phoneNumber?: string } | null;
  rider?: { name?: string; phoneNumber?: string } | null;
  pickup?: { latitude?: number; longitude?: number; address?: string };
  drop?: { latitude?: number; longitude?: number; address?: string };
  vehicleNumber?: string;
  vehicleModel?: string;
}

interface LiveFleetMapProps {
  riders?: MapRider[];
  activeRides?: MapRide[];
  height?: string;
  className?: string;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  onRiderClick?: (rider: MapRider) => void;
  selectedRiderId?: string | null;
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  jabalpur: { lat: 23.1815, lng: 79.9864 },
  gwalior: { lat: 26.2183, lng: 78.1828 },
  ujjain: { lat: 23.1765, lng: 75.7885 },
};

export const LiveFleetMap: React.FC<LiveFleetMapProps> = ({
  riders = [],
  activeRides = [],
  height = '100%',
  className = '',
  center = [23.2599, 77.4126],
  zoom = 13,
  onRiderClick,
  selectedRiderId,
}) => {
  const navigate = useNavigate();
  const [selectedRider, setSelectedRider] = useState<{ rider: MapRider; pos: { lat: number; lng: number } } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const mapCenter = useMemo(
    () => ({ lat: center[0] || 23.2599, lng: center[1] || 77.4126 }),
    [center]
  );

  // Computes precise GPS or deterministic city-centroid coordinates so no rider is hidden
  const getCoordinates = useCallback((rider: MapRider, idx: number): { lat: number; lng: number } => {
    const coords = rider.currentLocation?.coordinates;
    if (
      Array.isArray(coords) &&
      coords.length === 2 &&
      !isNaN(coords[0]) &&
      !isNaN(coords[1]) &&
      coords[0] > 0 &&
      coords[1] > 0
    ) {
      return { lat: coords[1], lng: coords[0] };
    }

    const rawCity = (rider.city || rider.user?.city || 'bhopal').toLowerCase().trim();
    const cityBase = CITY_COORDS[rawCity] || CITY_COORDS.bhopal;

    const idStr = rider.riderId || rider.userId || rider._id || idx.toString();
    const hash = idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const angle = (hash % 360) * (Math.PI / 180);
    const distance = 0.007 + ((hash % 12) * 0.002);

    return {
      lat: cityBase.lat + Math.sin(angle) * distance,
      lng: cityBase.lng + Math.cos(angle) * distance,
    };
  }, []);

  const handleSelectRider = (rider: MapRider, pos: { lat: number; lng: number }) => {
    setSelectedRider({ rider, pos });
    if (mapInstance) {
      mapInstance.panTo(pos);
    }
    if (onRiderClick) {
      onRiderClick(rider);
    }
  };

  // Auto-pan and open InfoWindow when selectedRiderId changes
  React.useEffect(() => {
    if (!selectedRiderId || riders.length === 0) return;
    const foundIdx = riders.findIndex(
      r => r.riderId === selectedRiderId || r.userId === selectedRiderId || r._id === selectedRiderId
    );
    if (foundIdx !== -1) {
      const rider = riders[foundIdx];
      const pos = getCoordinates(rider, foundIdx);
      setSelectedRider({ rider, pos });
      if (mapInstance) {
        mapInstance.panTo(pos);
        mapInstance.setZoom(14);
      }
    }
  }, [selectedRiderId, riders, getCoordinates, mapInstance]);

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.panTo(mapCenter);
      mapInstance.setZoom(zoom);
    }
  };

  if (loadError) {
    return (
      <div className={`w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 rounded-xl text-center ${className}`} style={{ height }}>
        <Radio className="w-8 h-8 text-woosh-primary mb-2 animate-pulse" />
        <h4 className="font-bold text-sm">Google Maps Telematics Notice</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          Failed to load Google Maps. Please ensure your Google Maps API key is configured and enabled in <code className="text-pink-400">.env</code>.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-1.5 bg-woosh-primary text-white text-xs font-bold rounded-lg hover:bg-woosh-primary-hover cursor-pointer"
        >
          Reload Interface
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`w-full flex flex-col items-center justify-center bg-slate-50 text-gray-500 gap-2 border border-gray-200 rounded-xl ${className}`} style={{ height }}>
        <div className="w-7 h-7 border-3 border-woosh-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-600">Connecting to Google Maps Live Fleet...</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={zoom}
        onLoad={map => setMapInstance(map)}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {/* Render Rider Pins */}
        {riders.map((rider, idx) => {
          const pos = getCoordinates(rider, idx);
          const riderKey = rider.riderId || rider.userId || rider._id || String(idx);
          const isSelected = selectedRider?.rider?.riderId === rider.riderId || selectedRiderId === riderKey;
          const isOnTrip = Boolean(rider.onTrip);

          return (
            <Marker
              key={riderKey}
              position={pos}
              title={`${rider.name || rider.user?.name || 'Rider'} · ${rider.vehicleNumber || '—'} (${isOnTrip ? 'On Trip' : 'Available'})`}
              onClick={() => handleSelectRider(rider, pos)}
              icon={
                typeof window !== 'undefined' && (window as any).google
                  ? {
                      path: (window as any).google.maps.SymbolPath.CIRCLE,
                      scale: isSelected ? 12 : 9,
                      fillColor: isOnTrip ? '#2563eb' : '#ec4899', // Blue for on-trip, Pink for available
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: isSelected ? 3 : 2,
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Selected Rider InfoWindow */}
        {selectedRider && (
          <InfoWindow
            position={selectedRider.pos}
            onCloseClick={() => setSelectedRider(null)}
          >
            <div className="p-1 min-w-[210px] text-gray-900 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedRider.rider.onTrip ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <strong className="text-sm font-bold text-gray-900">
                    {selectedRider.rider.name || selectedRider.rider.user?.name || 'Rider Partner'}
                  </strong>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedRider.rider.onTrip
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-pink-100 text-pink-700'
                  }`}
                >
                  {selectedRider.rider.onTrip ? 'In Transit' : 'Available'}
                </span>
              </div>

              <div className="space-y-1 text-gray-600 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {selectedRider.rider.vehicleNumber || '—'}
                  </span>
                </div>

                {(selectedRider.rider.vehicleModel || selectedRider.rider.vehicleType) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model:</span>
                    <span>
                      {selectedRider.rider.vehicleColor ? `${selectedRider.rider.vehicleColor} ` : ''}
                      {selectedRider.rider.vehicleModel || selectedRider.rider.vehicleType}
                    </span>
                  </div>
                )}

                {(selectedRider.rider.phoneNumber || selectedRider.rider.user?.phoneNumber) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contact:</span>
                    <span className="font-medium text-gray-800">
                      {selectedRider.rider.phoneNumber || selectedRider.rider.user?.phoneNumber}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500">Base Node:</span>
                  <span className="font-medium capitalize text-gray-800">
                    {selectedRider.rider.city || selectedRider.rider.user?.city || 'Bhopal'}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400 font-mono">
                  <span>GPS:</span>
                  <span>
                    {selectedRider.pos.lat.toFixed(4)}° N, {selectedRider.pos.lng.toFixed(4)}° E
                  </span>
                </div>

                {/* If on trip */}
                {selectedRider.rider.currentTrip && (
                  <div className="mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100 text-[11px] text-blue-900 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>Trip In Progress</span>
                      <span className="font-mono">
                        #{selectedRider.rider.currentTrip.rideId.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    {selectedRider.rider.currentTrip.pickup && (
                      <p className="truncate text-[10px]">
                        <strong>From:</strong> {selectedRider.rider.currentTrip.pickup}
                      </p>
                    )}
                    {selectedRider.rider.currentTrip.drop && (
                      <p className="truncate text-[10px]">
                        <strong>To:</strong> {selectedRider.rider.currentTrip.drop}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const rId = selectedRider.rider.riderId || selectedRider.rider.userId || selectedRider.rider._id;
                    if (rId) navigate(`/riders/${rId}`);
                  }}
                  className="flex-1 text-center py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Eye size={12} /> View Profile
                </button>

                {selectedRider.rider.currentTrip?.rideId && (
                  <button
                    onClick={() => navigate(`/rides/${selectedRider.rider.currentTrip?.rideId}`)}
                    className="flex-1 text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Navigation size={12} /> Track Trip
                  </button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Floating Recenter & Node Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={handleRecenter}
          className="bg-white/95 hover:bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md border border-gray-200 backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95"
          title="Recenter Map to Bhopal Hub"
        >
          <Compass size={14} className="text-woosh-primary animate-spin-slow" />
          Recenter Hub
        </button>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-md z-10 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 border border-white shadow-xs" />
          <span>Available ({riders.filter(r => !r.onTrip).length})</span>
        </div>
        <div className="w-px h-3 bg-gray-200" />
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shadow-xs" />
          <span>In Transit ({activeRides.length > 0 ? activeRides.length : riders.filter(r => r.onTrip).length})</span>
        </div>
      </div>
    </div>
  );
};
