
import { cn } from '../utils/cn';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-woosh-border p-5 shadow-[var(--shadow-woosh-sm)] hover:shadow-[var(--shadow-woosh-md)] transition-all duration-200",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-woosh-primary-light flex items-center justify-center">
          <Icon size={20} className="text-woosh-primary" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md",
            trend.positive ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
          )}>
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-woosh-muted uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-woosh-dark mt-1">{value}</p>
    </div>
  );
}
