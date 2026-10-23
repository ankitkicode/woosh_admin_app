import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Car,
  Radio,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Phone,
  CheckCircle2,
  Eye,
  ChevronRight,
  Activity,
  AlertTriangle,
  Calendar,
  Bike,
  Bell
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
  vehicleColor?: string;
  vehicleType?: string;
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
    _id?: string;
    name?: string;
    phoneNumber?: string;
  } | null;
  rider?: {
    _id?: string;
    name?: string;
    phoneNumber?: string;
  } | null;
  vehicleNumber?: string;
  vehicleModel?: string;
  riderCurrentLocation?: {
    type: string;
    coordinates: [number, number];
  };
  pickup?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  drop?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  fare?: number;
  sosActive?: boolean;
  createdAt: string;
}

export function FleetTrackingPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'fleet' | 'live-rides'>('live-rides');
  const [fleet, setFleet] = useState<FleetRider[]>([]);
  const [liveRides, setLiveRides] = useState<LiveRide[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Fleet
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_TRIP' | 'AVAILABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  // Filters for Live Rides
  const [ridesFilter, setRidesFilter] = useState<'ALL' | 'IN_TRANSIT' | 'SOS_RESOLVED' | 'SOS_ACTIVE'>('ALL');
  const [ridesSearch, setRidesSearch] = useState('');
  const [resolvedSosRideIds, setResolvedSosRideIds] = useState<Set<string>>(new Set());

  // Socket state
  const socketRef = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load Fleet & Live Rides Data
  const loadTrackingData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Fetch Fleet Overview
      const fleetRes = await apiClient('/tracking/admin/fleet').catch(() =>
        apiClient('/admin/tracking/fleet').catch(() => apiClient('/tracking/fleet'))
      );
      const fleetData = fleetRes?.data || fleetRes;
      const ridersList: FleetRider[] = Array.isArray(fleetData?.fleet)
        ? fleetData.fleet
        : Array.isArray(fleetData?.riders)
        ? fleetData.riders
        : [];
      setFleet(ridersList);

      // Extract unique cities
      const uniqueCities: string[] = Array.from(
        new Set(ridersList.map((r: FleetRider) => r.city).filter(Boolean))
      );
      if (uniqueCities.length > 0) setCities(uniqueCities);

      // 2. Fetch Live Active Rides
      const ridesRes = await apiClient('/tracking/admin/live-rides').catch(() =>
        apiClient('/admin/tracking/live-rides').catch(() => apiClient('/tracking/live-rides'))
      );
      const ridesData = ridesRes?.data || ridesRes;
      const ridesList: LiveRide[] = Array.isArray(ridesData?.rides) ? ridesData.rides : [];
      setLiveRides(ridesList);

      // 3. Fetch SOS alerts to detect which ones were resolved
      const sosRes = await apiClient('/admin/sos?page=1&limit=100').catch(() => null);
      const sosData = sosRes?.data || sosRes;
      const sosAlerts = sosData?.alerts || [];
      const resolvedIds = new Set<string>();
      sosAlerts.forEach((a: any) => {
        if (a.status === 'resolved' || a.status === 'false_alarm') {
          const rId = a.rideId?._id || a.rideId;
          if (rId) resolvedIds.add(rId.toString());
        }
      });
      setResolvedSosRideIds(resolvedIds);
    } catch (err) {
      console.error('Failed to load tracking radar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData(true);
  }, []);

  // Auto-refresh interval (every 10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadTrackingData(false);
    }, 10000);
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

  const idleCount = fleet.filter(f => !f.onTrip).length;

  // Segmenting Live Rides
  const inTransitRides = liveRides.filter(r =>
    ['accepted', 'rider_en_route', 'rider_arrived', 'started', 'in_progress'].includes(r.status)
  );
  const sosRides = liveRides.filter(r => r.status === 'sos_active' || r.sosActive);
  const resolvedSosRides = sosRides.filter(r => resolvedSosRideIds.has(r._id));
  const activeUnresolvedSosRides = sosRides.filter(r => !resolvedSosRideIds.has(r._id));

  // Filtered Live Rides
  const filteredLiveRides = liveRides.filter(r => {
    const isSos = r.status === 'sos_active' || r.sosActive;
    const isResolved = isSos && resolvedSosRideIds.has(r._id);
    const isActiveSos = isSos && !isResolved;

    const matchesCategory =
      ridesFilter === 'ALL' ||
      (ridesFilter === 'IN_TRANSIT' && !isSos) ||
      (ridesFilter === 'SOS_RESOLVED' && isResolved) ||
      (ridesFilter === 'SOS_ACTIVE' && isActiveSos);

    const q = ridesSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r._id.toLowerCase().includes(q) ||
      r.passenger?.name?.toLowerCase().includes(q) ||
      r.passenger?.phoneNumber?.includes(q) ||
      r.rider?.name?.toLowerCase().includes(q) ||
      r.rider?.phoneNumber?.includes(q) ||
      r.vehicleNumber?.toLowerCase().includes(q) ||
      r.pickup?.address?.toLowerCase().includes(q) ||
      r.drop?.address?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">
      {/* Top Banner & Radar Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-woosh-border p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-woosh-primary-light flex items-center justify-center text-woosh-primary shadow-sm flex-shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-woosh-dark tracking-tight">Live Fleet & Trip Radar</h1>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
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
                {isSocketConnected ? 'Live Socket Connected' : 'Auto Polling (10s)'}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-woosh-muted mt-0.5">
              Real-time telemetry of on-duty rider partners, active transit routes, and safety incident locks.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Auto-Sync: {autoRefresh ? 'Active' : 'Paused'}
          </button>

          <Button
            size="sm"
            onClick={() => loadTrackingData(true)}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Radar
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Online Fleet */}
        <div
          onClick={() => setActiveTab('fleet')}
          className="bg-white border border-woosh-border hover:border-woosh-primary/50 rounded-2xl p-4 shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span>Online Riders</span>
            <Bike className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-woosh-dark mt-2">{fleet.length}</div>
          <div className="text-[11px] text-woosh-muted mt-1">Currently on duty</div>
        </div>

        {/* Active In-Transit */}
        <div
          onClick={() => { setActiveTab('live-rides'); setRidesFilter('IN_TRANSIT'); }}
          className="bg-white border border-woosh-border hover:border-blue-400 rounded-2xl p-4 shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span>In Transit Now</span>
            <Navigation className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{inTransitRides.length}</div>
          <div className="text-[11px] text-woosh-muted mt-1">Passengers on the move</div>
        </div>

        {/* Available Riders */}
        <div
          onClick={() => { setActiveTab('fleet'); setStatusFilter('AVAILABLE'); }}
          className="bg-white border border-woosh-border hover:border-emerald-400 rounded-2xl p-4 shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span>Available / Idle</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{idleCount}</div>
          <div className="text-[11px] text-woosh-muted mt-1">Ready for ride match</div>
        </div>

        {/* SOS Safety Status */}
        <div
          onClick={() => {
            setActiveTab('live-rides');
            setRidesFilter(activeUnresolvedSosRides.length > 0 ? 'SOS_ACTIVE' : 'SOS_RESOLVED');
          }}
          className={`border rounded-2xl p-4 shadow-sm cursor-pointer transition ${
            activeUnresolvedSosRides.length > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : resolvedSosRides.length > 0
              ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
              : 'bg-white border-woosh-border hover:border-woosh-primary/50'
          }`}
        >
          <div className="flex items-center justify-between text-woosh-muted text-xs font-bold uppercase tracking-wider">
            <span className={activeUnresolvedSosRides.length > 0 ? 'text-rose-700' : resolvedSosRides.length > 0 ? 'text-emerald-700' : ''}>
              {activeUnresolvedSosRides.length > 0 ? 'Active SOS Alerts' : 'SOS Safety Status'}
            </span>
            {activeUnresolvedSosRides.length > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            ) : resolvedSosRides.length > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className={`text-2xl font-black mt-2 ${
            activeUnresolvedSosRides.length > 0 ? 'text-rose-600' : resolvedSosRides.length > 0 ? 'text-emerald-700' : 'text-woosh-dark'
          }`}>
            {activeUnresolvedSosRides.length > 0 ? `${activeUnresolvedSosRides.length} Active` : `${resolvedSosRides.length} Resolved`}
          </div>
          <div className="text-[11px] text-woosh-muted mt-1">
            {activeUnresolvedSosRides.length > 0
              ? 'Immediate dispatch required'
              : resolvedSosRides.length > 0
              ? 'All emergency alerts resolved'
              : 'Zero active alerts'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-woosh-border rounded-2xl p-5 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-woosh-border pb-4">
          <div className="flex bg-woosh-surface p-1 rounded-xl border border-woosh-border">
            <button
              onClick={() => setActiveTab('live-rides')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'live-rides'
                  ? 'bg-white text-woosh-dark shadow-xs'
                  : 'text-woosh-muted hover:text-woosh-dark'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              Live Trips In Transit ({liveRides.length})
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'fleet'
                  ? 'bg-white text-woosh-dark shadow-xs'
                  : 'text-woosh-muted hover:text-woosh-dark'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-woosh-primary" />
              Online Fleet ({fleet.length})
            </button>
          </div>

          {/* Sub Controls for Fleet */}
          {activeTab === 'fleet' && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-woosh-border rounded-xl text-xs text-woosh-dark focus:outline-none focus:border-woosh-primary font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="ON_TRIP">In Transit (On Trip)</option>
                <option value="AVAILABLE">Available / Idle</option>
              </select>

              {cities.length > 0 && (
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-woosh-border rounded-xl text-xs text-woosh-dark focus:outline-none focus:border-woosh-primary font-medium"
                >
                  <option value="ALL">All Cities</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Sub Controls for Live Rides */}
          {activeTab === 'live-rides' && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Category Filter Pills */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-semibold">
                <button
                  onClick={() => setRidesFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    ridesFilter === 'ALL' ? 'bg-white text-woosh-dark shadow-xs' : 'text-woosh-muted'
                  }`}
                >
                  All ({liveRides.length})
                </button>
                <button
                  onClick={() => setRidesFilter('IN_TRANSIT')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    ridesFilter === 'IN_TRANSIT' ? 'bg-white text-blue-700 shadow-xs' : 'text-woosh-muted'
                  }`}
                >
                  In Transit ({inTransitRides.length})
                </button>
                <button
                  onClick={() => setRidesFilter('SOS_RESOLVED')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    ridesFilter === 'SOS_RESOLVED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-woosh-muted'
                  }`}
                >
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  SOS Resolved ({resolvedSosRides.length})
                </button>
                {activeUnresolvedSosRides.length > 0 && (
                  <button
                    onClick={() => setRidesFilter('SOS_ACTIVE')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                      ridesFilter === 'SOS_ACTIVE' ? 'bg-white text-rose-700 shadow-xs' : 'text-woosh-muted'
                    }`}
                  >
                    <ShieldAlert size={12} className="text-rose-600 animate-pulse" />
                    SOS Active ({activeUnresolvedSosRides.length})
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by ID, rider, passenger..."
                  value={ridesSearch}
                  onChange={e => setRidesSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary"
                />
              </div>
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
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                  <Car className="w-6 h-6 opacity-40" />
                </div>
                <p className="font-bold text-woosh-dark text-sm">No Online Riders Found</p>
                <p className="text-xs text-woosh-muted mt-1 max-w-sm mx-auto">
                  Rider partners in Bhopal are currently offline or do not match your active filter criteria.
                </p>
                <div className="flex items-center justify-center gap-2.5 mt-4">
                  <button
                    onClick={() => navigate('/broadcasts')}
                    className="text-xs bg-woosh-primary text-white font-bold px-3.5 py-2 rounded-xl hover:bg-woosh-primary-dark transition shadow-xs flex items-center gap-1.5"
                  >
                    <Bell size={12} /> Send Online Alert
                  </button>
                  <button
                    onClick={() => navigate('/riders')}
                    className="text-xs bg-woosh-surface hover:bg-gray-100 text-woosh-dark font-bold px-3.5 py-2 rounded-xl border border-woosh-border transition"
                  >
                    Manage Riders
                  </button>
                </div>
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

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rider.onTrip
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {rider.onTrip ? 'On Trip' : 'Available'}
                        </span>
                      </div>

                      {/* Vehicle Details */}
                      <div className="bg-woosh-surface p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-woosh-dark font-mono font-bold">
                          <span>{rider.vehicleNumber}</span>
                          <span className="text-[10px] font-sans font-semibold text-woosh-muted uppercase">
                            {rider.vehicleType || 'Scooter'}
                          </span>
                        </div>
                        {rider.vehicleModel && (
                          <div className="text-[11px] text-woosh-muted">
                            {rider.vehicleColor ? `${rider.vehicleColor} · ` : ''}{rider.vehicleModel}
                          </div>
                        )}
                      </div>

                      {/* Trip Info if in transit */}
                      {rider.onTrip && rider.currentTrip && (
                        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-xs space-y-1 text-blue-900">
                          <div className="flex justify-between items-center font-bold text-[11px]">
                            <span>Active Trip In Transit</span>
                            <span className="font-mono">#{rider.currentTrip.rideId.slice(-6).toUpperCase()}</span>
                          </div>
                          {rider.currentTrip.pickup && (
                            <p className="text-[11px] truncate text-blue-800">
                              <span className="font-semibold">From:</span> {rider.currentTrip.pickup}
                            </p>
                          )}
                          {rider.currentTrip.drop && (
                            <p className="text-[11px] truncate text-blue-800">
                              <span className="font-semibold">To:</span> {rider.currentTrip.drop}
                            </p>
                          )}
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
          <div className="space-y-4">
            {/* Context Notice for SOS Flagged Rides */}
            {sosRides.length > 0 && (
              activeUnresolvedSosRides.length > 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-bold text-rose-700">
                        {activeUnresolvedSosRides.length} Active Emergency Alert(s) Pending Resolution!
                      </span>{' '}
                      Immediate response needed at the SOS emergency desk.
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/sos')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg whitespace-nowrap self-start sm:self-auto transition shadow-xs"
                  >
                    Open SOS Desk →
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-800">
                        All {resolvedSosRides.length} SOS Incident(s) are Marked Resolved at SOS Desk:
                      </span>{' '}
                      These trips retain safety audit status <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-bold">sos_active</code> in the ride database until administratively closed. There is no active danger.
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/sos')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg whitespace-nowrap self-start sm:self-auto transition shadow-xs"
                  >
                    View SOS History →
                  </button>
                </div>
              )
            )}

            <div className="overflow-x-auto rounded-xl border border-woosh-border">
              <table className="w-full text-left text-xs text-woosh-dark">
                <thead className="bg-woosh-surface text-[11px] uppercase font-bold text-woosh-muted border-b border-woosh-border">
                  <tr>
                    <th className="py-3 px-4">Ride ID & Date</th>
                    <th className="py-3 px-4">Passenger</th>
                    <th className="py-3 px-4">Driver / Vehicle</th>
                    <th className="py-3 px-4">Pickup & Drop Route</th>
                    <th className="py-3 px-4">Trip Status</th>
                    <th className="py-3 px-4 text-right">Fare</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLiveRides.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-woosh-muted">
                        No live trips found matching your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLiveRides.map(ride => {
                      const isSos = ride.status === 'sos_active' || ride.sosActive;
                      return (
                        <tr
                          key={ride._id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSos ? 'bg-red-50/20' : ''
                          }`}
                        >
                          {/* Ride ID & Date */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-woosh-primary bg-woosh-primary-light px-2 py-0.5 rounded">
                              #{ride._id.slice(-6).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-woosh-muted mt-1.5 font-medium">
                              <Calendar size={11} />
                              <span>{formatDate(ride.createdAt)}</span>
                            </div>
                          </td>

                          {/* Passenger */}
                          <td className="py-3 px-4">
                            {ride.passenger ? (
                              <>
                                <div className="font-bold text-woosh-dark">{ride.passenger.name || 'Passenger'}</div>
                                <div className="text-[11px] text-woosh-muted">{ride.passenger.phoneNumber}</div>
                              </>
                            ) : (
                              <span className="text-xs text-woosh-muted italic">Direct / Unregistered</span>
                            )}
                          </td>

                          {/* Driver / Vehicle */}
                          <td className="py-3 px-4">
                            {ride.rider ? (
                              <>
                                <div className="font-bold text-woosh-dark">{ride.rider.name}</div>
                                <div className="text-[11px] text-woosh-muted font-mono">
                                  {ride.vehicleNumber || '—'} {ride.vehicleModel ? `· ${ride.vehicleModel}` : ''}
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-woosh-muted italic">Unassigned Rider</span>
                            )}
                          </td>

                          {/* Route */}
                          <td className="py-3 px-4 max-w-[260px]">
                            <div className="truncate text-woosh-dark flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                              <span className="truncate">{ride.pickup?.address || 'Pickup Point'}</span>
                            </div>
                            <div className="truncate text-woosh-muted flex items-start gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-sm bg-rose-500 mt-1 flex-shrink-0" />
                              <span className="truncate">{ride.drop?.address || 'Drop Point'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isSos ? (
                              resolvedSosRideIds.has(ride._id) ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  ✓ SOS Resolved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                  <ShieldAlert size={12} className="text-rose-600" />
                                  SOS ACTIVE
                                </span>
                              )
                            ) : (
                              <Badge
                                variant={
                                  ride.status === 'in_progress' || ride.status === 'started'
                                    ? 'success'
                                    : 'info'
                                }
                                dot
                              >
                                {ride.status.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </td>

                          {/* Fare */}
                          <td className="py-3 px-4 font-bold text-right text-woosh-dark">
                            ₹{ride.fare || 0}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/rides/${ride._id}`)}
                                className="px-2.5 py-1.5 rounded-lg bg-woosh-surface hover:bg-woosh-primary hover:text-white text-woosh-dark text-xs font-bold inline-flex items-center gap-1 transition"
                              >
                                <span>Track Trip</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              {isSos && (
                                <button
                                  onClick={() => navigate('/sos')}
                                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition ${
                                    resolvedSosRideIds.has(ride._id)
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                      : 'bg-rose-100 hover:bg-rose-200 text-rose-800 animate-pulse'
                                  }`}
                                  title={resolvedSosRideIds.has(ride._id) ? 'Inspect Resolved SOS Log' : 'Open Emergency SOS Desk'}
                                >
                                  {resolvedSosRideIds.has(ride._id) ? 'SOS History' : 'SOS Desk'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
