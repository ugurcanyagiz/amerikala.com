import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={`
            min-h-[100px] w-full rounded-[var(--radius-xl)] border bg-white px-4 py-3 text-sm text-[var(--color-ink)]
            placeholder:text-[var(--color-ink-tertiary)]
            transition-colors duration-150
            focus:outline-none focus:ring-2
            disabled:cursor-not-allowed disabled:bg-white disabled:text-[var(--color-ink-tertiary)] disabled:opacity-60
            resize-none
            ${
              error
                ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
            }
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
