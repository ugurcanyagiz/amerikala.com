"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

type MobileFilterSheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  children: ReactNode;
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
};

export default function MobileFilterSheet({
  open,
  title = "Filters",
  onClose,
  onClear,
  onApply,
  children,
}: MobileFilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";

    const focusables = getFocusableElements(sheetRef.current);
    const firstFocusable = focusables[0];
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const currentFocusable = getFocusableElements(sheetRef.current);
      if (currentFocusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button
        type="button"
        aria-label="Filtre panelini kapat"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] min-h-[65vh] flex-col rounded-t-2xl border-t border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-4 py-3">
          <h2 id={headingId} className="text-base font-semibold text-[var(--color-ink)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label="Filtreleri kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border-light)] px-4 py-3">
          <Button type="button" variant="outline" onClick={onClear}>
            Temizle
          </Button>
          <Button type="button" variant="primary" onClick={onApply}>
            Uygula
          </Button>
        </div>
      </div>
    </div>
  );
}
