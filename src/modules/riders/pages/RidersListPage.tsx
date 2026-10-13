import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRiders, type RiderListResponse } from '../api/ridersApi';
import { Search, Eye, Bike } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { Avatar } from '../../../common/components/Avatar';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';

const STATUS_TABS = [
  { id: 'all', label: 'All Riders' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export const RidersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RiderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const loadRiders = async () => {
    try {
      setLoading(true);
      const res = await fetchAllRiders(page, 15, status, search);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRiders();
  };

  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const getStatusBadge = (kycStatus: string) => {
    const s = (kycStatus || '').toLowerCase();
    switch (s) {
      case 'approved': return <Badge variant="success" dot>Approved</Badge>;
      case 'under_review': return <Badge variant="warning" dot>Under Review</Badge>;
      case 'rejected': return <Badge variant="error" dot>Rejected</Badge>;
      default: return <Badge variant="neutral" dot>Pending</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-woosh-dark">Rider Management</h1>
          <p className="text-sm text-woosh-muted mt-0.5">Review KYC applications, approve verified drivers, and manage active riders</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Quick status tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
            {STATUS_TABS.map((tab) => {
              const isActive = status === tab.id;
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
                  {isActive && data?.total !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                      {data.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={16} />}
                placeholder="Search riders by name, phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" size="md">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3.5 flex flex-row items-center justify-between">
          <CardTitle>
            {status === 'all' ? 'All Registered Riders' : `Riders (${STATUS_TABS.find(t => t.id === status)?.label})`}
          </CardTitle>
          {data && (
            <span className="text-xs text-woosh-muted">
              Showing {data.riders.length} of {data.total}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : error ? (
            <EmptyState title="Error loading riders" description={error} />
          ) : !data?.riders.length ? (
            <EmptyState 
              title="No riders found" 
              description={status !== 'all' ? `No riders found with '${STATUS_TABS.find(t => t.id === status)?.label}' status.` : "Try adjusting your search criteria."} 
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Online Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.riders.map((rider) => (
                    <TableRow key={rider._id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={rider.user?.name} size="sm" fallbackIcon={<Bike size={18} />} />
                          <div>
                            <p className="font-semibold text-woosh-dark text-sm">{rider.user?.name || 'Incomplete Profile'}</p>
                            {rider.canAcceptChildRides && (
                              <p className="text-[11px] text-emerald-600 font-medium">Child Safe ✓</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-woosh-muted text-sm">{rider.user?.phoneNumber || '—'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-woosh-dark font-mono text-xs font-bold">{rider.vehicleNumber || '—'}</p>
                          <p className="text-xs text-woosh-muted">{rider.vehicleModel || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(rider.kycStatus)}</TableCell>
                      <TableCell>
                        <Badge variant={rider.isOnline ? 'success' : 'neutral'} dot>
                          {rider.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-woosh-muted text-sm">
                        {new Date(rider.user?.createdAt || rider.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/riders/${rider._id}`)}
                          className="text-woosh-primary hover:bg-woosh-primary-light font-medium"
                        >
                          <Eye size={14} className="mr-1" /> Review Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.totalPages > 1 && (
                <div className="px-5 py-3 border-t border-woosh-divider">
                  <Pagination
                    currentPage={data.page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
