import * as React from "react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  rightAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title, rightAction, footer, children }: SheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-neutral-950/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[92vh] animate-[sheet-up_220ms_cubic-bezier(0.16,1,0.3,1)] flex-col overflow-hidden rounded-t-[28px] border border-neutral-200/80 bg-white shadow-[0_-24px_60px_rgba(0,0,0,0.25)] dark:border-neutral-700 dark:bg-neutral-950">
        <div className="sticky top-0 z-10 border-b border-neutral-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h3>
            <div className="flex items-center gap-1">{rightAction}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div className="sticky bottom-0 border-t border-neutral-200/80 bg-white/95 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
