'use client';

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}) => {
  const sizes: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      <div
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
          className={`
            relative w-full ${sizes[size]}
            max-h-[90vh] overflow-hidden
            rounded-[28px] border border-[var(--color-border)] bg-white
            shadow-[0_24px_60px_rgba(0,0,0,0.24)]
            animate-scale-in
            flex flex-col
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || description) && (
            <div className="flex items-start justify-between border-b border-[var(--color-border)] px-6 py-5">
              <div className="flex-1 pr-4">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-[var(--color-ink)]"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-[var(--color-ink-secondary)]"
                  >
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="-mr-2 -mt-1 rounded-full"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.displayName = "Modal";

export { Modal };
