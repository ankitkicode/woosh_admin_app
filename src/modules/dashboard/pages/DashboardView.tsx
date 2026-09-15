import { useState, useEffect } from 'react';
import { Users, UserCircle, Map, IndianRupee, ShieldAlert, Clock } from 'lucide-react';
import { StatCard } from '../../../common/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { apiClient } from '../../../common/utils/apiClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock chart data — will be replaced with real API data
const revenueData = [
  { name: 'Mon', revenue: 4200 },
  { name: 'Tue', revenue: 5800 },
  { name: 'Wed', revenue: 4900 },
  { name: 'Thu', revenue: 7200 },
  { name: 'Fri', revenue: 8100 },
  { name: 'Sat', revenue: 9500 },
  { name: 'Sun', revenue: 6800 },
];

const rideVolumeData = [
  { name: 'Mon', rides: 45 },
  { name: 'Tue', rides: 62 },
  { name: 'Wed', rides: 53 },
  { name: 'Thu', rides: 78 },
  { name: 'Fri', rides: 85 },
  { name: 'Sat', rides: 92 },
  { name: 'Sun', rides: 68 },
];

export function DashboardView() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeRides: 0,
    totalRiders: 0,
    totalPassengers: 0,
    pendingKYC: 0,
    openComplaints: 0,
  });
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboardData, statsData] = await Promise.all([
        apiClient('/admin/dashboard'),
        apiClient('/superadmin/stats').catch(() => ({ totalRevenue: 0 })),
      ]);

      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        activeRides: dashboardData.activeRides || 0,
        totalRiders: dashboardData.totalRiders || 0,
        totalPassengers: dashboardData.totalPassengers || 0,
        pendingKYC: dashboardData.pendingKYC || 0,
        openComplaints: dashboardData.openComplaints || 0,
      });

      // Fetch recent rides
      const ridesData = await apiClient('/admin/rides/active').catch(() => []);
      setRecentRides(Array.isArray(ridesData) ? ridesData.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, trend: { value: '+12.5%', positive: true } },
    { title: 'Active Rides', value: stats.activeRides.toLocaleString(), icon: Map, trend: { value: '+4.2%', positive: true } },
    { title: 'Total Riders', value: stats.totalRiders.toLocaleString(), icon: UserCircle, trend: { value: '+18.1%', positive: true } },
    { title: 'Total Passengers', value: stats.totalPassengers.toLocaleString(), icon: Users, trend: { value: '+8.4%', positive: true } },
  ];

  const getStatusBadge = (status: string) => {
    if (['completed', 'payment_completed'].includes(status)) return <Badge variant="success" dot>Completed</Badge>;
    if (['requested', 'rider_search', 'rider_assigned'].includes(status)) return <Badge variant="warning" dot>Matching</Badge>;
    if (['accepted', 'rider_en_route', 'rider_arrived', 'started', 'in_progress'].includes(status)) return <Badge variant="info" dot>Active</Badge>;
    return <Badge variant="neutral" dot>{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-woosh-dark">Dashboard Overview</h1>
        <p className="text-sm text-woosh-muted mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))
        )}
      </div>

      {/* Quick Stats Bar */}
      {!isLoading && (stats.pendingKYC > 0 || stats.openComplaints > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.pendingKYC > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
              <Clock size={16} className="text-amber-500" />
              <span className="text-amber-800 font-medium">{stats.pendingKYC} KYC pending review</span>
            </div>
          )}
          {stats.openComplaints > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
              <ShieldAlert size={16} className="text-red-500" />
              <span className="text-red-800 font-medium">{stats.openComplaints} open complaints</span>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E91E63" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E91E63" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#E91E63" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ride Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rideVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  formatter={(value: any) => [value, 'Rides']}
                />
                <Bar dataKey="rides" fill="#E91E63" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Active Rides */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Active Rides</CardTitle>
          <span className="text-xs text-woosh-muted">{recentRides.length} rides</span>
        </CardHeader>
        <CardContent className="p-0">
          {recentRides.length > 0 ? (
            <div className="divide-y divide-woosh-divider">
              {recentRides.map((ride) => (
                <div key={ride._id} className="flex items-center justify-between px-5 py-3 hover:bg-woosh-surface/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-woosh-primary-light flex items-center justify-center text-woosh-primary font-mono text-xs font-bold">
                      {ride._id.slice(-4).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-woosh-dark truncate">{ride.passenger?.name || 'Unknown'}</p>
                      <p className="text-xs text-woosh-muted">Rider: {ride.rider?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {getStatusBadge(ride.status)}
                    <span className="text-sm font-medium text-woosh-dark">₹{ride.estimatedFare || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-woosh-muted text-sm">
              {isLoading ? 'Loading...' : 'No active rides right now'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
