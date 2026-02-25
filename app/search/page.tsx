"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ArrowUpRight } from "lucide-react";
import AppShell from "../components/AppShell";
import { searchSiteContent, type SiteSearchResult } from "@/lib/siteSearch";

const TYPE_LABELS: Record<SiteSearchResult["type"], string> = {
  event: "Etkinlik",
  realEstate: "Emlak",
  job: "İş",
  marketplace: "Alışveriş",
  group: "Grup",
  profile: "Profil",
  post: "Feed",
};

type SearchFilter = "all" | SiteSearchResult["type"];

const FILTER_OPTIONS: { value: SearchFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "event", label: "Etkinlik" },
  { value: "realEstate", label: "Emlak" },
  { value: "job", label: "İş" },
  { value: "marketplace", label: "Alışveriş" },
  { value: "group", label: "Grup" },
  { value: "profile", label: "Profil" },
  { value: "post", label: "Feed" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") || "";

  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<SiteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");

  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchSiteContent(normalized, 8);
        setResults(response);
      } catch (error) {
        console.error("Global search failed", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredResults = useMemo(() => {
    if (activeFilter === "all") return results;
    return results.filter((item) => item.type === activeFilter);
  }, [activeFilter, results]);

  const groupedResults = useMemo(() => {
    return filteredResults.reduce<Record<string, SiteSearchResult[]>>((acc, item) => {
      const key = TYPE_LABELS[item.type];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredResults]);

  return (
    <AppShell mainClassName="app-page-container max-w-5xl">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)]">Arama Yap</h1>

            <div className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-tertiary)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const q = encodeURIComponent(query.trim());
                      router.replace(`/search?q=${q}`);
                    }
                  }}
                  placeholder="Örn: New York, yazılım, kiralık..."
                  className="w-full h-11 rounded-xl border border-[var(--color-border)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <button
                type="button"
                onClick={() => router.replace(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="h-11 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                Ara
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeFilter === filter.value
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border-light)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {loading ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center text-[var(--color-ink-secondary)]">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Arama yapılıyor...
              </div>
            ) : query.trim().length < 2 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white p-8 text-center text-[var(--color-ink-secondary)]">
                En az 2 karakter girin.
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-white p-8 text-center text-[var(--color-ink-secondary)]">
                Seçili filtrede sonuç bulunamadı.
              </div>
            ) : (
              Object.entries(groupedResults).map(([group, items]) => (
                <section key={group} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <h2 className="text-sm font-semibold text-[var(--color-ink-secondary)] mb-3">{group}</h2>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border-light)] px-3 py-2.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-primary-subtle)] transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs text-[var(--color-ink-secondary)] truncate">{item.subtitle || "Detaylar için tıklayın"}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[var(--color-ink-tertiary)]" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </AppShell>
  );
}
