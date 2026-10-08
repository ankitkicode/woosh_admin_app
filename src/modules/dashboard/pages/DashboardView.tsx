import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

export function DashboardView() {
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
      let fetchedData = res?.data || res || {};
      setData(fetchedData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  // Map API data to original layout variables
  const activeRides = data.activeRides || 0;
  const totalRiders = data.totalRiders || 0;
  const openComplaints = data.openComplaints || 0;
  const pendingKYC = data.pendingKYC || 0;
  
  // Transform API chart data to match the UI expectation
  const chartData = (data.rideVolumeData && data.rideVolumeData.length > 0) 
    ? data.rideVolumeData 
    : [
        { name: '11 am', rides: 10 },
        { name: '12 pm', rides: 15 },
        { name: '1 pm', rides: 12 },
        { name: '2 pm', rides: 20 },
        { name: '3 pm', rides: 25 },
        { name: '4 pm', rides: 18 },
        { name: '5 pm', rides: 30 },
        { name: '6 pm', rides: 45 },
        { name: '7 pm', rides: 55 },
        { name: '8 pm', rides: 40 },
        { name: '9 pm', rides: 25 },
        { name: '10 pm', rides: 35 },
      ];

  const needsAttention = [];
  if (openComplaints > 0) {
    needsAttention.push({ type: 'SUPPORT SLA', title: `${openComplaints} support complaints pending`, desc: 'Check support inbox', action: 'Reply', color: 'bg-red-500', actionColor: 'text-red-600' });
  }
  if (pendingKYC > 0) {
    needsAttention.push({ type: 'VERIFICATION', title: `${pendingKYC} riders waiting for approval`, desc: 'Check Rider Verification tab', action: 'Review', color: 'bg-gray-300', actionColor: 'text-woosh-primary' });
  }
  if (needsAttention.length === 0) {
    needsAttention.push({ type: 'ALL CLEAR', title: 'No urgent items', desc: 'Everything is running smoothly', action: '', color: 'bg-green-400', actionColor: '' });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Critical SOS Alert - Dynamic display */}
      {openComplaints > 0 && (
        <div className="bg-[#C81E1E] rounded-lg p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <ShieldAlert className="text-[#C81E1E]" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold tracking-widest">ACTION REQUIRED</span>
                <span className="bg-black/30 text-white text-xs px-2 py-0.5 rounded font-mono">High Priority</span>
              </div>
              <h2 className="text-white text-lg font-bold mt-0.5">You have {openComplaints} open support complaint(s)</h2>
              <p className="text-white/80 text-sm">Please resolve them immediately in the Support Inbox.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white text-[#C81E1E] px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors">
              Open inbox
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'LIVE RIDES', value: activeRides, sub: 'Currently ongoing' },
          { label: 'RIDERS ONLINE', value: totalRiders, sub: 'Total registered' },
          { label: 'OPEN COMPLAINTS', value: openComplaints, sub: 'Pending support tickets', highlight: openComplaints > 0 ? 'text-[#C81E1E]' : 'text-gray-900', border: openComplaints > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100' },
          { label: 'FLAGGED RIDES', value: 'N/A', sub: 'Data not fetched', highlight: 'text-orange-500', border: 'border-orange-200 bg-orange-50' },
          { label: 'AVG PICKUP ETA', value: 'N/A', sub: 'Coming soon' },
          { label: 'KYC WAITING', value: pendingKYC, sub: 'Awaiting approval' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-4 rounded-xl border ${kpi.border} shadow-sm flex flex-col justify-between h-[110px]`}>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest">{kpi.label}</p>
            <div className={`text-3xl font-bold ${kpi.highlight || 'text-gray-900'} leading-none my-1`}>{kpi.value}</div>
            <p className="text-xs text-gray-500 leading-tight">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Middle Row: Map & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[420px]">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between z-10 absolute top-4 left-4 right-4">
            <h3 className="font-bold text-gray-900 bg-white/90 backdrop-blur px-3 py-1 rounded">Live map · Bhopal</h3>
            <div className="flex items-center gap-3 text-[11px] font-medium bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>On trip</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>To pickup</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div>Idle rider</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>Flagged</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>SOS</span>
            </div>
          </div>
          
          <div className="flex-1 bg-[#E8EAED] mt-2 rounded-lg relative overflow-hidden flex items-center justify-center border border-gray-200">
            {loadError ? (
               <div className="text-red-500 font-bold z-20 bg-white p-2 rounded">Error loading Google Maps</div>
            ) : !isLoaded ? (
               <div className="text-gray-500 font-bold z-20 bg-white p-2 rounded animate-pulse">Loading Map...</div>
            ) : (
               <GoogleMap
                 mapContainerStyle={{ width: '100%', height: '100%' }}
                 zoom={12}
                 center={{ lat: 23.2599, lng: 77.4126 }} // Bhopal center
                 options={{ disableDefaultUI: true, zoomControl: true }}
               >
                  <Marker position={{ lat: 23.2599, lng: 77.4126 }} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#3b82f6', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }} />
                  <Marker position={{ lat: 23.2310, lng: 77.4330 }} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#10b981', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }} />
               </GoogleMap>
            )}
          </div>
          <div className="absolute bottom-6 left-6 z-10 bg-white shadow-sm px-2 py-1 rounded text-xs font-medium text-gray-600 border border-gray-100">
            Live · updated 2 s ago
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Needs attention</h3>
            <span className="text-xs text-gray-500">Sorted by urgency</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {needsAttention.map((item, i) => (
              <div key={i} className="flex border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className={`w-1 flex-shrink-0 ${item.color}`}></div>
                <div className="p-3 flex-1 flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-bold ${item.type.includes('SLA') ? 'text-red-600' : 'text-gray-500'} tracking-wider`}>{item.type}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  {item.action && (
                    <button className={`text-sm font-bold ${item.actionColor}`}>
                      {item.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[220px]">
        {/* Rides per hour */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Rides / Volume</h3>
          <div className="flex-1 min-h-0 w-full ml-[-20px]">
             <ResponsiveContainer width="105%" height="100%">
               <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                 <Bar dataKey={data.rideVolumeData ? "rides" : "rides"} fill="#F472B6" radius={[2, 2, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
            <span>Start</span>
            <span>Mid</span>
            <span>End</span>
          </div>
        </div>

        {/* Today so far */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Today so far</h3>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Rides completed</span>
              <span className="font-bold text-gray-900">{data.completedRides || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Revenue</span>
              <span className="font-bold text-gray-900">₹{data.totalRevenue?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm opacity-50">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-bold text-gray-900">N/A</span>
            </div>
            <div className="flex justify-between items-center text-sm opacity-50">
              <span className="text-gray-600">Avg rating</span>
              <span className="font-bold text-gray-900">N/A</span>
            </div>
            <div className="flex justify-between items-center text-sm opacity-50">
              <span className="text-gray-600">SOS raised</span>
              <span className="font-bold text-gray-900">N/A</span>
            </div>
          </div>
        </div>

        {/* Riders on duty */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="p-4 pb-2 border-b border-transparent">
            <h3 className="font-bold text-gray-900">Riders on duty · {activeRides}</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4">
             <p className="text-sm font-bold text-gray-500">No active riders</p>
             <p className="text-xs text-center mt-1">Data not fetched from API</p>
          </div>
        </div>
      </div>
    </div>
  );
}
