import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
}

const styles: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "border-[var(--color-border)] bg-white text-[var(--color-ink)]",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-rose-300 bg-rose-50 text-rose-900",
};

function Alert({ variant = "info", title, className = "", children, ...props }: AlertProps) {
  return (
    <div className={`rounded-[var(--radius-xl)] border px-4 py-3 ${styles[variant]} ${className}`} role="alert" {...props}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1 text-sm" : "text-sm"}>{children}</div> : null}
    </div>
  );
}

export { Alert };
