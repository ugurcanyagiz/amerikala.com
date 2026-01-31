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
          <label className="block text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-50">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={`
              flex h-11 w-full rounded-lg
              bg-white dark:bg-neutral-950
              border border-neutral-200 dark:border-neutral-800
              px-3 py-2 text-sm
              pr-10
              transition-smooth
              appearance-none
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
              disabled:cursor-not-allowed disabled:opacity-50
              hover:border-red-500
              ${error ? "border-red-500 focus:ring-red-500" : ""}
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
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
