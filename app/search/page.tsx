"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ArrowUpRight } from "lucide-react";
import Sidebar from "../components/Sidebar";
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") || "";

  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<SiteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

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

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, SiteSearchResult[]>>((acc, item) => {
      const key = TYPE_LABELS[item.type];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [results]);

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sitede Ara</h1>
            <p className="mt-1 text-sm text-slate-500">İlanlar, etkinlikler, gruplar, profiller ve feed gönderileri arasında arama yapın.</p>

            <div className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                  className="w-full h-11 rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <button
                type="button"
                onClick={() => router.replace(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Ara
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Arama yapılıyor...
              </div>
            ) : query.trim().length < 2 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                En az 2 karakter girin.
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                Sonuç bulunamadı.
              </div>
            ) : (
              Object.entries(groupedResults).map(([group, items]) => (
                <section key={group} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">{group}</h2>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-sky-200 hover:bg-sky-50 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 truncate">{item.subtitle || "Detaylar için tıklayın"}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
