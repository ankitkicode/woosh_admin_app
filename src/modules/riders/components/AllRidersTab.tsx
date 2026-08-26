import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Button } from '../../../common/components/Button';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { Input } from '../../../common/components/Input';

export function AllRidersTab() {
  const [riders, setRiders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRiders();
  }, [search]);

  const fetchRiders = async () => {
    try {
      setIsLoading(true);
      const url = search ? `/admin/users?role=rider&search=${search}` : '/admin/users?role=rider';
      const data = await apiClient(url);
      setRiders(data.users || []);
    } catch (err) {
      console.error('Failed to load riders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBanStatus = async (id: string, isActive: boolean) => {
    try {
      const action = isActive ? 'ban' : 'unban';
      await apiClient(`/admin/users/${id}/${action}`, { method: 'PUT' });
      fetchRiders(); // Refresh list
    } catch (err: any) {
      alert(err.message || `Failed to ${isActive ? 'ban' : 'unban'} rider`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-64">
          <Input 
            icon={<Search size={18} />} 
            placeholder="Search by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-woosh-divider overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && riders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-woosh-light animate-pulse">Loading riders...</TableCell>
              </TableRow>
            ) : riders.map((rider) => (
              <TableRow key={rider._id}>
                <TableCell className="font-medium text-woosh-dark">{rider.name || 'Unknown'}</TableCell>
                <TableCell>{rider.phoneNumber}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {rider.isActive ? 'Active' : 'Banned'}
                  </span>
                </TableCell>
                <TableCell>{new Date(rider.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {rider.isActive ? (
                    <Button variant="outline" size="sm" onClick={() => toggleBanStatus(rider._id, true)} className="text-red-600 border-red-200 hover:bg-red-50">
                      <Ban size={14} className="mr-1" /> Ban
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => toggleBanStatus(rider._id, false)} className="text-green-600 border-green-200 hover:bg-green-50">
                      <CheckCircle size={14} className="mr-1" /> Unban
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && riders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-woosh-light">No riders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
