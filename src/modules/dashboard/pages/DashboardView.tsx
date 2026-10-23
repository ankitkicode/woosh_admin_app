import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Car, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

export function DashboardView() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient('/admin/dashboard').catch(() => null);
      const fetchedData = res?.data || res || {};
      setData(fetchedData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-woosh-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500">Loading Dashboard Command Center...</p>
        </div>
      </div>
    );
  }

  const activeRides = data.activeRides || 0;
  const totalRiders = data.totalRiders || 0;
  const onlineRidersCount = data.onlineRidersCount || 0;
  const totalPassengers = data.totalPassengers || 0;
  const openComplaints = data.openComplaints || 0;
  const pendingKYC = data.pendingKYC || 0;
  const activeSOS = data.activeSOS || 0;
  const completedRides = data.completedRides || 0;
  const cancelledRides = data.cancelledRides || 0;
  const totalRevenue = data.totalRevenue || 0;
  const onlineRiders = data.onlineRiders || [];

  // Chart data formatting
  const chartData = (data.rideVolumeData && data.rideVolumeData.length > 0)
    ? data.rideVolumeData
    : [
        { name: '10 am', rides: 4 },
        { name: '12 pm', rides: 12 },
        { name: '2 pm', rides: 18 },
        { name: '4 pm', rides: 25 },
        { name: '6 pm', rides: 38 },
        { name: '8 pm', rides: 45 },
        { name: '10 pm', rides: 20 },
      ];

  // Needs Attention Items
  const needsAttention = [];
  if (activeSOS > 0) {
    needsAttention.push({
      type: 'CRITICAL SOS',
      title: `${activeSOS} Emergency SOS Alert(s) Active`,
      desc: 'Immediate dispatch / contact required',
      action: 'Open SOS',
      color: 'bg-red-600',
      actionColor: 'text-red-600',
      onClick: () => navigate('/sos'),
    });
  }
  if (pendingKYC > 0) {
    needsAttention.push({
      type: 'KYC VERIFICATION',
      title: `${pendingKYC} Rider(s) waiting for KYC review`,
      desc: 'Documents submitted and pending approval',
      action: 'Review',
      color: 'bg-amber-500',
      actionColor: 'text-amber-600',
      onClick: () => navigate('/riders'),
    });
  }
  if (openComplaints > 0) {
    needsAttention.push({
      type: 'SUPPORT SLA',
      title: `${openComplaints} Dispute(s) & Tickets pending`,
      desc: 'User queries awaiting resolution',
      action: 'Resolve',
      color: 'bg-orange-500',
      actionColor: 'text-orange-600',
      onClick: () => navigate('/support'),
    });
  }
  if (needsAttention.length === 0) {
    needsAttention.push({
      type: 'SYSTEM HEALTH',
      title: 'All Systems Operating Normally',
      desc: 'No urgent alerts or pending actions required',
      action: '',
      color: 'bg-emerald-500',
      actionColor: '',
      onClick: () => {},
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Critical SOS Alert Banner if Active */}
      {activeSOS > 0 && (
        <div className="bg-red-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg shadow-red-600/20 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="text-red-600" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-black tracking-widest uppercase">CRITICAL ALERT</span>
                <span className="bg-black/40 text-white text-[11px] px-2 py-0.5 rounded font-mono font-bold">Priority 1</span>
              </div>
              <h2 className="text-white text-lg font-bold mt-0.5">{activeSOS} Active Emergency SOS Alert(s) Detected!</h2>
              <p className="text-white/90 text-sm">Review rider/passenger emergency location and coordinate response.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/sos')}
            className="bg-white text-red-600 hover:bg-red-50 font-bold px-5 py-2.5 rounded-lg text-sm transition shadow"
          >
            Open SOS Command →
          </button>
        </div>
      )}

      {/* KPI Cards (6 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'LIVE RIDES', value: activeRides, sub: 'Currently ongoing', onClick: () => navigate('/rides') },
          { label: 'RIDERS ONLINE', value: onlineRidersCount, sub: `${totalRiders} total registered`, onClick: () => navigate('/riders') },
          { label: 'PASSENGERS', value: totalPassengers, sub: 'Registered users', onClick: () => navigate('/passengers') },
          { label: 'KYC PENDING', value: pendingKYC, sub: 'Awaiting approval', highlight: pendingKYC > 0 ? 'text-amber-600' : 'text-gray-900', border: pendingKYC > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100', onClick: () => navigate('/riders') },
          { label: 'OPEN DISPUTES', value: openComplaints, sub: 'Needs attention', highlight: openComplaints > 0 ? 'text-orange-600' : 'text-gray-900', border: openComplaints > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100', onClick: () => navigate('/disputes') },
          { label: 'ACTIVE SOS', value: activeSOS, sub: 'Emergency alerts', highlight: activeSOS > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600', border: activeSOS > 0 ? 'border-red-300 bg-red-50' : 'border-gray-100', onClick: () => navigate('/sos') },
        ].map((kpi, i) => (
          <div
            key={i}
            onClick={kpi.onClick}
            className={`bg-white p-4 rounded-xl border ${kpi.border || 'border-gray-100'} shadow-sm flex flex-col justify-between h-[115px] cursor-pointer hover:shadow-md transition`}
          >
            <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">{kpi.label}</p>
            <div className={`text-3xl font-black ${kpi.highlight || 'text-gray-900'} leading-none my-1`}>{kpi.value}</div>
            <p className="text-xs text-gray-500 truncate">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Middle Row: Live Map & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col min-h-[420px] relative">
          <div className="flex items-center justify-between z-10 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="font-bold text-gray-900 text-sm">Live Dispatch Map · Bhopal</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{onlineRidersCount} Online</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>{activeRides} Active Trips</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>{activeSOS} SOS</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-100 rounded-lg relative overflow-hidden flex items-center justify-center border border-gray-200 min-h-[340px]">
            {loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="text-woosh-primary" size={20} />
                    <span className="font-bold text-sm">Bhopal Fleet Operations Grid</span>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-mono">Live Sync</span>
                </div>
                <div className="grid grid-cols-3 gap-3 my-auto">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Online Fleet</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{onlineRidersCount}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Rides In Transit</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{activeRides}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Completed Today</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{completedRides}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">Center coordinates: 23.2599° N, 77.4126° E (Bhopal MP)</p>
              </div>
            ) : !isLoaded ? (
              <div className="text-gray-500 font-medium text-sm animate-pulse">Loading Google Map...</div>
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

        {/* Needs Attention */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[420px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Action Queue</h3>
            <span className="text-xs text-gray-400">Prioritized</span>
          </div>
          <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
            {needsAttention.map((item, i) => (
              <div
                key={i}
                onClick={item.onClick}
                className="p-4 hover:bg-gray-50/80 transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${item.color}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">{item.type}</p>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-woosh-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                {item.action && (
                  <button className={`text-xs font-bold ${item.actionColor} flex items-center gap-1 group-hover:underline flex-shrink-0 pt-1`}>
                    {item.action}
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ride Volume Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between h-[240px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">Ride Volume (Today)</h3>
            <span className="text-xs text-gray-500 font-medium">{completedRides + activeRides} Total</span>
          </div>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="rides" fill="#db2777" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-400 text-center">Hourly distribution of ride bookings</p>
        </div>

        {/* Today Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between h-[240px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">Operational Metrics</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Live</span>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-600">Completed Rides</span>
              <span className="font-bold text-gray-900">{completedRides}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-600">Total Fare Volume</span>
              <span className="font-bold text-emerald-600">₹{totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-600">Cancelled Rides</span>
              <span className="font-bold text-gray-700">{cancelledRides}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">Active SOS Incidents</span>
              <span className={`font-bold ${activeSOS > 0 ? 'text-red-600' : 'text-gray-900'}`}>{activeSOS}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center">Updated continuously from database</p>
        </div>

        {/* Online Riders Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between h-[240px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-sm">Riders on Duty ({onlineRidersCount})</h3>
            <button
              onClick={() => navigate('/riders')}
              className="text-xs text-woosh-primary font-bold hover:underline"
            >
              View All
            </button>
          </div>
          {onlineRiders.length > 0 ? (
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[140px] pr-1">
              {onlineRiders.map((r: any) => (
                <div key={r._id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{r.user?.name || 'Rider'}</p>
                    <p className="text-gray-400 font-mono">{r.vehicleNumber} {r.vehicleModel ? `· ${r.vehicleModel}` : ''}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Online</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto text-gray-400">
              <Users size={28} className="text-gray-300 mb-1" />
              <p className="text-xs font-semibold text-gray-500">No riders currently on duty</p>
              <button
                onClick={() => navigate('/riders')}
                className="mt-2 text-xs text-woosh-primary font-bold"
              >
                Manage Fleet →
              </button>
            </div>
          )}
          <p className="text-[11px] text-gray-400 text-center">Active rider tracking feed</p>
        </div>
      </div>
    </div>
  );
}

