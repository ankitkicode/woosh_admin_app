import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Button } from '../../../common/components/Button';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { Input } from '../../../common/components/Input';
import { apiClient } from '../../../common/utils/apiClient';

export function PassengersView() {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPassengers();
  }, [search]);

  const fetchPassengers = async () => {
    try {
      setIsLoading(true);
      const url = search ? `/admin/users?role=passenger&search=${search}` : '/admin/users?role=passenger';
      const data = await apiClient(url);
      setPassengers(data.users || []);
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
      fetchPassengers();
    } catch (err: any) {
      alert(err.message || `Failed to ${isActive ? 'ban' : 'unban'} passenger`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-woosh-dark">Passengers Management</h1>
          <p className="text-sm text-woosh-light mt-1">View and manage passenger accounts.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle>All Passengers</CardTitle>
          <div className="w-64">
            <Input 
              icon={<Search size={18} />} 
              placeholder="Search by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && passengers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-woosh-light animate-pulse">Loading passengers...</TableCell>
                </TableRow>
              ) : passengers.map((passenger) => (
                <TableRow key={passenger._id}>
                  <TableCell className="font-medium">{passenger.name || 'Unknown'}</TableCell>
                  <TableCell>{passenger.phoneNumber}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      passenger.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {passenger.isActive ? 'Active' : 'Banned'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(passenger.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {passenger.isActive ? (
                      <Button variant="outline" size="sm" onClick={() => toggleBanStatus(passenger._id, true)} className="text-red-600 border-red-200 hover:bg-red-50">
                        <Ban size={14} className="mr-1" /> Ban
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => toggleBanStatus(passenger._id, false)} className="text-green-600 border-green-200 hover:bg-green-50">
                        <CheckCircle size={14} className="mr-1" /> Unban
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && passengers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-woosh-light">No passengers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
