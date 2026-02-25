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
              h-11 w-full rounded-xl border px-4
              ${icon ? "pl-10" : ""}
              bg-[var(--color-surface-raised)] text-sm text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-tertiary)]
              transition-colors duration-150
              focus:outline-none focus:ring-2
              disabled:cursor-not-allowed disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-tertiary)]
              ${
                error
                  ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
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
