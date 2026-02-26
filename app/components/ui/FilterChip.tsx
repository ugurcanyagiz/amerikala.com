import * as React from "react";

interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FilterChip({ active = false, onClick, onRemove, children, className = "" }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-2 active:translate-y-px ${
        active
          ? "border-[var(--color-primary-300)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-hover)] hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
      } ${className}`}
    >
      <span>{children}</span>
      {onRemove && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full p-0.5 hover:bg-[rgba(var(--color-trust-rgb),0.05)] dark:hover:bg-white/10"
          aria-label="Filtreyi kaldır"
        >
          ×
        </span>
      )}
    </button>
  );
}
