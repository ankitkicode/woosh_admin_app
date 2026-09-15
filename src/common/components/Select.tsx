import React from 'react';
import { cn } from '../utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-woosh-dark">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-woosh-border bg-white px-3.5 py-2 text-sm text-woosh-dark outline-none appearance-none transition-all duration-200",
              "focus:border-woosh-primary focus:ring-2 focus:ring-woosh-primary/10",
              "hover:border-slate-300",
              error && "border-woosh-error focus:border-woosh-error",
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-woosh-placeholder pointer-events-none" />
        </div>
        {error && <p className="text-xs text-woosh-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
