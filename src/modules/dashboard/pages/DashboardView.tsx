import { useState, useEffect } from 'react';
import { Users, UserCircle, Map, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { apiClient } from '../../../common/utils/apiClient';

export function DashboardView() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeRides: 0,
    totalRiders: 0,
    totalPassengers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboardData, statsData] = await Promise.all([
        apiClient('/admin/dashboard'),
        apiClient('/superadmin/stats').catch(() => ({ totalRevenue: 0 })), // fallback if not super_admin
      ]);
      
      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        activeRides: dashboardData.activeRides || 0,
        totalRiders: dashboardData.totalRiders || 0,
        totalPassengers: dashboardData.totalPassengers || 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+12.5%' },
    { name: 'Active Rides', value: stats.activeRides.toLocaleString(), icon: Map, trend: '+4.2%' },
    { name: 'Total Riders', value: stats.totalRiders.toLocaleString(), icon: UserCircle, trend: '+18.1%' },
    { name: 'Total Passengers', value: stats.totalPassengers.toLocaleString(), icon: Users, trend: '+8.4%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-woosh-dark">Dashboard Overview</h1>
        <p className="text-sm text-woosh-light mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-woosh-light-pink text-woosh-primary rounded-xl">
                    <Icon size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-woosh-success bg-green-50 px-2 py-1 rounded-md">
                    <TrendingUp size={16} />
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-woosh-light">{stat.name}</p>
                  <p className="text-2xl font-bold text-woosh-dark mt-1">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Recent Rides</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 text-woosh-light">
            Chart / Table Placeholder
          </CardContent>
        </Card>

        <Card className="h-96">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 text-woosh-light">
            Chart Placeholder
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
