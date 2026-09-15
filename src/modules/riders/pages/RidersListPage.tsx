import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRiders, type RiderListResponse } from '../api/ridersApi';
import { Search, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { Avatar } from '../../../common/components/Avatar';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Select } from '../../../common/components/Select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';

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

  const getStatusBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'approved': return <Badge variant="success" dot>Approved</Badge>;
      case 'under_review': return <Badge variant="warning" dot>Under Review</Badge>;
      case 'rejected': return <Badge variant="error" dot>Rejected</Badge>;
      default: return <Badge variant="neutral" dot>Pending</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark">Rider Management</h1>
        <p className="text-sm text-woosh-muted mt-0.5">View and manage all riders on the platform</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={16} />}
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'under_review', label: 'Under Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
              <Button type="submit" variant="secondary" size="md">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="py-3.5">
          <CardTitle>All Riders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : error ? (
            <EmptyState title="Error loading riders" description={error} />
          ) : !data?.riders.length ? (
            <EmptyState title="No riders found" description="Try adjusting your filters." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.riders.map((rider) => (
                    <TableRow key={rider._id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={rider.user?.name} size="sm" />
                          <div>
                            <p className="font-medium text-woosh-dark">{rider.user?.name || 'Incomplete'}</p>
                            {rider.canAcceptChildRides && (
                              <p className="text-xs text-emerald-600">Child Safe ✓</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-woosh-muted">{rider.user?.phoneNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-woosh-dark text-sm">{rider.vehicleNumber}</p>
                          <p className="text-xs text-woosh-muted">{rider.vehicleModel}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(rider.kycStatus)}</TableCell>
                      <TableCell className="text-woosh-muted text-sm">
                        {new Date(rider.user?.createdAt || rider.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/riders/${rider._id}`)}
                          className="text-woosh-primary hover:bg-woosh-primary-light"
                        >
                          <Eye size={14} /> Review
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
