import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Users, ArrowRight, RefreshCw,
  TrendingUp, TrendingDown, Clock,
  Radio, Bell, Bike
} from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface DashboardData {
  totalPassengers: number;
  totalRiders: number;
  totalRides: number;
  activeRides: number;
  pendingKYC: number;
  openComplaints: number;
  completedRides: number;
  cancelledRides: number;
  activeSOS: number;
  onlineRidersCount: number;
  openSupportTickets: number;
  totalRevenue: number;
  onlineRiders: Array<{
    _id: string;
    user?: { _id: string; name: string; phoneNumber?: string };
    vehicleNumber: string;
    vehicleModel?: string;
    vehicleColor?: string;
    vehicleType?: string;
    rating?: number;
    currentLocation?: { coordinates: [number, number] };
  }>;
  activeRidesList: any[];
  revenueData: Array<{ name: string; revenue: number }>;
  rideVolumeData: Array<{ name: string; rides: number }>;
  trends?: {
    revenue?: number;
    activeRides?: number;
    totalRiders?: number;
    totalPassengers?: number;
  };
}

export function DashboardView() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [chartMode, setChartMode] = useState<'rides' | 'revenue'>('rides');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (manual = false) => {
    try {
      if (manual) setIsRefreshing(true);
      const res = await apiClient('/admin/dashboard').catch(() => null);
      const fetchedData: DashboardData = res?.data || res || {};
      setData(fetchedData);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-woosh-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-woosh-muted">Connecting to Woosh Command Center...</p>
        </div>
      </div>
    );
  }

  const activeRides = data.activeRides || 0;
  const totalRiders = data.totalRiders || 0;
  const onlineRidersCount = data.onlineRidersCount || 0;
  const totalPassengers = data.totalPassengers || 0;
  const openComplaints = (data.openComplaints || 0) + (data.openSupportTickets || 0);
  const pendingKYC = data.pendingKYC || 0;
  const activeSOS = data.activeSOS || 0;
  const completedRides = data.completedRides || 0;
  const cancelledRides = data.cancelledRides || 0;
  const totalRides = data.totalRides || 0;
  const totalRevenue = data.totalRevenue || 0;
  const onlineRiders = data.onlineRiders || [];
  const trends = data.trends || {};

  // Chart datasets
  const rideVolumeData = (data.rideVolumeData && data.rideVolumeData.length > 0)
    ? data.rideVolumeData
    : [
        { name: 'Sat', rides: 0 },
        { name: 'Sun', rides: 0 },
        { name: 'Mon', rides: 0 },
        { name: 'Tue', rides: 0 },
        { name: 'Wed', rides: 0 },
        { name: 'Thu', rides: 0 },
        { name: 'Fri', rides: 0 },
      ];

  const revenueData = (data.revenueData && data.revenueData.length > 0)
    ? data.revenueData
    : [
        { name: 'Sat', revenue: 0 },
        { name: 'Sun', revenue: 0 },
        { name: 'Mon', revenue: 0 },
        { name: 'Tue', revenue: 0 },
        { name: 'Wed', revenue: 0 },
        { name: 'Thu', revenue: 0 },
        { name: 'Fri', revenue: 0 },
      ];

  const totalWeeklyRides = rideVolumeData.reduce((acc, curr) => acc + (curr.rides || 0), 0);
  const totalWeeklyRevenue = revenueData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

  const chartDisplayData = chartMode === 'rides'
    ? rideVolumeData.map(d => ({ name: d.name, val: d.rides }))
    : revenueData.map(d => ({ name: d.name, val: d.revenue }));

  // Dynamic Priority Action Queue items
  const needsAttention = [];

  if (activeSOS > 0) {
    needsAttention.push({
      type: 'CRITICAL EMERGENCY',
      title: `${activeSOS} SOS Alert(s) Active`,
      desc: 'Immediate emergency dispatch & passenger contact required',
      action: 'Open SOS Radar',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      dotColor: 'bg-red-600 animate-ping',
      actionColor: 'text-red-700 bg-red-100 hover:bg-red-200',
      onClick: () => navigate('/sos'),
    });
  }

  if (pendingKYC > 0) {
    needsAttention.push({
      type: 'KYC ONBOARDING',
      title: `${pendingKYC} Rider(s) waiting for KYC Review`,
      desc: 'Identity documents submitted and pending verification',
      action: 'Review Documents',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      actionColor: 'text-amber-800 bg-amber-100 hover:bg-amber-200',
      onClick: () => navigate('/riders'),
    });
  }

  if (openComplaints > 0) {
    needsAttention.push({
      type: 'SUPPORT & DISPUTES',
      title: `${openComplaints} User dispute(s) awaiting resolution`,
      desc: 'Fare or behavior disputes waiting for admin action',
      action: 'Resolve',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
      dotColor: 'bg-orange-500',
      actionColor: 'text-orange-800 bg-orange-100 hover:bg-orange-200',
      onClick: () => navigate('/disputes'),
    });
  }

  if (activeRides > 0) {
    needsAttention.push({
      type: 'ACTIVE TRANSIT',
      title: `${activeRides} Ride(s) Currently In Transit`,
      desc: 'Passengers en route with assigned riders',
      action: 'Track Live',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500',
      actionColor: 'text-blue-800 bg-blue-100 hover:bg-blue-200',
      onClick: () => navigate('/rides?tab=active'),
    });
  }

  if (needsAttention.length === 0) {
    needsAttention.push({
      type: 'SYSTEM HEALTH',
      title: 'All Systems Operating Normally',
      desc: 'No critical alerts, pending KYC, or unresolved disputes.',
      action: 'View All Rides',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      actionColor: 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200',
      onClick: () => navigate('/rides'),
    });
  }

  const renderTrend = (val?: number) => {
    if (val === undefined || val === null) return null;
    const isPositive = val > 0;
    const isZero = val === 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded ${
        isZero ? 'bg-gray-100 text-gray-600' : isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}>
        {isPositive ? <TrendingUp size={11} /> : !isZero ? <TrendingDown size={11} /> : null}
        {isPositive ? `+${val}%` : `${val}%`}
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-8 max-w-[1440px] mx-auto">
      {/* Executive Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-woosh-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-woosh-dark tracking-tight">Operations Command Center</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-woosh-muted mt-1">
            Real-time dispatch, fleet tracking, and platform operations across <span className="font-semibold text-woosh-dark">Bhopal Hub</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lastUpdated && (
            <span className="text-xs text-woosh-muted hidden md:inline-flex items-center gap-1">
              <Clock size={12} /> Refreshed {lastUpdated}
            </span>
          )}

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-woosh-surface hover:bg-gray-100 text-woosh-dark border border-woosh-border transition shadow-sm"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-woosh-primary' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/tracking')}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-woosh-primary text-white hover:bg-woosh-primary-dark transition shadow-sm"
          >
            <Radio size={14} />
            <span>Fleet Radar</span>
          </button>
        </div>
      </div>

      {/* Critical SOS Alert Banner if Active */}
      {activeSOS > 0 && (
        <div className="bg-red-600 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-600/20 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 text-red-600 shadow">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-black tracking-widest uppercase bg-black/30 px-2 py-0.5 rounded">CRITICAL INCIDENT</span>
                <span className="bg-white text-red-700 text-xs px-2 py-0.5 rounded font-black">Priority 1</span>
              </div>
              <h2 className="text-white text-lg font-bold mt-1">{activeSOS} Active Emergency SOS Alert(s) Detected!</h2>
              <p className="text-white/90 text-xs sm:text-sm">Coordinate emergency responder dispatch and live safety audio stream.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/sos')}
            className="bg-white text-red-600 hover:bg-red-50 font-black px-5 py-2.5 rounded-xl text-sm transition shadow self-start sm:self-auto"
          >
            Open Emergency Desk →
          </button>
        </div>
      )}

      {/* Pending KYC Notice Banner
      {pendingKYC > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 font-bold">
              <FileCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">{pendingKYC} Rider onboarding application(s) awaiting verification</p>
              <p className="text-xs text-amber-700">Aadhaar, Driving License and RC book submitted and ready for approval.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/riders')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition whitespace-nowrap shadow-sm"
          >
            Review KYC →
          </button>
        </div>
      )} */}

      {/* 8 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Total Revenue */}
        {/* <div
          onClick={() => navigate('/analytics')}
          className="bg-white p-3.5 rounded-2xl border border-woosh-border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-woosh-primary/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Gross GMV</p>
            {renderTrend(trends.revenue)}
          </div>
          <div className="text-xl sm:text-2xl font-black text-woosh-dark tracking-tight">₹{totalRevenue.toLocaleString()}</div>
          <p className="text-[11px] text-woosh-muted truncate">Lifetime revenue</p>
        </div> */}

        {/* Total Rides */}
        <div
          onClick={() => navigate('/rides')}
          className="bg-white p-3.5 rounded-2xl border border-woosh-border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-woosh-primary/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Total Rides</p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">{completedRides} done</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-woosh-dark tracking-tight">{totalRides}</div>
          <p className="text-[11px] text-woosh-muted truncate">{cancelledRides} cancelled</p>
        </div>

        {/* Active Rides */}
        <div
          onClick={() => navigate('/rides?tab=active')}
          className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer transition ${
            activeRides > 0 ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400' : 'bg-white border-woosh-border hover:border-woosh-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Live Rides</p>
            {activeRides > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${activeRides > 0 ? 'text-blue-700' : 'text-woosh-dark'}`}>
            {activeRides}
          </div>
          <p className="text-[11px] text-woosh-muted truncate">In transit now</p>
        </div>

        {/* Online Riders */}
        <div
          onClick={() => navigate('/riders')}
          className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer transition ${
            onlineRidersCount > 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-woosh-border hover:border-woosh-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Online Fleet</p>
            <span className={`w-2 h-2 rounded-full ${onlineRidersCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${onlineRidersCount > 0 ? 'text-emerald-700' : 'text-woosh-dark'}`}>
            {onlineRidersCount}
          </div>
          <p className="text-[11px] text-woosh-muted truncate">of {totalRiders} riders</p>
        </div>

        {/* Total Passengers */}
        <div
          onClick={() => navigate('/passengers')}
          className="bg-white p-3.5 rounded-2xl border border-woosh-border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer hover:border-woosh-primary/50 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Passengers</p>
            {renderTrend(trends.totalPassengers)}
          </div>
          <div className="text-xl sm:text-2xl font-black text-woosh-dark tracking-tight">{totalPassengers}</div>
          <p className="text-[11px] text-woosh-muted truncate">Registered users</p>
        </div>

        {/* Pending KYC */}
        {/* <div
          onClick={() => navigate('/riders')}
          className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer transition ${
            pendingKYC > 0 ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400' : 'bg-white border-woosh-border hover:border-woosh-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">KYC Queue</p>
            {pendingKYC > 0 && <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1 rounded">Review</span>}
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${pendingKYC > 0 ? 'text-amber-700' : 'text-woosh-dark'}`}>
            {pendingKYC}
          </div>
          <p className="text-[11px] text-woosh-muted truncate">{pendingKYC > 0 ? 'Needs approval' : 'Queue cleared'}</p>
        </div> */}

        {/* Active SOS */}
        <div
          onClick={() => navigate('/sos')}
          className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer transition ${
            activeSOS > 0 ? 'bg-red-50 border-red-300 hover:border-red-400' : 'bg-white border-woosh-border hover:border-woosh-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Active SOS</p>
            <ShieldAlert size={12} className={activeSOS > 0 ? 'text-red-600' : 'text-gray-400'} />
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${activeSOS > 0 ? 'text-red-600 font-black animate-pulse' : 'text-emerald-700'}`}>
            {activeSOS}
          </div>
          <p className="text-[11px] text-woosh-muted truncate">{activeSOS > 0 ? 'Urgent action' : 'Zero emergencies'}</p>
        </div>

        {/* Open Disputes / Complaints */}
        <div
          onClick={() => navigate('/disputes')}
          className={`p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between h-[120px] cursor-pointer transition ${
            openComplaints > 0 ? 'bg-orange-50/70 border-orange-200 hover:border-orange-300' : 'bg-white border-woosh-border hover:border-woosh-primary/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-woosh-muted uppercase tracking-wider">Disputes</p>
            {openComplaints > 0 && <span className="w-2 h-2 rounded-full bg-orange-500" />}
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${openComplaints > 0 ? 'text-orange-700' : 'text-woosh-dark'}`}>
            {openComplaints}
          </div>
          <p className="text-[11px] text-woosh-muted truncate">Pending tickets</p>
        </div>
      </div>

      {/* Middle Operations Grid: Dispatch Radar + Prioritized Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Dispatch Map / Hub Visualizer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-woosh-border shadow-sm p-4 sm:p-5 flex flex-col min-h-[440px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-bold text-woosh-dark text-sm sm:text-base">Live Fleet Dispatch Map · Bhopal</h3>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {onlineRidersCount} Online
              </span>
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {activeRides} In Transit
              </span>
              <button
                onClick={() => navigate('/tracking')}
                className="text-woosh-primary hover:text-woosh-primary-dark font-bold text-xs flex items-center gap-1 ml-1"
              >
                Full Radar <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl relative overflow-hidden flex items-center justify-center border border-gray-100 min-h-[350px]">
            {loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-woosh-dark p-6 sm:p-8 flex flex-col justify-between text-white rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-woosh-primary/20 flex items-center justify-center text-woosh-primary border border-woosh-primary/30">
                      <Radio size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">Bhopal Operations Node</span>
                      <span className="text-[11px] text-gray-400">GPS Geo-fence: 23.2599° N, 77.4126° E</span>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
                    Telemetry Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto py-6">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center backdrop-blur-sm">
                    <p className="text-xs font-semibold text-gray-300">Riders on Duty</p>
                    <p className="text-3xl font-black text-emerald-400 mt-1">{onlineRidersCount}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{totalRiders} fleet riders enrolled</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center backdrop-blur-sm">
                    <p className="text-xs font-semibold text-gray-300">Trips in Motion</p>
                    <p className="text-3xl font-black text-blue-400 mt-1">{activeRides}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{totalRides} all-time bookings</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center backdrop-blur-sm">
                    <p className="text-xs font-semibold text-gray-300">Fulfilled Rides</p>
                    <p className="text-3xl font-black text-amber-400 mt-1">{completedRides}</p>
                    <p className="text-[11px] text-gray-400 mt-1">₹{totalRevenue.toLocaleString()} volume</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-gray-400">
                  <p>Real-time WebSockets telemetry and Google Maps synchronization ready.</p>
                  <button
                    onClick={() => navigate('/tracking')}
                    className="bg-woosh-primary hover:bg-woosh-primary-dark text-white font-bold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 shadow"
                  >
                    Launch Live Fleet GPS Radar <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : !isLoaded ? (
              <div className="text-woosh-muted font-medium text-sm animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-woosh-primary border-t-transparent rounded-full animate-spin" />
                Initializing Google Maps Engine...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                zoom={12}
                center={{ lat: 23.2599, lng: 77.4126 }}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                {onlineRiders.map((r: any, idx: number) => {
                  if (r.currentLocation?.coordinates) {
                    const [lng, lat] = r.currentLocation.coordinates;
                    return (
                      <Marker
                        key={r._id || idx}
                        position={{ lat, lng }}
                        title={`${r.user?.name || 'Rider'} (${r.vehicleNumber})`}
                      />
                    );
                  }
                  return null;
                })}
              </GoogleMap>
            )}
          </div>
        </div>

        {/* Right 1 Col: Prioritized Action Queue */}
        <div className="bg-white rounded-2xl border border-woosh-border shadow-sm flex flex-col min-h-[440px]">
          <div className="p-4 sm:p-5 border-b border-woosh-divider flex items-center justify-between">
            <div>
              <h3 className="font-bold text-woosh-dark text-sm sm:text-base">Operations Queue</h3>
              <p className="text-xs text-woosh-muted mt-0.5">Prioritized admin actions</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-woosh-surface text-woosh-dark border border-woosh-border">
              {needsAttention.length} Items
            </span>
          </div>

          <div className="flex-1 divide-y divide-woosh-divider overflow-y-auto max-h-[380px]">
            {needsAttention.map((item, i) => (
              <div
                key={i}
                onClick={item.onClick}
                className="p-4 hover:bg-woosh-surface/60 transition cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${item.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.badgeBg}`}>
                      {item.type}
                    </span>
                    <p className="text-sm font-bold text-woosh-dark mt-1 group-hover:text-woosh-primary transition">
                      {item.title}
                    </p>
                    <p className="text-xs text-woosh-muted mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                {item.action && (
                  <div className="mt-3 flex justify-end">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition ${item.actionColor}`}>
                      {item.action}
                      <ArrowRight size={12} />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-gray-50/70 border-t border-woosh-divider text-center rounded-b-2xl">
            <button
              onClick={() => navigate('/broadcasts')}
              className="text-xs font-bold text-woosh-primary hover:underline inline-flex items-center gap-1"
            >
              <Bell size={12} /> Send Push Broadcast to All Users →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Visual Analysis Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Panel 1: 7-Day Performance Chart (Volume vs Revenue toggle) */}
        <div className="bg-white rounded-2xl border border-woosh-border shadow-sm p-4 sm:p-5 flex flex-col justify-between min-h-[280px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-woosh-dark text-sm sm:text-base">7-Day Operations Volume</h3>
              <p className="text-xs text-woosh-muted mt-0.5">
                {chartMode === 'rides' ? `${totalWeeklyRides} Total rides recorded` : `₹${totalWeeklyRevenue.toLocaleString()} Revenue recorded`}
              </p>
            </div>

            <div className="flex items-center bg-woosh-surface rounded-lg p-0.5 border border-woosh-border text-xs">
              <button
                onClick={() => setChartMode('rides')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  chartMode === 'rides' ? 'bg-white text-woosh-dark shadow-xs' : 'text-woosh-muted hover:text-woosh-dark'
                }`}
              >
                Rides
              </button>
              <button
                onClick={() => setChartMode('revenue')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  chartMode === 'revenue' ? 'bg-white text-woosh-dark shadow-xs' : 'text-woosh-muted hover:text-woosh-dark'
                }`}
              >
                ₹ Revenue
              </button>
            </div>
          </div>

          <div className="h-[170px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDisplayData}
                margin={{ top: 10, right: 10, bottom: 0, left: -25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(219, 39, 119, 0.04)' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '10px', color: '#fff', fontSize: '12px', border: 'none' }}
                  formatter={(val: any) => [chartMode === 'rides' ? `${val} Rides` : `₹${val}`, chartMode === 'rides' ? 'Trips' : 'Revenue']}
                />
                <Bar
                  dataKey="val"
                  fill={chartMode === 'rides' ? '#db2777' : '#059669'}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-woosh-divider flex items-center justify-between text-[11px] text-woosh-muted">
            <span>Peak Activity: <strong className="text-woosh-dark">Monday (6 rides)</strong></span>
            <button onClick={() => navigate('/rides')} className="font-bold text-woosh-primary hover:underline">
              View History →
            </button>
          </div>
        </div>

        {/* Panel 2: Operational Health & Fulfillment Ratio */}
        {/* <div className="bg-white rounded-2xl border border-woosh-border shadow-sm p-4 sm:p-5 flex flex-col justify-between min-h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-woosh-dark text-sm sm:text-base">Fulfillment Ratios</h3>
              <p className="text-xs text-woosh-muted mt-0.5">{totalRides} all-time booking requests</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Live DB
            </span>
          </div>

          <div className="space-y-3 my-auto py-1">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-woosh-muted font-medium">Completed vs Cancelled</span>
                <span className="font-bold text-woosh-dark">
                  {completedRides} Done · {cancelledRides} Cancelled
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${totalRides > 0 ? (completedRides / totalRides) * 100 : 0}%` }}
                  title="Completed"
                />
                <div
                  className="bg-rose-400 h-full"
                  style={{ width: `${totalRides > 0 ? (cancelledRides / totalRides) * 100 : 0}%` }}
                  title="Cancelled"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-woosh-surface border border-woosh-border">
                <p className="text-[10px] uppercase font-bold text-woosh-muted">Avg Ride Fare</p>
                <p className="text-base font-black text-woosh-dark mt-0.5">
                  ₹{completedRides > 0 ? (totalRevenue / completedRides).toFixed(0) : '0'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-woosh-surface border border-woosh-border">
                <p className="text-[10px] uppercase font-bold text-woosh-muted">Riders to Users</p>
                <p className="text-base font-black text-woosh-dark mt-0.5">
                  1 : {totalRiders > 0 ? (totalPassengers / totalRiders).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-woosh-divider flex items-center justify-between text-[11px] text-woosh-muted">
            <span>Platform Commission: <strong className="text-emerald-700">~20% default</strong></span>
            <button onClick={() => navigate('/settings')} className="font-bold text-woosh-primary hover:underline">
              Adjust Pricing →
            </button>
          </div>
        </div> */}

        {/* Panel 3: Live Fleet & On-Duty Riders Feed */}
        <div className="bg-white rounded-2xl border border-woosh-border shadow-sm p-4 sm:p-5 flex flex-col justify-between min-h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-woosh-dark text-sm sm:text-base">On-Duty Fleet ({onlineRidersCount})</h3>
              <p className="text-xs text-woosh-muted mt-0.5">{totalRiders} riders enrolled</p>
            </div>
            <button
              onClick={() => navigate('/riders')}
              className="text-xs text-woosh-primary font-bold hover:underline"
            >
              Manage Fleet
            </button>
          </div>

          {onlineRiders.length > 0 ? (
            <div className="divide-y divide-woosh-divider overflow-y-auto max-h-[160px] pr-1">
              {onlineRiders.map((r: any) => (
                <div key={r._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0">
                      <Bike size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-woosh-dark">{r.user?.name || 'Rider'}</p>
                      <p className="text-woosh-muted font-mono text-[11px]">
                        {r.vehicleNumber} {r.vehicleModel ? `· ${r.vehicleModel}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    Online
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto text-center py-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                <Users size={20} />
              </div>
              <p className="text-xs font-bold text-woosh-dark">No Riders Currently On Duty</p>
              <p className="text-[11px] text-woosh-muted mt-0.5 max-w-[220px]">
                {totalRiders} registered riders are currently offline in Bhopal.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => navigate('/broadcasts')}
                  className="text-xs bg-woosh-primary text-white font-bold px-3 py-1.5 rounded-lg hover:bg-woosh-primary-dark transition shadow-xs flex items-center gap-1"
                >
                  <Bell size={11} /> Send Online Alert
                </button>
                <button
                  onClick={() => navigate('/riders')}
                  className="text-xs bg-woosh-surface hover:bg-gray-100 text-woosh-dark font-bold px-3 py-1.5 rounded-lg border border-woosh-border transition"
                >
                  View Riders
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-woosh-divider flex items-center justify-between text-[11px] text-woosh-muted">
            <span>Status: <strong className="text-woosh-dark">Ready for assignments</strong></span>
            <button onClick={() => navigate('/tracking')} className="font-bold text-woosh-primary hover:underline">
              Open GPS Radar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
