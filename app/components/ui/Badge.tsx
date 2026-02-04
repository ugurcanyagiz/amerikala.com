import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", size = "md", children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default: `
        bg-[var(--color-surface-sunken)]
        text-[var(--color-ink-secondary)]
      `,
      primary: `
        bg-[var(--color-primary-subtle)]
        text-[var(--color-primary)]
      `,
      success: `
        bg-[var(--color-success-light)]
        text-[var(--color-success)]
      `,
      warning: `
        bg-[var(--color-warning-light)]
        text-[var(--color-warning)]
      `,
      error: `
        bg-[var(--color-error-light)]
        text-[var(--color-error)]
      `,
      info: `
        bg-[var(--color-info-light)]
        text-[var(--color-info)]
      `,
      outline: `
        bg-transparent
        border border-[var(--color-border)]
        text-[var(--color-ink-secondary)]
      `,
      destructive: `
        bg-[var(--color-error-light)]
        text-[var(--color-error)]
      `,
    };

    const sizes: Record<string, string> = {
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2.5 py-1",
      lg: "text-sm px-3 py-1",
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center
          rounded-full font-medium
          transition-colors duration-150
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
