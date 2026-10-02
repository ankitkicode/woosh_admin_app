import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Banknote, IndianRupee, TrendingUp, Briefcase } from 'lucide-react';
import { apiClient } from '../../../common/api/client';
import { useToast } from '../../../common/components/Toast';

export const AnalyticsView: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalPayouts: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiClient('/admin/analytics');
        setStats(res);
      } catch (error: any) {
        toast('error', 'Failed to fetch analytics', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-woosh-dark flex items-center gap-2">
          <TrendingUp className="text-woosh-primary" /> Analytics & Reports
        </h1>
        <p className="text-sm text-woosh-muted mt-1">Platform revenue, commissions, and payout statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-woosh-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-woosh-muted flex items-center gap-2">
              <IndianRupee size={16} className="text-woosh-primary" />
              Total Revenue (GMV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-woosh-dark">₹{stats.totalRevenue.toLocaleString()}</div>
            )}
            <p className="text-xs text-woosh-muted mt-1">Total value of all completed rides</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-woosh-muted flex items-center gap-2">
              <Briefcase size={16} className="text-emerald-500" />
              Platform Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-woosh-dark">₹{stats.totalCommission.toLocaleString()}</div>
            )}
            <p className="text-xs text-woosh-muted mt-1">Total earnings for the platform</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-woosh-muted flex items-center gap-2">
              <Banknote size={16} className="text-blue-500" />
              Total Payouts Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-woosh-dark">₹{stats.totalPayouts.toLocaleString()}</div>
            )}
            <p className="text-xs text-woosh-muted mt-1">Total money sent to riders</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-woosh-muted flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />
              Total Rides
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-woosh-dark">{stats.totalRides.toLocaleString()}</div>
            )}
            <p className="text-xs text-woosh-muted mt-1">Successfully completed rides</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
