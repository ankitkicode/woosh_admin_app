import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Edit2, Save, X } from 'lucide-react';

export function PricingRulesTab() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/superadmin/cities');
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rule: any) => {
    setEditingCity(rule.city);
    setEditForm({
      baseFare: rule.baseFare,
      costPerKm: rule.costPerKm,
      costPerMinute: rule.costPerMinute,
      minFare: rule.minFare,
      surgeMultiplier: rule.surgeMultiplier,
      isSurgeActive: rule.isSurgeActive
    });
  };

  const handleSave = async (city: string) => {
    try {
      await apiClient(`/superadmin/pricing/${city}`, {
        data: {
          baseFare: Number(editForm.baseFare),
          costPerKm: Number(editForm.costPerKm),
          costPerMinute: Number(editForm.costPerMinute),
          minFare: Number(editForm.minFare),
          surgeMultiplier: Number(editForm.surgeMultiplier),
          isSurgeActive: editForm.isSurgeActive
        },
        method: 'PUT'
      });
      setEditingCity(null);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to update pricing');
    }
  };

  if (isLoading && rules.length === 0) {
    return <div className="p-8 text-center text-woosh-light animate-pulse">Loading pricing rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-woosh-dark">Pricing Rules</h2>
        <p className="text-sm text-woosh-light mt-1">Manage base fares, distance rates, and surge pricing for each city.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}

      <div className="bg-white rounded-xl border border-woosh-divider overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead>Base Fare</TableHead>
              <TableHead>Cost/Km</TableHead>
              <TableHead>Cost/Min</TableHead>
              <TableHead>Surge</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => {
              const isEditing = editingCity === rule.city;
              return (
                <TableRow key={rule._id}>
                  <TableCell className="font-medium text-woosh-dark capitalize">{rule.city}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input type="number" value={editForm.baseFare} onChange={e => setEditForm({...editForm, baseFare: e.target.value})} className="w-24 py-1.5 px-2" />
                    ) : (
                      `₹${rule.baseFare}`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input type="number" value={editForm.costPerKm} onChange={e => setEditForm({...editForm, costPerKm: e.target.value})} className="w-24 py-1.5 px-2" />
                    ) : (
                      `₹${rule.costPerKm}`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input type="number" value={editForm.costPerMinute} onChange={e => setEditForm({...editForm, costPerMinute: e.target.value})} className="w-24 py-1.5 px-2" />
                    ) : (
                      `₹${rule.costPerMinute}`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.1" value={editForm.surgeMultiplier} onChange={e => setEditForm({...editForm, surgeMultiplier: e.target.value})} className="w-20 py-1.5 px-2" />
                        <input type="checkbox" checked={editForm.isSurgeActive} onChange={e => setEditForm({...editForm, isSurgeActive: e.target.checked})} className="rounded text-woosh-primary" />
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rule.isSurgeActive ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isSurgeActive ? `${rule.surgeMultiplier}x` : 'Off'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSave(rule.city)} className="p-1.5 bg-woosh-primary text-white rounded-lg hover:bg-woosh-primary/90">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditingCity(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(rule)} className="p-1.5 text-woosh-primary hover:bg-woosh-light-pink rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rules.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-woosh-light">No pricing rules found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
