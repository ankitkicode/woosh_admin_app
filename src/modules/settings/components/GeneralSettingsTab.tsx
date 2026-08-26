import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Save } from 'lucide-react';

export function GeneralSettingsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states matching SystemConfig model
  const [platformCommissionRate, setPlatformCommissionRate] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [maxSurgeLimit, setMaxSurgeLimit] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/settings');
      setPlatformCommissionRate(data.platformCommissionRate?.toString() || '20');
      setTaxRate(data.taxRate?.toString() || '5');
      setMaxSurgeLimit(data.maxSurgeLimit?.toString() || '3');
      setDefaultCurrency(data.defaultCurrency || 'INR');
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      await apiClient('/admin/settings', {
        method: 'PUT',
        data: {
          platformCommissionRate: Number(platformCommissionRate),
          taxRate: Number(taxRate),
          maxSurgeLimit: Number(maxSurgeLimit),
          defaultCurrency,
        },
      });
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-woosh-light animate-pulse">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-medium text-woosh-dark">General Settings</h2>
        <p className="text-sm text-woosh-light mt-1">Configure global platform parameters.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-200">{success}</div>}

      <div className="space-y-4 bg-white p-5 border border-woosh-divider rounded-xl">
        <h3 className="text-sm font-semibold text-woosh-dark border-b border-woosh-divider pb-2">Financials & Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Platform Commission Rate (%)"
            type="number"
            step="0.1"
            value={platformCommissionRate}
            onChange={(e) => setPlatformCommissionRate(e.target.value)}
            placeholder="e.g. 20"
            required
          />
          <Input
            label="Tax Rate (GST %)"
            type="number"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="e.g. 5"
            required
          />
          <Input
            label="Max Surge Multiplier"
            type="number"
            step="0.1"
            value={maxSurgeLimit}
            onChange={(e) => setMaxSurgeLimit(e.target.value)}
            placeholder="e.g. 3.0"
            required
          />
          <Input
            label="Default Currency"
            type="text"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            placeholder="INR"
            required
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" isLoading={isSaving} className="gap-2">
          <Save size={18} /> Save Changes
        </Button>
      </div>
    </form>
  );
}
