import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LocationData {
  riderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export function useRideTracking(rideId?: string) {
  const [liveLocation, setLiveLocation] = useState<LocationData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!rideId) return;

    // Use environment variable or fallback to localhost
    const SOCKET_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
      : 'http://localhost:5001';

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the specific ride tracking room
      socket.emit('passenger:join_ride', { rideId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('location:update', (data: LocationData) => {
      setLiveLocation(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [rideId]);

  return { liveLocation, isConnected };
}
