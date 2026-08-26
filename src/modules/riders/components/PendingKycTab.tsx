import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Button } from '../../../common/components/Button';
import { Check, X } from 'lucide-react';

export function PendingKycTab() {
  const [riders, setRiders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingRiders();
  }, []);

  const fetchPendingRiders = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/riders/pending');
      setRiders(data.riders || []);
    } catch (err) {
      console.error('Failed to load pending riders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient(`/admin/riders/${id}/approve`, { method: 'PUT' });
      fetchPendingRiders();
    } catch (err: any) {
      alert(err.message || 'Failed to approve rider');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;
    try {
      await apiClient(`/admin/riders/${id}/reject`, { 
        method: 'PUT',
        data: { reason }
      });
      fetchPendingRiders();
    } catch (err: any) {
      alert(err.message || 'Failed to reject rider');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-woosh-divider overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rider Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Vehicle Info</TableHead>
            <TableHead>Submitted On</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && riders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-woosh-light animate-pulse">Loading pending KYC...</TableCell>
            </TableRow>
          ) : riders.map((profile) => (
            <TableRow key={profile._id}>
              <TableCell className="font-medium text-woosh-dark">{profile.user?.name || 'Unknown'}</TableCell>
              <TableCell>{profile.user?.phoneNumber}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{profile.vehicleType?.toUpperCase() || 'N/A'}</p>
                  <p className="text-xs text-woosh-light">{profile.vehicleNumber || 'N/A'}</p>
                </div>
              </TableCell>
              <TableCell>{new Date(profile.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => handleApprove(profile._id)} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                    <Check size={14} className="mr-1" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleReject(profile._id)} className="text-red-600 border-red-200 hover:bg-red-50">
                    <X size={14} className="mr-1" /> Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && riders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-woosh-light">No pending KYC applications.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
