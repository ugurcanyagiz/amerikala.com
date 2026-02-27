import * as React from "react";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "error";
  title?: string;
  description?: string;
  onClose?: () => void;
}

const toastStyles: Record<NonNullable<ToastProps["variant"]>, string> = {
  info: "border-[var(--color-border)] bg-white text-[var(--color-ink)]",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-rose-300 bg-rose-50 text-rose-900",
};

function Toast({ variant = "info", title, description, className = "", onClose, ...props }: ToastProps) {
  return (
    <div
      className={`pointer-events-auto w-full rounded-[var(--radius-xl)] border px-4 py-3 shadow-[var(--shadow-lg)] ${toastStyles[variant]} ${className}`}
      role="status"
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          {description ? <p className="mt-1 text-sm">{description}</p> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-wide opacity-80 transition-opacity hover:opacity-100"
            aria-label="Close toast"
          >
            Kapat
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ToastViewport({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3 ${className}`}
      {...props}
    />
  );
}

export { Toast, ToastViewport };
