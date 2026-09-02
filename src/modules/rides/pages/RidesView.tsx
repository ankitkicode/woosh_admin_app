import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Search } from 'lucide-react';
import { Input } from '../../../common/components/Input';
import { apiClient } from '../../../common/utils/apiClient';

export function RidesView() {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-woosh-dark">Rides Management</h1>
          <p className="text-sm text-woosh-light mt-1">Monitor live and past rides.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle>Active Rides</CardTitle>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchActiveRides} 
              disabled={isLoading}
              className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="w-64">
              <Input icon={<Search size={18} />} placeholder="Search by ID..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {isLoading && rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-woosh-light animate-pulse">Loading rides...</TableCell>
                </TableRow>
              ) : rides.map((ride) => {
                let badgeColor = 'bg-gray-100 text-gray-800';
                if (ride.status === 'completed' || ride.status === 'payment_completed') badgeColor = 'bg-green-100 text-green-800';
                else if (['requested', 'rider_search', 'rider_assigned'].includes(ride.status)) badgeColor = 'bg-yellow-100 text-yellow-800';
                else if (['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(ride.status)) badgeColor = 'bg-blue-100 text-blue-800';
                else badgeColor = 'bg-red-100 text-red-800';

                return (
                  <TableRow key={ride._id}>
                    <TableCell className="font-medium text-woosh-primary">
                      {ride._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>{ride.passenger?.name || 'Unknown'}</TableCell>
                    <TableCell>{ride.rider?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                        {ride.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{ride.estimatedFare || 0}</TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && rides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-woosh-light">No active rides found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
