import React from 'react';
import { cn } from '../utils/cn';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, suffix, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-woosh-dark">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-woosh-placeholder">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-woosh-border bg-white px-3.5 py-2 text-sm text-woosh-dark outline-none transition-all duration-200",
              "placeholder:text-woosh-placeholder",
              "focus:border-woosh-primary focus:ring-2 focus:ring-woosh-primary/10",
              "hover:border-slate-300",
              icon && "pl-10",
              suffix && "pr-10",
              error && "border-woosh-error focus:border-woosh-error focus:ring-woosh-error/10",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-woosh-placeholder">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-woosh-error text-xs">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <p className="text-xs text-woosh-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
