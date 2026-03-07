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
        bg-white
        border border-[rgba(148,163,184,0.24)]
        shadow-[0_16px_36px_-30px_rgba(15,23,42,0.5)]
      `,
      elevated: `
        bg-white
        border border-[rgba(148,163,184,0.2)]
        shadow-[0_24px_48px_-34px_rgba(15,23,42,0.55)]
      `,
      interactive: `
        bg-white
        border border-[rgba(148,163,184,0.25)]
        shadow-[0_16px_36px_-30px_rgba(15,23,42,0.5)]
        hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-30px_rgba(15,23,42,0.55)]
        hover:border-[rgba(100,116,139,0.38)]
        transition-all duration-200 ease-out
        cursor-pointer
      `,
      glass: `
        bg-white/92
        backdrop-blur-md
        border border-[rgba(255,255,255,0.45)]
        shadow-[0_24px_46px_-30px_rgba(15,23,42,0.55)]
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
