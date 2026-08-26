import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Plus } from 'lucide-react';

export function GatewaysTab() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [provider, setProvider] = useState('');
  const [type, setType] = useState('');
  const [key1, setKey1] = useState('');
  const [val1, setVal1] = useState('');
  const [key2, setKey2] = useState('');
  const [val2, setVal2] = useState('');

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/gateways');
      // If the backend returns { success: true, data: [...] } our apiClient unwraps it
      setGateways(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load gateways');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keys: Record<string, string> = {};
      if (key1 && val1) keys[key1] = val1;
      if (key2 && val2) keys[key2] = val2;

      await apiClient('/admin/gateways', {
        data: {
          provider: provider.toLowerCase(),
          type: type.toLowerCase(),
          keys
        },
        method: 'POST'
      });
      setShowAddForm(false);
      setProvider('');
      setType('');
      setKey1('');
      setVal1('');
      setKey2('');
      setVal2('');
      fetchGateways();
    } catch (err: any) {
      alert(err.message || 'Failed to add gateway');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiClient(`/admin/gateways/${id}/toggle`, { method: 'PUT' });
      fetchGateways();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  if (isLoading && gateways.length === 0) {
    return <div className="p-8 text-center text-woosh-light animate-pulse">Loading gateways...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-woosh-dark">Third-Party Gateways</h2>
          <p className="text-sm text-woosh-light mt-1">Manage API keys for payments, SMS, and other services.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus size={18} /> Add Gateway
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAddGateway} className="bg-white p-5 border border-woosh-divider rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Provider (e.g. razorpay)" value={provider} onChange={e => setProvider(e.target.value)} required />
            <Input label="Type (e.g. payment, sms)" value={type} onChange={e => setType(e.target.value)} required />
            <div className="flex gap-2">
              <Input label="Key Name 1" value={key1} onChange={e => setKey1(e.target.value)} placeholder="e.g. key_id" />
              <Input label="Value 1" value={val1} onChange={e => setVal1(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Input label="Key Name 2" value={key2} onChange={e => setKey2(e.target.value)} placeholder="e.g. key_secret" />
              <Input label="Value 2" value={val2} onChange={e => setVal2(e.target.value)} type="password" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button type="submit">Save Gateway</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-woosh-divider overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Keys Configured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gateways.map((gw) => (
              <TableRow key={gw._id}>
                <TableCell className="font-medium text-woosh-dark capitalize">{gw.provider}</TableCell>
                <TableCell className="capitalize">{gw.type}</TableCell>
                <TableCell>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {Object.keys(gw.keys || {}).join(', ')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    gw.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {gw.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <button 
                    onClick={() => toggleStatus(gw._id)}
                    className="text-sm font-medium text-woosh-primary hover:underline"
                  >
                    {gw.isActive ? 'Disable' : 'Enable'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {gateways.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-woosh-light">No gateways configured.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
