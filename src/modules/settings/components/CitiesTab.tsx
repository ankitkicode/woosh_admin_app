import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Plus } from 'lucide-react';

export function CitiesTab() {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New city form
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [stateName, setStateName] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [perMinuteRate, setPerMinuteRate] = useState('');

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/cities');
      setCities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/admin/cities', {
        data: {
          name,
          state: stateName,
          country: 'India',
          baseFare: Number(baseFare),
          perKmRate: Number(perKmRate),
          perMinuteRate: Number(perMinuteRate)
        }
      });
      setShowAddForm(false);
      setName('');
      setStateName('');
      setBaseFare('');
      setPerKmRate('');
      setPerMinuteRate('');
      fetchCities();
    } catch (err: any) {
      alert(err.message || 'Failed to add city');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiClient(`/admin/cities/${id}/toggle`, { method: 'PUT' });
      fetchCities();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  if (isLoading && cities.length === 0) {
    return <div className="p-8 text-center text-woosh-light animate-pulse">Loading cities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-woosh-dark">Operational Cities</h2>
          <p className="text-sm text-woosh-light mt-1">Manage cities where the service is active.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus size={18} /> Add City
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAddCity} className="bg-white p-5 border border-woosh-divider rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="City Name" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="State" value={stateName} onChange={e => setStateName(e.target.value)} required />
            <Input label="Base Fare (₹)" type="number" value={baseFare} onChange={e => setBaseFare(e.target.value)} required />
            <Input label="Per Km Rate (₹)" type="number" value={perKmRate} onChange={e => setPerKmRate(e.target.value)} required />
            <Input label="Per Minute Rate (₹)" type="number" value={perMinuteRate} onChange={e => setPerMinuteRate(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button type="submit">Save City</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-woosh-divider overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Base Fare</TableHead>
              <TableHead>Per Km</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.map((city) => (
              <TableRow key={city._id}>
                <TableCell className="font-medium text-woosh-dark">{city.name}</TableCell>
                <TableCell>{city.state}</TableCell>
                <TableCell>₹{city.baseFare}</TableCell>
                <TableCell>₹{city.perKmRate}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    city.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {city.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <button 
                    onClick={() => toggleStatus(city._id)}
                    className="text-sm font-medium text-woosh-primary hover:underline"
                  >
                    {city.isActive ? 'Disable' : 'Enable'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {cities.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-woosh-light">No cities found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
