import { useState } from 'react';
import { Settings, Map as MapIcon, CreditCard, Box } from 'lucide-react';
import { Tabs } from '../../../common/components/Tabs';
import { GeneralSettingsTab } from '../components/GeneralSettingsTab';
import { PricingRulesTab } from '../components/PricingRulesTab';
import { GatewaysTab } from '../components/GatewaysTab';
import { CitiesTab } from '../components/CitiesTab';

const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: <Settings size={18} /> },
  { id: 'cities', label: 'Cities & Regions', icon: <MapIcon size={18} /> },
  { id: 'pricing', label: 'Pricing Rules', icon: <Box size={18} /> },
  { id: 'gateways', label: 'Gateways', icon: <CreditCard size={18} /> },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'general': return <GeneralSettingsTab />;
      case 'cities': return <CitiesTab />;
      case 'pricing': return <PricingRulesTab />;
      case 'gateways': return <GatewaysTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-woosh-dark">Settings</h1>
        <p className="text-sm text-woosh-light mt-1">Manage system configurations, pricing, and gateways.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-woosh-divider overflow-hidden">
        <Tabs
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="px-4 pt-4 bg-gray-50/50"
        />
        <div className="p-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
