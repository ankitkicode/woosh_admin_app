import { useState } from 'react';
import { Settings, CreditCard } from 'lucide-react';
import { Tabs } from '../../../common/components/Tabs';
import { GeneralSettingsTab } from '../components/GeneralSettingsTab';
import { GatewaysTab } from '../components/GatewaysTab';

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: <Settings size={16} /> },
  { id: 'gateways', label: 'Gateways', icon: <CreditCard size={16} /> },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'general': return <GeneralSettingsTab />;
      case 'gateways': return <GatewaysTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark">Settings</h1>
        <p className="text-sm text-woosh-muted mt-0.5">Manage system configurations, pricing, and gateways.</p>
      </div>

      <div className="bg-white rounded-xl border border-woosh-border shadow-[var(--shadow-woosh-sm)] overflow-hidden">
        <Tabs
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="px-5 pt-3"
        />
        <div className="p-5">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
