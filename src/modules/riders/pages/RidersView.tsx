import { useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { Tabs } from '../../../common/components/Tabs';
import { AllRidersTab } from '../components/AllRidersTab';
import { PendingKycTab } from '../components/PendingKycTab';

export function RidersView() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Riders', icon: <Users size={18} /> },
    { id: 'pending', label: 'Pending KYC', icon: <AlertCircle size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-woosh-dark">Riders Management</h1>
        <p className="text-sm text-woosh-light mt-1">Manage rider approvals and profiles.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-woosh-divider">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
          className="px-4 pt-4"
        />
        <div className="p-6 bg-gray-50/50">
          {activeTab === 'all' && <AllRidersTab />}
          {activeTab === 'pending' && <PendingKycTab />}
        </div>
      </div>
    </div>
  );
}
