import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", size = "md", children, ...props }, ref) => {
    const variants = {
      default: "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50",
      primary: "bg-red-500 text-white",
      success: "bg-green-500 text-white",
      warning: "bg-amber-500 text-white",
      error: "bg-red-500 text-white",
      info: "bg-blue-500 text-white",
      outline: "border-2 border-neutral-200 dark:border-neutral-800 bg-transparent",
    };

    const sizes = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-1",
      lg: "text-base px-3 py-1.5",
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium transition-smooth ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
