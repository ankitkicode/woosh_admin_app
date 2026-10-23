import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Calendar,
  IndianRupee,
  CheckCircle2,
  ShieldAlert,
  Download,
  Eye,
  Car,
  Bike,
  Activity,
  CheckCircle,
  XCircle,
  Radio,
  User
} from 'lucide-react';
import { Card, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Badge } from '../../../common/components/Badge';
import { Avatar } from '../../../common/components/Avatar';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Pagination } from '../../../common/components/Pagination';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { ExportModal, type ExportColumn } from '../../../common/components/ExportModal';
import { downloadDataExport, type ExportColumnDef } from '../../../common/utils/exportUtils';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

const STATUS_TABS = [
  { id: 'all', label: 'All Rides' },
  { id: 'active', label: 'Active & In Transit' },
  { id: 'requested', label: 'Matching / Searching' },
  { id: 'sos_active', label: 'Safety Holds (SOS)' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const RIDE_EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'rideId', label: 'Ride ID', category: 'Trip Overview' },
  { id: 'status', label: 'Trip Status', category: 'Trip Overview' },
  { id: 'date', label: 'Date & Time', category: 'Trip Overview' },
  { id: 'passengerName', label: 'Passenger Name', category: 'Passenger Details' },
  { id: 'passengerPhone', label: 'Passenger Phone', category: 'Passenger Details' },
  { id: 'riderName', label: 'Rider Name', category: 'Rider Details' },
  { id: 'riderPhone', label: 'Rider Phone', category: 'Rider Details' },
  { id: 'vehicleType', label: 'Vehicle Type', category: 'Vehicle Details' },
  { id: 'pickupAddress', label: 'Pickup Location', category: 'Route Information' },
  { id: 'dropAddress', label: 'Drop Location', category: 'Route Information' },
  { id: 'distanceKm', label: 'Distance (KM)', category: 'Route Information' },
  { id: 'durationMinutes', label: 'Duration (Mins)', category: 'Route Information' },
  { id: 'finalFare', label: 'Final Fare (₹)', category: 'Fare & Payment' },
  { id: 'paymentMethod', label: 'Payment Method', category: 'Fare & Payment' },
  { id: 'paymentStatus', label: 'Payment Status', category: 'Fare & Payment' },
  { id: 'platformCommission', label: 'Platform Commission (₹)', category: 'Fare & Payment' },
  { id: 'riderEarnings', label: 'Rider Earnings (₹)', category: 'Fare & Payment' },
  { id: 'otp', label: 'Ride OTP', category: 'Security & Audit', defaultSelected: false },
  { id: 'cancelledBy', label: 'Cancelled By', category: 'Security & Audit', defaultSelected: false },
  { id: 'cancellationReason', label: 'Cancellation Reason', category: 'Security & Audit', defaultSelected: false },
];

interface RideKPIStats {
  totalRides: number;
  activeRides: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenue: number;
}

export function RidesView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const urlSearch = searchParams.get('search') || '';
  const urlTab = searchParams.get('tab') || 'all';

  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusTab, setStatusTab] = useState(urlTab);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const [resolvedSosRideIds, setResolvedSosRideIds] = useState<Set<string>>(new Set());
  const [kpiStats, setKpiStats] = useState<RideKPIStats>({
    totalRides: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalRevenue: 0,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sync URL params
  useEffect(() => {
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    if (urlTab && urlTab !== statusTab) {
      setStatusTab(urlTab);
    }
  }, [urlSearch, urlTab]);

  // Load KPI Stats from Dashboard
  const fetchKPIs = useCallback(async () => {
    try {
      const res = await apiClient('/admin/dashboard').catch(() => null);
      const data = res?.data || res;
      if (data) {
        setKpiStats({
          totalRides: data.totalRides ?? 0,
          activeRides: data.activeRides ?? 0,
          completedRides: data.completedRides ?? 0,
          cancelledRides: data.cancelledRides ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
        });
      }
    } catch (err) {
      console.error('Failed to load rides KPI overview:', err);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Load SOS alerts to cross-reference resolution status
  useEffect(() => {
    const fetchSos = async () => {
      try {
        const res = await apiClient('/admin/sos?page=1&limit=100').catch(() => null);
        const data = res?.data || res;
        const alerts = data?.alerts || [];
        const resolvedIds = new Set<string>();
        alerts.forEach((a: any) => {
          if (a.status === 'resolved' || a.status === 'false_alarm') {
            const rId = a.rideId?._id || a.rideId;
            if (rId) resolvedIds.add(rId.toString());
          }
        });
        setResolvedSosRideIds(resolvedIds);
      } catch (e) {
        console.error('Failed to load SOS resolution status in rides module:', e);
      }
    };
    fetchSos();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRides = useCallback(async () => {
    try {
      setIsLoading(true);
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const statusParam = statusTab !== 'all' ? `&status=${statusTab}` : '';
      const data = await apiClient(`/admin/rides?page=${page}&limit=15${statusParam}${searchParam}`);
      setRides(data.rides || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);

      // Keep KPI cards live & synchronized with tab counts
      if (!debouncedSearch && data.total !== undefined) {
        if (statusTab === 'all') {
          setKpiStats(prev => ({ ...prev, totalRides: data.total }));
        } else if (statusTab === 'completed') {
          setKpiStats(prev => ({ ...prev, completedRides: data.total }));
        } else if (statusTab === 'cancelled') {
          setKpiStats(prev => ({ ...prev, cancelledRides: data.total }));
        } else if (statusTab === 'active') {
          setKpiStats(prev => ({ ...prev, activeRides: data.total }));
        }
      }
    } catch (err: any) {
      toast('error', 'Failed to load rides', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, statusTab]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRides();
  };

  const handleTabChange = (newTab: string) => {
    setStatusTab(newTab);
    setPage(1);
  };

  const handleCancelRide = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to administratively close/cancel this ride?')) return;
    try {
      await apiClient(`/admin/rides/${rideId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason: 'Administratively closed by operator' })
      });
      toast('success', 'Ride closed and marked as cancelled');
      fetchRides();
      fetchKPIs();
    } catch (err: any) {
      toast('error', 'Failed to close ride', err.message);
    }
  };

  const getStatusBadge = (status: string, rideId: string) => {
    if (status === 'sos_active') {
      if (resolvedSosRideIds.has(rideId)) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <CheckCircle2 size={12} className="text-emerald-600" />
            ✓ SOS Resolved
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <ShieldAlert size={12} className="text-rose-600" />
          SOS ACTIVE
        </span>
      );
    }
    if (['completed', 'payment_completed', 'closed'].includes(status)) {
      return (
        <Badge variant="success" dot>
          Completed
        </Badge>
      );
    }
    if (['requested', 'rider_search', 'rider_assigned'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          Matching
        </span>
      );
    }
    if (['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(status)) {
      return (
        <Badge variant="info" dot>
          In Transit
        </Badge>
      );
    }
    if (['cancelled', 'expired', 'rider_cancelled', 'passenger_cancelled', 'no_show', 'timed_out'].includes(status)) {
      return (
        <Badge variant="error" dot>
          Cancelled
        </Badge>
      );
    }
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  // Export Accessors
  const getRideAccessor = (colId: string) => {
    switch (colId) {
      case 'rideId': return (r: any) => r._id;
      case 'status': return (r: any) => {
        if (r.status === 'sos_active') {
          return resolvedSosRideIds.has(r._id) ? 'SOS_RESOLVED' : 'SOS_ACTIVE';
        }
        return r.status?.toUpperCase() || '';
      };
      case 'date': return (r: any) => new Date(r.createdAt).toLocaleString('en-IN');
      case 'passengerName': return (r: any) => r.passenger?.name || 'Direct / Guest';
      case 'passengerPhone': return (r: any) => r.passenger?.phoneNumber || '';
      case 'riderName': return (r: any) => r.rider?.name || 'Unassigned';
      case 'riderPhone': return (r: any) => r.rider?.phoneNumber || '';
      case 'vehicleType': return (r: any) => r.vehicleType || 'BIKE';
      case 'pickupAddress': return (r: any) => r.pickup?.address || '';
      case 'dropAddress': return (r: any) => r.drop?.address || '';
      case 'distanceKm': return (r: any) => r.distanceKm || 0;
      case 'durationMinutes': return (r: any) => r.durationMinutes || 0;
      case 'finalFare': return (r: any) => r.finalFare || r.estimatedFare || 0;
      case 'paymentMethod': return (r: any) => (r.paymentMethod || 'CASH').toUpperCase();
      case 'paymentStatus': return (r: any) => (r.paymentStatus || 'PENDING').toUpperCase();
      case 'platformCommission': return (r: any) => r.platformCommission || 0;
      case 'riderEarnings': return (r: any) => r.riderEarnings || 0;
      case 'otp': return (r: any) => r.otp || '';
      case 'cancelledBy': return (r: any) => r.cancellation?.cancelledBy || '';
      case 'cancellationReason': return (r: any) => r.cancellation?.reason || '';
      default: return (r: any) => r[colId] || '';
    }
  };

  const handleExportRides = async (selectedCols: string[], scope: 'current' | 'all', format: 'csv' | 'json') => {
    let records: any[] = [];
    if (scope === 'current') {
      records = rides;
    } else {
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const statusParam = statusTab !== 'all' ? `&status=${statusTab}` : '';
      const res = await apiClient(`/admin/rides?page=1&limit=5000${statusParam}${searchParam}`);
      records = res?.rides || [];
    }

    const exportColDefs: ExportColumnDef[] = selectedCols.map(id => {
      const colInfo = RIDE_EXPORT_COLUMNS.find(c => c.id === id);
      return {
        id,
        label: colInfo?.label || id,
        accessor: getRideAccessor(id),
      };
    });

    downloadDataExport(records, exportColDefs, `woosh_rides_${statusTab}`, format);
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-woosh-dark">Rides Management</h1>
          <p className="text-sm text-woosh-muted mt-0.5">
            Monitor real-time bookings, track active dispatches, audit fares, and review safety records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchRides();
              fetchKPIs();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5"
            title="Refresh ride listings"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 border-gray-200 hover:border-gray-300 shadow-sm"
          >
            <Download size={14} className="text-woosh-primary" />
            <span>Export Rides</span>
          </Button>
        </div>
      </div>

      {/* Top Metric KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="p-4 border border-woosh-border shadow-xs hover:border-woosh-primary/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Total Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-woosh-dark mt-2">
            {kpiStats.totalRides || totalCount}
          </p>
          <span className="text-[11px] text-woosh-muted">All-time platform rides</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Active & In Transit</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {kpiStats.activeRides}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">Live on Bhopal radar</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Completed Trips</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-700 mt-2">
            {kpiStats.completedRides}
          </p>
          <span className="text-[11px] text-woosh-muted">Delivered safely</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Cancelled / Expired</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {kpiStats.cancelledRides}
          </p>
          <span className="text-[11px] text-woosh-muted">Driver/User cancellations</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-purple-300 transition col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Platform Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <IndianRupee size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            ₹{kpiStats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-woosh-muted">Settled ride GMV</span>
        </Card>
      </div>

      {/* Filter Tabs & Search Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Quick status tabs (Matches RidersListPage & PassengersView pattern) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
            {STATUS_TABS.map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-woosh-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  {isActive && totalCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                      {totalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar & quick filters */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={16} />}
                placeholder="Search rides by ID, passenger name, rider name, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" size="md">
              Search
            </Button>
            {debouncedSearch && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={7} />
            </div>
          ) : rides.length === 0 ? (
            <div className="p-10">
              <EmptyState
                title="No Platform Rides Found"
                description={
                  debouncedSearch
                    ? `No ride matches your query "${debouncedSearch}". Try clearing the search keyword.`
                    : `No rides match the selected filter category (${statusTab.replace(/_/g, ' ')}).`
                }
                actionLabel={debouncedSearch || statusTab !== 'all' ? 'Reset All Filters' : undefined}
                onAction={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setStatusTab('all');
                  setPage(1);
                }}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ride ID & Date</TableHead>
                      <TableHead>Passenger</TableHead>
                      <TableHead>Driver & Vehicle</TableHead>
                      <TableHead>Pickup & Drop Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fare & Mode</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rides.map((ride) => {
                      const isSosResolved =
                        ride.status === 'sos_active' && resolvedSosRideIds.has(ride._id);

                      return (
                        <TableRow
                          key={ride._id}
                          className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                            ride.status === 'sos_active'
                              ? isSosResolved
                                ? 'bg-emerald-50/15'
                                : 'bg-rose-50/30'
                              : ''
                          }`}
                          onClick={() => navigate(`/rides/${ride._id}`)}
                        >
                          {/* Ride ID & Created Date */}
                          <TableCell>
                            <div>
                              <span className="font-mono text-xs font-bold text-woosh-primary bg-woosh-primary-light px-2 py-0.5 rounded">
                                #{ride._id.slice(-6).toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-woosh-muted mt-1.5 font-medium">
                                <Calendar size={11} />
                                <span>
                                  {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Passenger */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={ride.passenger?.name || 'Guest'}
                                size="md"
                                className="bg-blue-100 text-blue-700 font-bold"
                              />
                              <div>
                                <div
                                  className="font-bold text-woosh-dark hover:text-woosh-primary transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    if (ride.passenger?._id) {
                                      e.stopPropagation();
                                      navigate(`/passengers/${ride.passenger._id}`);
                                    }
                                  }}
                                >
                                  {ride.passenger?.name || (
                                    <span className="italic text-gray-400 font-normal">Direct Booking</span>
                                  )}
                                </div>
                                <div className="text-xs text-woosh-muted">
                                  {ride.passenger?.phoneNumber || 'No phone recorded'}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Rider & Vehicle */}
                          <TableCell>
                            {ride.rider ? (
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={ride.rider.name}
                                  size="md"
                                  className="bg-emerald-100 text-emerald-700 font-bold"
                                  fallbackIcon={<Bike size={18} />}
                                />
                                <div>
                                  <div
                                    className="font-bold text-woosh-dark hover:text-woosh-primary transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      if (ride.rider?._id) {
                                        e.stopPropagation();
                                        navigate(`/riders/${ride.rider._id}`);
                                      }
                                    }}
                                  >
                                    {ride.rider.name}
                                  </div>
                                  <div className="text-xs text-woosh-muted flex items-center gap-1.5">
                                    <span>{ride.rider.phoneNumber}</span>
                                    {ride.vehicleType && (
                                      <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded text-[10px] font-mono uppercase">
                                        {ride.vehicleType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : ['requested', 'rider_search', 'rider_assigned'].includes(ride.status) ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                  <Radio size={13} className="animate-spin" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-amber-700 block">
                                    Matching...
                                  </span>
                                  <span className="text-[10px] text-amber-600">
                                    Searching nearby fleet
                                  </span>
                                </div>
                              </div>
                            ) : ['cancelled', 'expired', 'rider_cancelled', 'passenger_cancelled', 'no_show', 'timed_out'].includes(ride.status) ? (
                              <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                  <User size={13} />
                                </div>
                                <div>
                                  <span className="text-xs text-gray-600 font-medium block">
                                    Unassigned
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Cancelled before match
                                  </span>
                                </div>
                              </div>
                            ) : ['completed', 'payment_completed', 'closed'].includes(ride.status) ? (
                              <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                  <CheckCircle size={13} className="text-emerald-500" />
                                </div>
                                <div>
                                  <span className="text-xs text-gray-700 font-medium block">
                                    Direct / Completed
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    No rider profile linked
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                  <User size={13} />
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 font-medium block">
                                    Unassigned
                                  </span>
                                  <span className="text-[10px] text-gray-400 capitalize">
                                    {ride.status?.replace(/_/g, ' ') || 'No driver'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </TableCell>

                          {/* Route */}
                          <TableCell>
                            <div className="max-w-[240px] space-y-1">
                              <div className="flex items-start gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                <span className="text-xs text-woosh-muted truncate block">
                                  {ride.pickup?.address || 'Pickup point registered'}
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-sm bg-rose-500 mt-1 flex-shrink-0" />
                                <span className="text-xs font-medium text-woosh-dark truncate block">
                                  {ride.drop?.address || 'Drop location point'}
                                </span>
                              </div>
                              {(ride.distanceKm || ride.durationMinutes) && (
                                <div className="text-[10px] text-gray-400 font-medium pl-3 pt-0.5">
                                  {ride.distanceKm ? `${ride.distanceKm} km` : ''}
                                  {ride.distanceKm && ride.durationMinutes ? ' · ' : ''}
                                  {ride.durationMinutes ? `${ride.durationMinutes} mins` : ''}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="whitespace-nowrap">
                            {getStatusBadge(ride.status, ride._id)}
                          </TableCell>

                          {/* Fare & Mode */}
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 font-bold text-woosh-dark text-sm">
                              <span>₹{ride.finalFare || ride.estimatedFare || 0}</span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className="text-[10px] uppercase font-bold text-woosh-muted bg-gray-100 px-1.5 py-0.5 rounded">
                                {ride.paymentMethod || 'CASH'}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ride.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-400'
                                }`}
                                title={`Payment: ${ride.paymentStatus || 'Pending'}`}
                              />
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-bold text-woosh-primary hover:bg-woosh-primary hover:text-white flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/rides/${ride._id}`);
                                }}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </Button>

                              {isSosResolved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/sos');
                                  }}
                                  title="View SOS Resolution Audit"
                                >
                                  SOS Log
                                </Button>
                              )}

                              {['requested', 'rider_search', 'rider_assigned', 'accepted', 'in_progress', 'started', 'sos_active'].includes(ride.status) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelRide(ride._id);
                                  }}
                                  title="Administratively close this ride"
                                >
                                  Close
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-woosh-divider">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Platform Rides Data"
        description="Select trip attributes to export into CSV or JSON format with Excel compatible encoding."
        columns={RIDE_EXPORT_COLUMNS}
        totalRecords={kpiStats.totalRides || totalCount}
        currentPageCount={rides.length}
        onExport={handleExportRides}
      />
    </div>
  );
}
