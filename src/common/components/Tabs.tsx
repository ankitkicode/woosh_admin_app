import React from 'react';
import { cn } from '../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex space-x-1 border-b border-woosh-divider", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2",
            activeTab === tab.id
              ? "border-woosh-primary text-woosh-primary bg-woosh-light-pink/50 rounded-t-lg"
              : "border-transparent text-woosh-light hover:text-woosh-dark hover:border-gray-300"
          )}
        >
          {tab.icon && (
            <span className={cn(activeTab === tab.id ? "text-woosh-primary" : "text-woosh-light")}>
              {tab.icon}
            </span>
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
