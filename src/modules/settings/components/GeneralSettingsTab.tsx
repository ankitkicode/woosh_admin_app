import { useState, useEffect } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { useToast } from '../../../common/components/Toast';
import { Skeleton } from '../../../common/components/Skeleton';
import { Save } from 'lucide-react';

export function GeneralSettingsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
      toast('error', 'Failed to load settings', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await apiClient('/admin/settings', {
        method: 'PUT',
        data: {
          platformCommissionRate: Number(platformCommissionRate),
          taxRate: Number(taxRate),
          maxSurgeLimit: Number(maxSurgeLimit),
          defaultCurrency,
        },
      });
      toast('success', 'Settings saved successfully');
    } catch (err: any) {
      toast('error', 'Failed to save settings', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-base font-semibold text-woosh-dark">General Settings</h2>
        <p className="text-sm text-woosh-muted mt-0.5">Configure global platform parameters.</p>
      </div>

      <div className="space-y-4 bg-woosh-surface/50 p-5 border border-woosh-divider rounded-lg">
        <h3 className="text-sm font-semibold text-woosh-dark border-b border-woosh-divider pb-2">Financials & Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Commission Rate (%)"
            type="number"
            step="0.1"
            value={platformCommissionRate}
            onChange={(e) => setPlatformCommissionRate(e.target.value)}
            hint="Platform commission per ride"
            required
          />
          <Input
            label="Tax Rate (GST %)"
            type="number"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            hint="Applied on all transactions"
            required
          />
          <Input
            label="Max Surge Multiplier"
            type="number"
            step="0.1"
            value={maxSurgeLimit}
            onChange={(e) => setMaxSurgeLimit(e.target.value)}
            hint="Maximum allowed surge (e.g. 3.0 = 3x)"
            required
          />
          <Input
            label="Default Currency"
            type="text"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            hint="ISO currency code"
            required
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" isLoading={isSaving}>
          <Save size={16} /> Save Changes
        </Button>
      </div>
    </form>
  );
}
