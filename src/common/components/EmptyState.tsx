import { Inbox } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-12 h-12 rounded-xl bg-woosh-surface flex items-center justify-center text-woosh-placeholder mb-4">
        {icon || <Inbox size={24} />}
      </div>
      <h3 className="text-sm font-semibold text-woosh-dark mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-woosh-muted text-center max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
