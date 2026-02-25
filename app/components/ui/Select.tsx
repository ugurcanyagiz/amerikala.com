import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={`
              flex h-11 w-full rounded-xl
              bg-[var(--color-surface-raised)]
              border border-[var(--color-border)]
              px-3 py-2 text-sm
              pr-10
              transition-smooth
              appearance-none
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
              disabled:cursor-not-allowed disabled:opacity-50
              hover:border-[var(--color-border-strong)]
              ${error ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/20" : ""}
              ${className}
            `}
            ref={ref}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-tertiary)] pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
