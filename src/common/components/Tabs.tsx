import React from 'react';
import { cn } from '../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 border-b border-woosh-divider", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px",
            activeTab === tab.id
              ? "border-woosh-primary text-woosh-primary"
              : "border-transparent text-woosh-muted hover:text-woosh-text hover:border-slate-300"
          )}
        >
          {tab.icon && (
            <span className={cn(
              "transition-colors",
              activeTab === tab.id ? "text-woosh-primary" : "text-woosh-placeholder"
            )}>
              {tab.icon}
            </span>
          )}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full",
              activeTab === tab.id
                ? "bg-woosh-primary-light text-woosh-primary"
                : "bg-woosh-surface text-woosh-muted"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
