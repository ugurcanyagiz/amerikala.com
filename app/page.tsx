"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { publicSupabase } from "@/lib/supabase/publicClient";

type HomeCategoryKey = "events" | "realEstate" | "jobs" | "marketplace";

type UnifiedAd = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
  createdAt: string;
  priceLabel?: string;
};

type SearchSuggestion = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
};

const CATEGORY_CONFIG: Record<
  HomeCategoryKey,
  {
    title: string;
    subtitle: string;
    href: string;
    icon: typeof Building2;
    badgeClass: string;
    cardClass: string;
    iconCircleClass: string;
  }
> = {
  events: {
    title: "Etkinlikler",
    subtitle: "Topluluğa katıl",
    href: "/events",
    icon: CalendarDays,
    badgeClass: "bg-sky-100 text-sky-700",
    cardClass: "from-sky-100 via-white to-cyan-50",
    iconCircleClass: "bg-[#7fb24f] text-white",
  },
  realEstate: {
    title: "Emlak",
    subtitle: "Yeni yaşam alanı",
    href: "/emlak",
    icon: Building2,
    badgeClass: "bg-emerald-100 text-emerald-700",
    cardClass: "from-emerald-100 via-white to-teal-50",
    iconCircleClass: "bg-[#36b0ba] text-white",
  },
  jobs: {
    title: "İş",
    subtitle: "Kariyer fırsatları",
    href: "/is",
    icon: BriefcaseBusiness,
    badgeClass: "bg-violet-100 text-violet-700",
    cardClass: "from-violet-100 via-white to-fuchsia-50",
    iconCircleClass: "bg-[#63a0df] text-white",
  },
  marketplace: {
    title: "Alışveriş",
    subtitle: "Al - sat ilanları",
    href: "/alisveris",
    icon: ShoppingBag,
    badgeClass: "bg-amber-100 text-amber-700",
    cardClass: "from-amber-100 via-white to-orange-50",
    iconCircleClass: "bg-[#57c0cf] text-white",
  },
};

export default function Home() {
  const INITIAL_LATEST_ROWS = 20;
  const LATEST_ROWS_PER_LOAD = 10;
  const MAX_LATEST_ROWS = 50;
  const MAX_LOAD_REPETITIONS = 5;
  const LATEST_COLUMNS = 2;

  const INITIAL_LATEST_ITEMS = INITIAL_LATEST_ROWS * LATEST_COLUMNS;
  const LATEST_ITEMS_PER_LOAD = LATEST_ROWS_PER_LOAD * LATEST_COLUMNS;
  const MAX_LATEST_ITEMS = MAX_LATEST_ROWS * LATEST_COLUMNS;

  const router = useRouter();
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const latestAdsLoadTriggerRef = useRef<HTMLDivElement>(null);

  const [ads, setAds] = useState<UnifiedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreLatestAds, setLoadingMoreLatestAds] = useState(false);
  const [latestAdsLoadRepetition, setLatestAdsLoadRepetition] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const latestAdsTargetCount = useMemo(
    () => Math.min(MAX_LATEST_ITEMS, INITIAL_LATEST_ITEMS + latestAdsLoadRepetition * LATEST_ITEMS_PER_LOAD),
    [INITIAL_LATEST_ITEMS, LATEST_ITEMS_PER_LOAD, MAX_LATEST_ITEMS, latestAdsLoadRepetition],
  );
  const hasMoreLatestAds = latestAdsTargetCount < MAX_LATEST_ITEMS && latestAdsLoadRepetition < MAX_LOAD_REPETITIONS;

  const fetchHomepageData = useCallback(
    async (latestLimit: number) => {
      setLoading(latestLimit === INITIAL_LATEST_ITEMS);
      setLoadingMoreLatestAds(latestLimit > INITIAL_LATEST_ITEMS);
      try {
        const [eventsRes, realEstateRes, jobsRes, marketplaceRes] = await Promise.all([
          publicSupabase
            .from("events")
            .select("id, title, city, state, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("listings")
            .select("id, title, city, state, price, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("job_listings")
            .select("id, title, city, state, salary_min, salary_max, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("marketplace_listings")
            .select("id, title, city, state, price, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(latestLimit),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (realEstateRes.error) throw realEstateRes.error;
        if (jobsRes.error) throw jobsRes.error;
        if (marketplaceRes.error) throw marketplaceRes.error;

        const unified: UnifiedAd[] = [
          ...(eventsRes.data ?? []).map((item) => ({
            id: `event-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/events/${item.id}`,
            section: "events" as const,
            createdAt: item.created_at,
            priceLabel: "Ücretsiz / biletli",
          })),
          ...(realEstateRes.data ?? []).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
            createdAt: item.created_at,
            priceLabel: formatCurrency(item.price),
          })),
          ...(jobsRes.data ?? []).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
            createdAt: item.created_at,
            priceLabel: formatSalaryRange(item.salary_min, item.salary_max),
          })),
          ...(marketplaceRes.data ?? []).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
            createdAt: item.created_at,
            priceLabel: formatCurrency(item.price),
          })),
        ]
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, latestLimit);

        setAds(unified);
      } catch (error) {
        console.error("Homepage fetch error", error);
      } finally {
        setLoading(false);
        setLoadingMoreLatestAds(false);
      }
    },
    [INITIAL_LATEST_ITEMS],
  );

  useEffect(() => {
    fetchHomepageData(latestAdsTargetCount);
  }, [fetchHomepageData, latestAdsTargetCount]);

  useEffect(() => {
    const node = latestAdsLoadTriggerRef.current;
    if (!node || loading || loadingMoreLatestAds || !hasMoreLatestAds) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setLoadingMoreLatestAds(true);
          setLatestAdsLoadRepetition((prev) => (prev < MAX_LOAD_REPETITIONS ? prev + 1 : prev));
        }
      },
      { rootMargin: "250px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreLatestAds, loading, loadingMoreLatestAds, MAX_LOAD_REPETITIONS]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const debounce = window.setTimeout(async () => {
      setSearching(true);
      try {
        const keyword = `%${normalizedQuery}%`;

        const [eventsRes, listingsRes, jobsRes, marketplaceRes] = await Promise.all([
          publicSupabase
            .from("events")
            .select("id, title, city, state")
            .eq("status", "approved")
            .ilike("title", keyword)
            .limit(5),
          publicSupabase
            .from("listings")
            .select("id, title, city, state")
            .eq("status", "approved")
            .or(`title.ilike.${keyword},description.ilike.${keyword}`)
            .limit(5),
          publicSupabase
            .from("job_listings")
            .select("id, title, city, state")
            .eq("status", "approved")
            .or(`title.ilike.${keyword},description.ilike.${keyword}`)
            .limit(5),
          publicSupabase
            .from("marketplace_listings")
            .select("id, title, city, state")
            .eq("status", "approved")
            .or(`title.ilike.${keyword},description.ilike.${keyword}`)
            .limit(5),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (listingsRes.error) throw listingsRes.error;
        if (jobsRes.error) throw jobsRes.error;
        if (marketplaceRes.error) throw marketplaceRes.error;

        const merged: SearchSuggestion[] = [
          ...(eventsRes.data ?? []).map((item) => ({
            id: `event-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/events/${item.id}`,
            section: "events" as const,
          })),
          ...(listingsRes.data ?? []).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
          })),
          ...(jobsRes.data ?? []).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
          })),
          ...(marketplaceRes.data ?? []).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
          })),
        ].slice(0, 8);

        setSuggestions(merged);
        setSearchOpen(true);
        setActiveSuggestionIndex(-1);
      } catch (error) {
        console.error("Search suggestions error", error);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(debounce);
  }, [searchQuery]);

  const onSearchSubmit = () => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) return;

    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      router.push(suggestions[activeSuggestionIndex].href);
      setSearchOpen(false);
      return;
    }

    if (suggestions[0]) {
      router.push(suggestions[0].href);
      setSearchOpen(false);
      return;
    }

    const q = encodeURIComponent(normalizedQuery);
    router.push(`/feed?search=${q}`);
    setSearchOpen(false);
  };

  const featuredAds = useMemo(() => ads.slice(0, 4), [ads]);
  const latestAds = useMemo(() => ads.slice(0, latestAdsTargetCount), [ads, latestAdsTargetCount]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7fbff]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <section className="relative overflow-hidden border-b border-sky-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#d8ecff_0%,#f7fbff_45%,#ffffff_100%)]" />
            <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-12 lg:py-16">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Amerikala Classifieds
                  </span>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    İlan ver, paylaş ve topluluk içinde hızlıca görünür ol.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                    Daha canlı, daha modern ve ilan odaklı yeni anasayfa düzeni: kategoriler, öne çıkan ilanlar ve en yeni içerikler tek bakışta.
                  </p>

                  <div ref={searchBoxRef} className="relative mt-7 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-30px_rgba(14,116,144,0.65)]">
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          value={searchQuery}
                          onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setSearchOpen(true);
                          }}
                          onFocus={() => setSearchOpen(true)}
                          onKeyDown={(event) => {
                            if (!suggestions.length) {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                onSearchSubmit();
                              }
                              return;
                            }

                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                            }

                            if (event.key === "ArrowUp") {
                              event.preventDefault();
                              setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                            }

                            if (event.key === "Enter") {
                              event.preventDefault();
                              onSearchSubmit();
                            }
                          }}
                          className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                          placeholder="Ne arıyorsun? (ör: kiralık ev, iş, etkinlik)"
                          aria-label="Site içi arama"
                        />
                      </div>

                      <Button variant="primary" className="h-11 rounded-xl px-6" onClick={onSearchSubmit}>
                        {searching ? "Aranıyor..." : "Ara"}
                      </Button>
                    </div>

                    {searchOpen && searchQuery.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_18px_40px_-30px_rgba(14,116,144,0.65)]">
                        {searching ? (
                          <p className="px-4 py-3 text-sm text-slate-500">Uygun ilanlar aranıyor...</p>
                        ) : suggestions.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-500">Sonuç bulunamadı. Farklı bir arama deneyin.</p>
                        ) : (
                          <ul className="max-h-80 overflow-y-auto py-1">
                            {suggestions.map((item, index) => {
                              const meta = CATEGORY_CONFIG[item.section];
                              const isActive = index === activeSuggestionIndex;

                              return (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      router.push(item.href);
                                      setSearchOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                                      isActive ? "bg-sky-50" : "hover:bg-sky-50/70"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                                      <p className="truncate text-xs text-slate-500">{item.location}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>{meta.title}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/register">
                      <Button
                        variant="primary"
                        size="lg"
                        className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 font-semibold shadow-[0_12px_26px_-16px_rgba(37,99,235,0.8)]"
                      >
                        Hemen İlan Ver
                      </Button>
                    </Link>
                    <Link href="/feed">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-xl border-slate-200 bg-white px-7 font-medium text-slate-700 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.45)] hover:border-slate-300"
                      >
                        Paylaşımları Gör
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Image
                    src="/amerikala.png"
                    alt="Amerikala classified hero"
                    width={760}
                    height={520}
                    priority
                    className="h-auto w-full max-w-[760px] object-contain"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900">Kategoriler</h2>
              <p className="text-sm text-slate-500">Mevcut içerik yapınız korunur.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => {
                const config = CATEGORY_CONFIG[key];
                const Icon = config.icon;
                return (
                  <Link
                    key={key}
                    href={config.href}
                    className="group rounded-lg border border-slate-200 bg-white px-2 py-3 text-center shadow-[0_10px_18px_-18px_rgba(15,23,42,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-30px_rgba(14,116,144,0.45)] sm:rounded-2xl sm:px-4 sm:py-5"
                  >
                    <span className={`mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full ${config.iconCircleClass} sm:h-14 sm:w-14`}>
                      <Icon className="h-4 w-4 sm:h-7 sm:w-7" />
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 sm:mt-4 sm:text-lg">{config.title}</h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-sm">{config.subtitle}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 transition group-hover:text-sky-700 sm:mt-3 sm:text-sm">
                      Kategoriye git
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <AdsSection title="Öne Çıkan İlanlar" subtitle="Classified Ads düzenine uygun premium kartlar" items={featuredAds} loading={loading} />

          <section className="bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Son İlanlar</h2>
                  <p className="text-slate-500">Emlak, iş, alışveriş ve etkinlik kategorilerinden en güncel liste.</p>
                </div>
              </div>
              <AdsGrid items={latestAds} loading={loading} latestMobileGrid />
              <div ref={latestAdsLoadTriggerRef} className="h-2" aria-hidden="true" />
              {loadingMoreLatestAds && <p className="mt-4 text-center text-sm text-slate-500">Daha fazla ilan yükleniyor...</p>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function AdsSection({
  title,
  subtitle,
  items,
  loading,
}: {
  title: string;
  subtitle: string;
  items: UnifiedAd[];
  loading: boolean;
}) {
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-slate-500">{subtitle}</p>
        </div>
        <AdsGrid items={items} loading={loading} />
      </div>
    </section>
  );
}

function AdsGrid({ items, loading, latestMobileGrid = false }: { items: UnifiedAd[]; loading: boolean; latestMobileGrid?: boolean }) {
  const gridClassName = latestMobileGrid ? "grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Henüz listelenecek ilan bulunamadı.</p>;
  }

  return (
    <div className={gridClassName}>
      {items.map((item) => {
        const meta = CATEGORY_CONFIG[item.section];
        return (
          <Link
            key={item.id}
            href={item.href}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`h-28 bg-gradient-to-r ${meta.cardClass} p-4`}>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
            </div>
            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 min-h-[3rem] text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {item.location}
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">{item.priceLabel ?? "Detaylı bilgi"}</span>
                <span className="text-xs text-slate-500">İlana git</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function formatCurrency(value?: number | null) {
  if (!value) return "Fiyat bilgisi yok";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSalaryRange(min?: number | null, max?: number | null) {
  if (!min && !max) return "Maaş belirtilmemiş";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  return `En fazla $${max?.toLocaleString()}`;
}
