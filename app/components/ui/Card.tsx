import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", padding = "md", children, ...props }, ref) => {
    const variants: Record<string, string> = {
      default: `
        bg-[var(--color-surface)]
        border border-[var(--color-border)]
        shadow-[var(--shadow-sm)]
      `,
      elevated: `
        bg-[var(--color-surface)]
        border border-[var(--color-border-light)]
        shadow-[var(--shadow-md)]
      `,
      interactive: `
        bg-[var(--color-surface)]
        border border-[var(--color-border)]
        shadow-[var(--shadow-sm)]
        hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
        hover:border-[var(--color-border-strong)]
        transition-all duration-200 ease-out
        cursor-pointer
      `,
      glass: `
        bg-[var(--color-surface-raised)]/90
        backdrop-blur-md
        border border-[var(--color-border-light)]
        shadow-[var(--shadow-sm)]
      `,
    };

    const paddings: Record<string, string> = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius-2xl)] ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 mb-6 ${className}`}
      {...props}
    />
  )
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-xl font-semibold tracking-tight text-[var(--color-ink)] ${className}`}
      {...props}
    />
  )
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-[var(--color-ink-secondary)] ${className}`}
      {...props}
    />
  )
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center pt-6 mt-6 border-t border-[var(--color-border-light)] ${className}`}
      {...props}
    />
  )
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
