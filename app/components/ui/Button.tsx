import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 
      rounded-lg font-medium transition-smooth
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 
      disabled:pointer-events-none disabled:opacity-50
      active:scale-95
    `;

    const variants = {
      default: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg",
      primary: "gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105",
      secondary: "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700",
      outline: "border-2 border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:border-red-500",
      ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-50",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
