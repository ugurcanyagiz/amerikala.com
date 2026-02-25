import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <textarea
          className={`
            flex min-h-[100px] w-full rounded-xl
            bg-[var(--color-surface-raised)]
            border border-[var(--color-border)]
            px-3 py-2 text-sm
            transition-smooth
            placeholder:text-[var(--color-ink-tertiary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]
            disabled:cursor-not-allowed disabled:opacity-50
            hover:border-[var(--color-border-strong)]
            resize-none
            ${error ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/20" : ""}
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
