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
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
        active
          ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-900/25 dark:text-orange-200"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
          className="rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Filtreyi kaldır"
        >
          ×
        </span>
      )}
    </button>
  );
}
