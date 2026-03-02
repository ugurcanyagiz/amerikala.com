"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";

export type YardimlasmaSpotlightItem = {
  id: string;
  category: string;
  excerpt: string;
  location: string | null;
  createdAt: string;
  href: string;
};

const ROTATION_INTERVAL_MS = 8_000;
const SWITCH_ANIMATION_MS = 380;

const formatTimeAgo = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60_000));
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} sa önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;
  return date.toLocaleDateString("tr-TR");
};

export default function YardimlasmaSpotlight({ items }: { items: YardimlasmaSpotlightItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (items.length <= 1 || prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setIsSwitching(true);
      window.setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
        setIsSwitching(false);
      }, SWITCH_ANIMATION_MS);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [items.length, prefersReducedMotion]);

  const safeActiveIndex = items.length === 0 ? 0 : activeIndex % items.length;
  const activeItem = items[safeActiveIndex];

  const contentClassName = useMemo(
    () =>
      prefersReducedMotion
        ? "opacity-100 translate-y-0"
        : isSwitching
          ? "opacity-0 translate-y-1"
          : "opacity-100 translate-y-0",
    [isSwitching, prefersReducedMotion],
  );

  if (items.length === 0 || !activeItem) return null;

  return (
    <section className="bg-[var(--color-surface)] pb-6 sm:pb-8">
      <div className="app-page-container py-0">
        <div className="rounded-2xl border border-[rgba(148,163,184,0.28)] bg-white/95 px-4 py-3 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.55)] sm:px-5">
          <div className="flex items-center justify-between gap-2 pb-2">
            <span className="inline-flex min-h-8 items-center rounded-full border border-[rgba(var(--color-primary-rgb),0.22)] bg-[var(--color-primary-subtle)] px-2.5 text-xs font-semibold tracking-wide text-[var(--color-primary-hover)]">
              Yardımlaşma
            </span>
            <Link
              href="/yardimlasma"
              className="inline-flex min-h-8 items-center rounded-full px-2 text-xs font-semibold text-[var(--color-primary-hover)] transition hover:text-[var(--color-primary)]"
            >
              Tümü →
            </Link>
          </div>

          <Link
            href={activeItem.href}
            className="block min-h-11 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <div className={`flex w-full items-center gap-2 overflow-hidden whitespace-nowrap text-sm transition-all duration-300 ease-out sm:text-[15px] ${contentClassName}`}>
              <span className="shrink-0 rounded-md border border-[rgba(148,163,184,0.32)] bg-[#F8FAFC] px-2 py-1 text-xs font-medium text-[var(--color-ink-secondary)]">
                {activeItem.category}
              </span>
              <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{activeItem.excerpt}</span>
              {activeItem.location ? (
                <span className="hidden shrink-0 items-center gap-1 text-xs text-[var(--color-ink-secondary)] sm:inline-flex">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="max-w-[12ch] truncate">{activeItem.location}</span>
                </span>
              ) : null}
              <span className="shrink-0 text-xs text-[var(--color-ink-secondary)]">{formatTimeAgo(activeItem.createdAt)}</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
