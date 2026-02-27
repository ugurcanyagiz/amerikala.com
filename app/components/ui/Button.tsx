import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold tracking-tight
      rounded-[var(--radius-xl)]
      transition-all duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/25 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
      active:translate-y-px
    `;

    const variants: Record<ButtonProps["variant"], string> = {
      primary: `
        bg-[var(--color-primary)] text-white
        hover:bg-[var(--color-primary-hover)]
        shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
      `,
      secondary: `
        border border-[var(--color-border)] bg-white text-[var(--color-ink)]
        shadow-[var(--shadow-xs)]
        hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)] hover:shadow-[var(--shadow-sm)]
      `,
      ghost: `
        bg-transparent text-[var(--color-ink-secondary)]
        hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] hover:-translate-y-0.5
      `,
      link: `
        h-auto rounded-none bg-transparent px-0 py-0 text-[var(--color-primary)] shadow-none
        underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline
      `,
    };

    const sizes: Record<string, string> = {
      sm: "h-9 px-4 text-sm",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    const sizeClass = variant === "link" ? "text-sm" : sizes[size];

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
