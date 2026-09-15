import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Avatar } from '../../../common/components/Avatar';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { Input } from '../../../common/components/Input';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

export function PassengersView() {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchPassengers();
  }, [search, page]);

  const fetchPassengers = async () => {
    try {
      setIsLoading(true);
      const url = search
        ? `/admin/users?role=passenger&search=${search}&page=${page}`
        : `/admin/users?role=passenger&page=${page}`;
      const data = await apiClient(url);
      setPassengers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load passengers', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBanStatus = async (id: string, isActive: boolean) => {
    try {
      const action = isActive ? 'ban' : 'unban';
      await apiClient(`/admin/users/${id}/${action}`, { method: 'PUT' });
      toast('success', `Passenger ${isActive ? 'banned' : 'unbanned'} successfully`);
      fetchPassengers();
    } catch (err: any) {
      toast('error', 'Action failed', err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark">Passengers</h1>
        <p className="text-sm text-woosh-muted mt-0.5">View and manage passenger accounts.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
          <CardTitle>All Passengers</CardTitle>
          <div className="w-60">
            <Input
              icon={<Search size={16} />}
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : passengers.length === 0 ? (
            <EmptyState title="No passengers found" description="Try adjusting your search." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passengers.map((passenger) => (
                    <TableRow key={passenger._id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={passenger.name} size="sm" />
                          <span className="font-medium text-woosh-dark">{passenger.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-woosh-muted">{passenger.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge variant={passenger.isActive ? 'success' : 'error'} dot>
                          {passenger.isActive ? 'Active' : 'Banned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-woosh-muted">{new Date(passenger.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {passenger.isActive ? (
                          <Button variant="ghost" size="sm" onClick={() => toggleBanStatus(passenger._id, true)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Ban size={14} /> Ban
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => toggleBanStatus(passenger._id, false)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle size={14} /> Unban
                          </Button>
                        )}
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
