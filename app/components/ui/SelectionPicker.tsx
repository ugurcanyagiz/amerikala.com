"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { Button } from "./Button";

export interface SelectionOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectionPickerProps {
  label: string;
  required?: boolean;
  options: SelectionOption[];
  value: string | string[];
  onChange: (nextValue: string | string[]) => void;
  error?: string;
  multiple?: boolean;
  mobileTitle?: string;
  mobileDescription?: string;
  desktopColumnsClass?: string;
  mobileGridColumnsClass?: string;
}

const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
};

export function SelectionPicker({
  label,
  required,
  options,
  value,
  onChange,
  error,
  multiple = false,
  mobileTitle,
  mobileDescription,
  desktopColumnsClass = "grid-cols-2 sm:grid-cols-4",
  mobileGridColumnsClass = "grid-cols-1",
}: SelectionPickerProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement>(null);

  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value]
  );

  const isSelected = useCallback((optionValue: string) => selectedValues.includes(optionValue), [selectedValues]);

  const applySelection = useCallback((optionValue: string) => {
    if (!multiple) {
      onChange(optionValue);
      setIsMobileOpen(false);
      return;
    }

    const nextValues = isSelected(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];
    onChange(nextValues);
  }, [isSelected, multiple, onChange, selectedValues]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusables = getFocusableElements(modalRef.current);
    focusables[0]?.focus();

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % options.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        if (document.activeElement?.getAttribute("data-option") === "true") {
          event.preventDefault();
          const optionValue = document.activeElement?.getAttribute("data-value");
          if (optionValue) {
            applySelection(optionValue);
          }
        }
        return;
      }

      if (event.key !== "Tab") return;

      const allFocusable = getFocusableElements(modalRef.current);
      if (!allFocusable.length) return;

      const first = allFocusable[0];
      const last = allFocusable[allFocusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyboard);

    return () => {
      document.removeEventListener("keydown", handleKeyboard);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [applySelection, isMobileOpen, options.length]);


  const openMobilePicker = () => {
    const selectedIndex = options.findIndex((option) => isSelected(option.value));
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsMobileOpen(true);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        className={`sm:hidden w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between ${
          error ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
        } bg-white dark:bg-neutral-900`}
        onClick={openMobilePicker}
        aria-haspopup="dialog"
        aria-expanded={isMobileOpen}
      >
        <span className="text-sm text-neutral-700 dark:text-neutral-200">
          {selectedValues.length ? `${selectedValues.length} seçenek seçildi` : "Seçim yap"}
        </span>
        <ChevronRight size={16} className="text-neutral-500" />
      </button>

      {!!selectedValues.length && (
        <div className="sm:hidden mt-2 flex flex-wrap gap-2">
          {selectedValues.map((selectedValue) => {
            const option = options.find((item) => item.value === selectedValue);
            if (!option) return null;
            return (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              >
                {option.icon} {option.label}
              </span>
            );
          })}
        </div>
      )}

      <div className={`hidden sm:grid ${desktopColumnsClass} gap-3`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => applySelection(option.value)}
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              isSelected(option.value)
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
            }`}
          >
            {option.icon && <span className="text-xl">{option.icon}</span>}
            <p className="text-sm font-medium mt-1">{option.label}</p>
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {isMobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50" role="presentation">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} aria-hidden="true" />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
            aria-describedby={mobileDescription ? descriptionId : undefined}
            className="absolute inset-0 bg-white dark:bg-neutral-950 flex flex-col"
          >
            <div className="px-4 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 id={dialogId} className="text-lg font-semibold">
                  {mobileTitle ?? label}
                </h3>
                {mobileDescription && (
                  <p id={descriptionId} className="text-sm text-neutral-500 mt-1">
                    {mobileDescription}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} aria-label="Seçim ekranını kapat">
                <X size={18} />
              </Button>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 grid ${mobileGridColumnsClass} gap-2 content-start`}>
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  data-option="true"
                  data-value={option.value}
                  onClick={() => applySelection(option.value)}
                  onFocus={() => setActiveIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    isSelected(option.value)
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-neutral-200 dark:border-neutral-700"
                  } ${activeIndex === index ? "ring-2 ring-emerald-400" : ""}`}
                >
                  {option.icon && <span>{option.icon}</span>}
                  <span className="font-medium">{option.label}</span>
                  {isSelected(option.value) && <Check size={16} className="ml-auto text-emerald-500" />}
                </button>
              ))}
            </div>

            {multiple && (
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button className="w-full" onClick={() => setIsMobileOpen(false)}>
                  Seçimi Tamamla
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
