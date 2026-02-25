import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold tracking-tight
      rounded-xl
      transition-all duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:translate-y-px
    `;

    const variants: Record<string, string> = {
      primary: `
        bg-brand-red text-white
        hover:bg-brand-red/90 active:bg-brand-red
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-brand-pine text-white
        hover:bg-brand-pine/90 active:bg-brand-pine
        shadow-sm hover:shadow-md
      `,
      ghost: `
        bg-transparent text-gray-600
        hover:bg-brand-cream/60 hover:text-black
      `,
      outline: `
        bg-white text-black
        border border-brand-earth/40
        hover:bg-brand-cream/60 hover:border-brand-earth
      `,
      destructive: `
        bg-[var(--color-error)] text-white
        hover:bg-[var(--color-error)]/90
        shadow-[var(--shadow-sm)]
      `,
    };

    const sizes: Record<string, string> = {
      sm: "h-9 px-4 text-sm",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
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
