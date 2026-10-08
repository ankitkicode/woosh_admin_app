import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Badge } from '../../../common/components/Badge';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Pagination } from '../../../common/components/Pagination';
import { Search, RefreshCw, Calendar, IndianRupee } from 'lucide-react';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Tabs } from '../../../common/components/Tabs';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

const STATUS_TABS = [
  { id: 'all', label: 'All Rides' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function RidesView() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [statusTab, setStatusTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchRides();
  }, [statusTab, page, debouncedSearch]);

  const fetchRides = async () => {
    try {
      setIsLoading(true);
      const searchParam = debouncedSearch ? `&search=${debouncedSearch}` : '';
      const statusParam = statusTab !== 'all' ? `&status=${statusTab}` : '';
      const data = await apiClient(`/admin/rides?page=${page}&limit=15${statusParam}${searchParam}`);
      setRides(data.rides || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toast('error', 'Failed to load rides', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (['completed', 'payment_completed'].includes(status)) return <Badge variant="success" dot>Completed</Badge>;
    if (['requested', 'rider_search', 'rider_assigned'].includes(status)) return <Badge variant="warning" dot>Matching</Badge>;
    if (['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(status)) return <Badge variant="info" dot>Active</Badge>;
    if (['cancelled', 'expired', 'rider_cancelled', 'passenger_cancelled', 'no_show', 'timed_out'].includes(status)) return <Badge variant="error" dot>Cancelled</Badge>;
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark">Rides Management</h1>
        <p className="text-sm text-woosh-muted mt-0.5">Monitor and manage all platform rides.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
          <Tabs
            tabs={STATUS_TABS}
            activeTab={statusTab}
            onChange={(tab) => { setStatusTab(tab); setPage(1); }}
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRides} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </Button>
            <div className="w-64">
              <Input
                icon={<Search size={16} />}
                placeholder="Search by passenger or rider..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : rides.length === 0 ? (
            <EmptyState title="No rides found" description="Adjust your search or filter." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ride ID & Date</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fare</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.map((ride) => (
                    <TableRow key={ride._id} className="cursor-pointer hover:bg-woosh-surface" onClick={() => navigate(`/rides/${ride._id}`)}>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs font-medium text-woosh-primary bg-woosh-primary-light px-1.5 py-0.5 rounded">
                            {ride._id.slice(-6).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-woosh-muted mt-1.5">
                            <Calendar size={10} />
                            {new Date(ride.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-woosh-dark block">{ride.passenger?.name || 'Unknown'}</span>
                        <span className="text-xs text-woosh-muted">{ride.passenger?.phoneNumber}</span>
                      </TableCell>
                      <TableCell>
                        {ride.rider ? (
                          <>
                            <span className="font-medium text-woosh-dark block">{ride.rider.name}</span>
                            <span className="text-xs text-woosh-muted">{ride.rider.phoneNumber}</span>
                          </>
                        ) : (
                          <span className="text-xs text-woosh-muted italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px] space-y-1">
                          <div className="flex items-start gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                            <span className="text-xs text-woosh-muted truncate block">{ride.pickup?.address || 'Pickup location'}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-sm bg-red-500 mt-1 flex-shrink-0" />
                            <span className="text-xs text-woosh-dark truncate block">{ride.drop?.address || 'Drop location'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ride.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-medium text-woosh-dark">
                          <IndianRupee size={13} />
                          {ride.finalFare || ride.estimatedFare || 0}
                        </div>
                        <span className="text-[10px] text-woosh-muted">{ride.paymentMethod}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-woosh-primary" onClick={(e) => { e.stopPropagation(); navigate(`/rides/${ride._id}`); }}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-woosh-divider">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
