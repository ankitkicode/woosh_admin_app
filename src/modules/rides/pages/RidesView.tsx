import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Badge } from '../../../common/components/Badge';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { apiClient } from '../../../common/utils/apiClient';

export function RidesView() {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActiveRides();
  }, []);

  const fetchActiveRides = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/rides/active');
      setRides(data || []);
    } catch (err) {
      console.error('Failed to load rides', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (['completed', 'payment_completed'].includes(status)) return <Badge variant="success" dot>Completed</Badge>;
    if (['requested', 'rider_search', 'rider_assigned'].includes(status)) return <Badge variant="warning" dot>Matching</Badge>;
    if (['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(status)) return <Badge variant="info" dot>Active</Badge>;
    if (['cancelled', 'expired'].includes(status)) return <Badge variant="error" dot>Cancelled</Badge>;
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  const filteredRides = searchQuery
    ? rides.filter(r =>
        r._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.passenger?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rides;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark">Rides Management</h1>
        <p className="text-sm text-woosh-muted mt-0.5">Monitor live and past rides.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
          <CardTitle>Active Rides</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchActiveRides} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <div className="w-52">
              <Input
                icon={<Search size={16} />}
                placeholder="Search rides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : filteredRides.length === 0 ? (
            <EmptyState title="No rides found" description="No active rides at the moment." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ride ID</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Est. Fare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRides.map((ride) => (
                  <TableRow key={ride._id}>
                    <TableCell>
                      <span className="font-mono text-xs font-medium text-woosh-primary bg-woosh-primary-light px-1.5 py-0.5 rounded">
                        {ride._id.slice(-6).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-woosh-dark">{ride.passenger?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-woosh-muted">{ride.rider?.name || 'Unassigned'}</TableCell>
                    <TableCell>{getStatusBadge(ride.status)}</TableCell>
                    <TableCell className="text-right font-medium text-woosh-dark">₹{ride.estimatedFare || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
