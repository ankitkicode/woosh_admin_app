import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { useToast } from '../../../common/components/Toast';
import { Plus } from 'lucide-react';
import { Modal } from '../../../common/components/Modal';

export function GatewaysTab() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
      setGateways(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      toast('error', 'Failed to load gateways', err.message);
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
        data: { provider: provider.toLowerCase(), type: type.toLowerCase(), keys },
        method: 'POST'
      });
      setShowAddForm(false);
      resetForm();
      fetchGateways();
      toast('success', 'Gateway added successfully');
    } catch (err: any) {
      toast('error', 'Failed to add gateway', err.message);
    }
  };

  const resetForm = () => {
    setProvider(''); setType(''); setKey1(''); setVal1(''); setKey2(''); setVal2('');
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiClient(`/admin/gateways/${id}/toggle`, { method: 'PUT' });
      fetchGateways();
      toast('success', 'Gateway status updated');
    } catch (err: any) {
      toast('error', 'Failed to toggle status', err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-woosh-dark">Third-Party Gateways</h2>
          <p className="text-sm text-woosh-muted mt-0.5">Manage API keys for payments, SMS, and other services.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus size={14} /> Add Gateway
        </Button>
      </div>

      {/* Add Gateway Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => { setShowAddForm(false); resetForm(); }}
        title="Add New Gateway"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); resetForm(); }}>Cancel</Button>
            <Button size="sm" onClick={handleAddGateway}>Save Gateway</Button>
          </>
        }
      >
        <form onSubmit={handleAddGateway} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Provider" value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. razorpay" required />
            <Input label="Type" value={type} onChange={e => setType(e.target.value)} placeholder="e.g. payment, sms" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Key Name 1" value={key1} onChange={e => setKey1(e.target.value)} placeholder="e.g. key_id" />
            <Input label="Value 1" value={val1} onChange={e => setVal1(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Key Name 2" value={key2} onChange={e => setKey2(e.target.value)} placeholder="e.g. key_secret" />
            <Input label="Value 2" value={val2} onChange={e => setVal2(e.target.value)} type="password" />
          </div>
        </form>
      </Modal>

      {/* Table */}
      <div className="bg-white rounded-lg border border-woosh-divider overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : gateways.length === 0 ? (
          <EmptyState title="No gateways configured" description="Add a payment or SMS gateway to get started." actionLabel="Add Gateway" onAction={() => setShowAddForm(true)} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Keys</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways.map((gw) => (
                <TableRow key={gw._id}>
                  <TableCell className="font-medium text-woosh-dark capitalize">{gw.provider}</TableCell>
                  <TableCell className="capitalize text-woosh-muted">{gw.type}</TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-woosh-surface text-woosh-muted px-2 py-1 rounded">
                      {Object.keys(gw.keys || {}).join(', ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={gw.isActive ? 'success' : 'error'} dot>
                      {gw.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(gw._id)}>
                      {gw.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
