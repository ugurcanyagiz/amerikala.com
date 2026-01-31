import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-50">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={`
              flex h-11 w-full rounded-lg
              bg-white dark:bg-neutral-950
              border border-neutral-200 dark:border-neutral-800
              px-3 py-2 text-sm
              ${icon ? "pl-10" : ""}
              transition-smooth
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
              disabled:cursor-not-allowed disabled:opacity-50
              hover:border-red-500
              ${error ? "border-red-500 focus:ring-red-500" : ""}
              ${className}
            `}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
