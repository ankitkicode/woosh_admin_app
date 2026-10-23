import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Car,
  MapPin,
  Radio,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Phone,
  CheckCircle2,
  Eye,
  ChevronRight,
  Activity
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../../../common/utils/apiClient';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';

interface FleetRider {
  riderId: string;
  userId: string;
  name: string;
  phoneNumber: string;
  city: string;
  vehicleNumber: string;
  vehicleModel?: string;
  currentLocation?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  isOnline: boolean;
  onTrip: boolean;
  currentTrip?: {
    rideId: string;
    status: string;
    pickup?: string;
    drop?: string;
  };
}

interface LiveRide {
  _id: string;
  status: string;
  passenger?: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  rider?: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  vehicleNumber?: string;
  vehicleModel?: string;
  riderCurrentLocation?: {
    type: string;
    coordinates: [number, number];
  };
  pickup?: {
    address: string;
  };
  drop?: {
    address: string;
  };
  fare?: number;
  sosActive?: boolean;
  createdAt: string;
}

export function FleetTrackingPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'fleet' | 'live-rides'>('fleet');
  const [fleet, setFleet] = useState<FleetRider[]>([]);
  const [liveRides, setLiveRides] = useState<LiveRide[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_TRIP' | 'AVAILABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  // Socket state
  const socketRef = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeSOSTotal, setActiveSOSTotal] = useState<number>(0);

  // Load Fleet & Live Rides Data
  const loadTrackingData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Fetch Fleet Overview
      const fleetRes = await apiClient('/tracking/admin/fleet').catch(() =>
        apiClient('/admin/tracking/fleet').catch(() => apiClient('/tracking/fleet'))
      );
      const fleetData = fleetRes?.data || fleetRes;
      if (fleetData?.riders) {
        setFleet(fleetData.riders);

        // Extract unique cities
        const uniqueCities: string[] = Array.from(
          new Set(fleetData.riders.map((r: FleetRider) => r.city).filter(Boolean))
        );
        if (uniqueCities.length > 0) setCities(uniqueCities);
      }

      // 2. Fetch Live Active Rides
      const ridesRes = await apiClient('/tracking/admin/live-rides').catch(() =>
        apiClient('/admin/tracking/live-rides').catch(() => apiClient('/tracking/live-rides'))
      );
      const ridesData = ridesRes?.data || ridesRes;
      if (ridesData?.rides) {
        setLiveRides(ridesData.rides);
      }

      // 3. Check SOS count
      const sosRes = await apiClient('/admin/dashboard').catch(() => null);
      if (sosRes?.data?.activeSOS !== undefined) {
        setActiveSOSTotal(sosRes.data.activeSOS);
      }
    } catch (err) {
      console.error('Failed to load tracking radar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData(true);
  }, []);

  // Auto-refresh interval (every 8s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadTrackingData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Socket Connection for Real-time GPS movement
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5001';

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('admin:join');
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Real-time location updates emitted by riders
    socket.on('location:update', (data: any) => {
      if (!data?.riderId || !data?.latitude || !data?.longitude) return;

      setFleet(prevFleet =>
        prevFleet.map(r => {
          if (r.riderId === data.riderId || r.userId === data.riderId) {
            return {
              ...r,
              currentLocation: {
                type: 'Point',
                coordinates: [data.longitude, data.latitude],
              },
            };
          }
          return r;
        })
      );
    });

    // Real-time status changes
    socket.on('rider:status_changed', (data: any) => {
      if (!data?.riderId) return;
      setFleet(prev =>
        prev.map(r => {
          if (r.riderId === data.riderId || r.userId === data.riderId) {
            return { ...r, isOnline: data.isOnline };
          }
          return r;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Filtered Fleet
  const filteredFleet = fleet.filter(r => {
    const matchesCity = selectedCity === 'ALL' || (r.city || '').toLowerCase() === selectedCity.toLowerCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ON_TRIP' && r.onTrip) ||
      (statusFilter === 'AVAILABLE' && !r.onTrip);

    const matchesSearch =
      !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phoneNumber?.includes(searchQuery) ||
      r.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesStatus && matchesSearch;
  });

  const onTripCount = fleet.filter(f => f.onTrip).length;
  const idleCount = fleet.filter(f => !f.onTrip).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & KPIs - Woosh Theme */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-woosh-border p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-woosh-primary-light flex items-center justify-center text-woosh-primary shadow-sm">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-woosh-dark">Live Fleet GPS Radar</h1>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isSocketConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSocketConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                  }`}
                />
                {isSocketConnected ? 'Live Socket Connected' : 'Polling Active'}
              </div>
            </div>
            <p className="text-sm text-woosh-muted mt-0.5">
              Real-time monitoring of all active rider partners, live trips in transit, and emergency safety triggers.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Auto-Sync: {autoRefresh ? 'ON (8s)' : 'PAUSED'}
          </button>

          <Button
            size="sm"
            onClick={() => loadTrackingData(true)}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Radar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-woosh-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span>Online Riders</span>
            <Car className="w-4 h-4 text-woosh-primary" />
          </div>
          <div className="text-2xl font-bold text-woosh-dark mt-2">{fleet.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">Ready to accept rides</div>
        </div>

        <div className="bg-white border border-woosh-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span>In Transit (On Trip)</span>
            <Navigation className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{onTripCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">Carrying passengers</div>
        </div>

        <div className="bg-white border border-woosh-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span>Available / Idle</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{idleCount}</div>
          <div className="text-[11px] text-gray-400 mt-1">Awaiting dispatch</div>
        </div>

        <div
          onClick={() => navigate('/sos')}
          className={`border rounded-2xl p-4 shadow-sm cursor-pointer transition-all ${
            activeSOSTotal > 0
              ? 'bg-rose-50 border-rose-300 hover:border-rose-400'
              : 'bg-white border-woosh-border'
          }`}
        >
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span className={activeSOSTotal > 0 ? 'text-rose-700' : ''}>Active SOS Alerts</span>
            <ShieldAlert
              className={`w-4 h-4 ${activeSOSTotal > 0 ? 'text-rose-600 animate-bounce' : 'text-gray-400'}`}
            />
          </div>
          <div className={`text-2xl font-bold mt-2 ${activeSOSTotal > 0 ? 'text-rose-600' : 'text-woosh-dark'}`}>
            {activeSOSTotal}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            {activeSOSTotal > 0 ? 'Click to open SOS room' : 'All trips normal'}
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white border border-woosh-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-woosh-border pb-4">
          {/* Main Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'fleet'
                  ? 'bg-woosh-primary text-white shadow-sm'
                  : 'text-woosh-muted hover:text-woosh-dark'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Online Fleet ({fleet.length})
            </button>
            <button
              onClick={() => setActiveTab('live-rides')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'live-rides'
                  ? 'bg-woosh-primary text-white shadow-sm'
                  : 'text-woosh-muted hover:text-woosh-dark'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Live Trips In Transit ({liveRides.length})
            </button>
          </div>

          {/* Sub Filters for Fleet */}
          {activeTab === 'fleet' && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rider, phone, vehicle..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-woosh-border rounded-xl text-xs text-woosh-dark focus:outline-none focus:border-woosh-primary"
              >
                <option value="ALL">All Status</option>
                <option value="ON_TRIP">In Transit (On Trip)</option>
                <option value="AVAILABLE">Available / Idle</option>
              </select>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="px-3 py-1.5 bg-white border border-woosh-border rounded-xl text-xs text-woosh-dark focus:outline-none focus:border-woosh-primary"
              >
                <option value="ALL">All Cities</option>
                {cities.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: FLEET RADAR LIST */}
        {activeTab === 'fleet' && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-woosh-muted">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-woosh-primary" />
                Connecting to live fleet coordinates...
              </div>
            ) : filteredFleet.length === 0 ? (
              <div className="py-16 text-center text-woosh-muted">
                <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
                No online riders found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFleet.map(rider => {
                  const lng = rider.currentLocation?.coordinates?.[0];
                  const lat = rider.currentLocation?.coordinates?.[1];
                  const mapsUrl =
                    lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null;

                  return (
                    <div
                      key={rider.riderId || rider.userId}
                      className="bg-white hover:border-woosh-primary/40 border border-woosh-border rounded-2xl p-4 transition-all space-y-3 group shadow-sm hover:shadow-md"
                    >
                      {/* Rider Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-woosh-primary-light flex items-center justify-center font-bold text-woosh-primary shadow-sm">
                            {rider.name?.charAt(0) || 'R'}
                          </div>
                          <div>
                            <div className="font-bold text-woosh-dark text-sm group-hover:text-woosh-primary transition-colors">
                              {rider.name}
                            </div>
                            <div className="text-[11px] text-woosh-muted flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {rider.phoneNumber || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1 ${
                            rider.onTrip
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rider.onTrip ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                          />
                          {rider.onTrip ? 'In Transit' : 'Available'}
                        </span>
                      </div>

                      {/* Vehicle & City Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-[10px] text-woosh-muted uppercase font-bold">Vehicle</span>
                          <div className="font-bold text-woosh-dark text-xs mt-0.5 truncate">
                            {rider.vehicleNumber || 'Unassigned'}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {rider.vehicleModel || 'Standard'}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-woosh-muted uppercase font-bold">City / Zone</span>
                          <div className="font-bold text-woosh-dark text-xs mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-woosh-primary flex-shrink-0" />
                            {rider.city || 'Default'}
                          </div>
                        </div>
                      </div>

                      {/* Active Trip Info if On Trip */}
                      {rider.onTrip && rider.currentTrip && (
                        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-blue-800">
                            <span>ONGOING RIDE</span>
                            <span className="uppercase">{rider.currentTrip.status}</span>
                          </div>
                          <div className="text-gray-700 text-[11px] truncate">
                            📍 {rider.currentTrip.drop || rider.currentTrip.pickup || 'Trip in progress'}
                          </div>
                        </div>
                      )}

                      {/* GPS Coordinates & Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                        <div className="text-[11px] text-woosh-muted font-mono">
                          {lat && lng ? (
                            <span>
                              {lat.toFixed(4)}, {lng.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-gray-400">No GPS Signal</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-woosh-dark text-xs flex items-center gap-1 transition-colors"
                              title="Open in Google Maps"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Maps
                            </a>
                          )}

                          <button
                            onClick={() => navigate(`/riders/${rider.riderId || rider.userId}`)}
                            className="px-2 py-1 rounded-lg bg-woosh-primary/10 hover:bg-woosh-primary/20 text-woosh-primary font-semibold text-xs flex items-center gap-1 transition-colors"
                            title="Inspect Profile"
                          >
                            <Eye className="w-3 h-3" />
                            Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE ACTIVE RIDES TABLE */}
        {activeTab === 'live-rides' && (
          <div className="overflow-x-auto rounded-xl border border-woosh-border">
            <table className="w-full text-left text-xs text-woosh-dark">
              <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-woosh-muted border-b border-woosh-border">
                <tr>
                  <th className="py-3 px-4">Ride ID</th>
                  <th className="py-3 px-4">Passenger</th>
                  <th className="py-3 px-4">Driver / Vehicle</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fare</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liveRides.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-woosh-muted">
                      No active rides currently in transit.
                    </td>
                  </tr>
                ) : (
                  liveRides.map(ride => (
                    <tr key={ride._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        #{ride._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-woosh-dark">{ride.passenger?.name || 'Passenger'}</div>
                        <div className="text-[11px] text-woosh-muted">{ride.passenger?.phoneNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-woosh-dark">{ride.rider?.name || 'Assigned Driver'}</div>
                        <div className="text-[11px] text-woosh-muted">
                          {ride.vehicleNumber || ''} • {ride.rider?.phoneNumber || ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="truncate text-gray-700">
                          <span className="text-emerald-600 font-bold">From:</span> {ride.pickup?.address || 'Pickup Point'}
                        </div>
                        <div className="truncate text-gray-700">
                          <span className="text-rose-600 font-bold">To:</span> {ride.drop?.address || 'Drop Point'}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            ride.status === 'in_progress' || ride.status === 'started'
                              ? 'success'
                              : 'warning'
                          }
                          dot
                        >
                          {ride.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        ₹{ride.fare || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/rides/${ride._id}`)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-woosh-primary hover:text-white text-woosh-dark text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Track Trip</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
