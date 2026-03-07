import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, hint, icon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-[var(--color-ink)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`
              h-12 w-full rounded-2xl border px-4
              ${icon ? "pl-10" : ""}
              bg-white text-sm text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-tertiary)]
              transition-[border-color,box-shadow] duration-150 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.65)]
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:bg-white disabled:text-[var(--color-ink-tertiary)] disabled:opacity-60
              ${
                error
                  ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
                  : "border-[rgba(148,163,184,0.38)] bg-white hover:border-[rgba(100,116,139,0.52)] focus:border-[#2563EB] focus:ring-[#2563EB]/25"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {(error || hint) && (
          <p
            className={`mt-1.5 text-sm ${
              error ? "text-[var(--color-error)]" : "text-[var(--color-ink-tertiary)]"
            }`}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
