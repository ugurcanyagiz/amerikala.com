import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={`
              h-11 w-full appearance-none rounded-[var(--radius-xl)] border bg-white px-4 pr-10 text-sm text-[var(--color-ink)]
              transition-colors duration-150
              focus:outline-none focus:ring-2
              disabled:cursor-not-allowed disabled:bg-white disabled:text-[var(--color-ink-tertiary)] disabled:opacity-60
              ${
                error
                  ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
              }
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
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-tertiary)]" />
        </div>
        {error && <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
