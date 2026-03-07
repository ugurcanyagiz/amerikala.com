'use client';

import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within <Tabs />");
  }
  return context;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, defaultValue = "", onValueChange, className = "", children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value]
  );

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({ value, className = "", children, ...props }: TabsTriggerProps) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={`inline-flex h-9 items-center justify-center rounded-[calc(var(--radius-xl)-4px)] px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20 ${
        isActive
          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]"
          : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
      } ${className}`}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ value, className = "", children, ...props }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return (
    <div role="tabpanel" className={className} {...props}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
