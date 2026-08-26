import React from 'react';
import { cn } from '../utils/cn';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, suffix, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-woosh-dark ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-woosh-light">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl bg-woosh-input-bg border-none px-4 py-3.5 text-woosh-dark outline-none transition-all focus:ring-2 focus:ring-woosh-primary/30 focus:bg-white placeholder:text-woosh-light",
              icon && "pl-11",
              suffix && "pr-11",
              error && "ring-2 ring-woosh-error/50 focus:ring-woosh-error/50 bg-red-50",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-woosh-light">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-woosh-error text-xs ml-1 mt-0.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
