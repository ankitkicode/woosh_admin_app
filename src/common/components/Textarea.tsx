import React from 'react';
import { cn } from '../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-woosh-dark">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-woosh-border bg-white px-3.5 py-2 text-sm text-woosh-dark outline-none transition-all duration-200 resize-y min-h-[80px]",
            "placeholder:text-woosh-placeholder",
            "focus:border-woosh-primary focus:ring-2 focus:ring-woosh-primary/10",
            "hover:border-slate-300",
            error && "border-woosh-error focus:border-woosh-error focus:ring-woosh-error/10",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-woosh-error">{error}</p>}
        {hint && !error && <p className="text-xs text-woosh-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
