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
          <label className="block text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-50">
            {label}
          </label>
        )}
        <textarea
          className={`
            flex min-h-[100px] w-full rounded-lg
            bg-white dark:bg-neutral-950
            border border-neutral-200 dark:border-neutral-800
            px-3 py-2 text-sm
            transition-smooth
            placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50
            hover:border-red-500
            resize-none
            ${error ? "border-red-500 focus:ring-red-500" : ""}
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
