import * as React from "react";

type PageHeroProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: React.ReactNode;
};

function PageHero({
  title,
  description,
  actions,
  stats,
  className = "",
  innerClassName = "",
  titleClassName = "",
  descriptionClassName = "",
  children,
}: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white ${className}`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
      </div>

      <div className={`relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-14 ${innerClassName}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold leading-tight md:text-4xl ${titleClassName}`}>{title}</h1>
            {description ? (
              <p className={`mt-2 text-base text-white/85 md:text-lg ${descriptionClassName}`}>{description}</p>
            ) : null}
          </div>
          {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
        </div>

        {children}
        {stats ? <div className="mt-8">{stats}</div> : null}
      </div>
    </section>
  );
}

type StickyFilterBarProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
};

function StickyFilterBar({ children, className = "", innerClassName = "" }: StickyFilterBarProps) {
  return (
    <section
      className={`sticky top-16 z-40 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/92 shadow-sm backdrop-blur-lg ${className}`}
    >
      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 ${innerClassName}`}>{children}</div>
    </section>
  );
}

type ResponsiveCardGridProps = {
  children: React.ReactNode;
  className?: string;
  cols?: "compact" | "default" | "wide";
};

const GRID_MAP = {
  compact: "grid grid-cols-2 md:grid-cols-4 gap-4",
  default: "grid md:grid-cols-2 lg:grid-cols-3 gap-5",
  wide: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5",
} as const;

function ResponsiveCardGrid({ children, className = "", cols = "default" }: ResponsiveCardGridProps) {
  return <div className={`${GRID_MAP[cols]} ${className}`}>{children}</div>;
}

export { PageHero, StickyFilterBar, ResponsiveCardGrid };
