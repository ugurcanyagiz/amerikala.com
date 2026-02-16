"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
import { searchSiteContent } from "@/lib/siteSearch";

type HomeCategoryKey = "events" | "realEstate" | "jobs" | "marketplace";

type UnifiedAd = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
  createdAt: string;
  popularity: number;
  priceLabel?: string;
  imageUrl?: string | null;
};

type SearchSuggestion = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
};

const SEARCH_TYPE_TO_SECTION: Record<string, HomeCategoryKey> = {
  event: "events",
  realEstate: "realEstate",
  job: "jobs",
  marketplace: "marketplace",
  group: "events",
  profile: "events",
  post: "events",
};

const CATEGORY_CONFIG: Record<
  HomeCategoryKey,
  {
    title: string;
    href: string;
    icon: typeof Building2;
    badgeClass: string;
    cardClass: string;
    iconCircleClass: string;
  }
> = {
  events: {
    title: "Etkinlikler",
    href: "/meetups",
    icon: CalendarDays,
    badgeClass: "bg-sky-100 text-sky-700",
    cardClass: "from-sky-100 via-white to-cyan-50",
    iconCircleClass: "bg-[#7fb24f] text-white",
  },
  realEstate: {
    title: "Emlak",
    href: "/emlak",
    icon: Building2,
    badgeClass: "bg-emerald-100 text-emerald-700",
    cardClass: "from-emerald-100 via-white to-teal-50",
    iconCircleClass: "bg-[#36b0ba] text-white",
  },
  jobs: {
    title: "İş",
    href: "/is",
    icon: BriefcaseBusiness,
    badgeClass: "bg-violet-100 text-violet-700",
    cardClass: "from-violet-100 via-white to-fuchsia-50",
    iconCircleClass: "bg-[#63a0df] text-white",
  },
  marketplace: {
    title: "Alışveriş",
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
  const [latestAdsCategoryFilter, setLatestAdsCategoryFilter] = useState<"all" | HomeCategoryKey>("all");
  const [activeCategoryPreview, setActiveCategoryPreview] = useState<HomeCategoryKey>("events");
  const [categoryPreviewItems, setCategoryPreviewItems] = useState<Record<HomeCategoryKey, UnifiedAd[]>>({
    events: [],
    realEstate: [],
    jobs: [],
    marketplace: [],
  });

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
            .select("id, title, city, state, current_attendees, created_at, cover_image_url")
            .eq("status", "approved")
            .order("current_attendees", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("listings")
            .select("id, title, city, state, price, view_count, created_at, images")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("job_listings")
            .select("id, title, city, state, salary_min, salary_max, view_count, created_at")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("marketplace_listings")
            .select("id, title, city, state, price, view_count, created_at, images")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
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
            href: `/meetups/${item.id}`,
            section: "events" as const,
            createdAt: item.created_at,
            popularity: item.current_attendees ?? 0,
            priceLabel: "Ücretsiz / biletli",
            imageUrl: item.cover_image_url,
          })),
          ...(realEstateRes.data ?? []).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          })),
          ...(jobsRes.data ?? []).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatSalaryRange(item.salary_min, item.salary_max),
          })),
          ...(marketplaceRes.data ?? []).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          })),
        ]
          .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, latestLimit);

        const previewItems: Record<HomeCategoryKey, UnifiedAd[]> = {
          events: (eventsRes.data ?? []).slice(0, 9).map((item) => ({
            id: `event-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/meetups/${item.id}`,
            section: "events" as const,
            createdAt: item.created_at,
            popularity: item.current_attendees ?? 0,
            priceLabel: "Ücretsiz / biletli",
            imageUrl: item.cover_image_url,
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
          realEstate: (realEstateRes.data ?? []).slice(0, 9).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
          jobs: (jobsRes.data ?? []).slice(0, 9).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatSalaryRange(item.salary_min, item.salary_max),
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
          marketplace: (marketplaceRes.data ?? []).slice(0, 9).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
        };

        setAds(unified);
        setCategoryPreviewItems(previewItems);
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
        const merged: SearchSuggestion[] = (await searchSiteContent(normalizedQuery, 6)).map((item) => ({
          id: item.id,
          title: item.title,
          location: item.subtitle,
          href: item.href,
          section: SEARCH_TYPE_TO_SECTION[item.type] || "events",
        })).slice(0, 8);

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
    router.push(`/search?q=${q}`);
    setSearchOpen(false);
  };

  const featuredAds = useMemo(() => ads.slice(0, 4), [ads]);
  const latestAds = useMemo(() => ads.slice(0, latestAdsTargetCount), [ads, latestAdsTargetCount]);
  const latestFilteredAds = useMemo(
    () => (latestAdsCategoryFilter === "all" ? latestAds : latestAds.filter((item) => item.section === latestAdsCategoryFilter)),
    [latestAds, latestAdsCategoryFilter],
  );

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
                    AMERIKALA
                  </span>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    İlan ver, paylaş, haberdar ol. Tamamen ücretsiz!
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                    Amerika&apos;nın ilk ve tek tamamen ücretsiz Türkçe paylaşım ve topluluk platformu.
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
                    <Link href="/login">
                      <Button
                        variant="primary"
                        size="lg"
                        className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 font-semibold shadow-[0_12px_26px_-16px_rgba(37,99,235,0.8)]"
                      >
                        Hemen İlan Ver
                      </Button>
                    </Link>
                    <Link href="#son-ilanlar">
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
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_22px_45px_-40px_rgba(15,23,42,0.85)] sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => {
                  const config = CATEGORY_CONFIG[key];
                  const Icon = config.icon;
                  const isActive = activeCategoryPreview === key;

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setActiveCategoryPreview(key)}
                      onMouseEnter={() => setActiveCategoryPreview(key)}
                      onFocus={() => setActiveCategoryPreview(key)}
                      className={`group rounded-2xl border px-3 py-4 text-center transition-all sm:px-4 sm:py-5 ${
                        isActive
                          ? "border-sky-200 bg-sky-50 shadow-[0_22px_36px_-30px_rgba(14,116,144,0.7)]"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-30px_rgba(14,116,144,0.45)]"
                      }`}
                    >
                      <span className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full ${config.iconCircleClass} sm:h-14 sm:w-14`}>
                        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-slate-900 sm:text-lg">{config.title}</h3>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{CATEGORY_CONFIG[activeCategoryPreview].title} - Popüler Gönderiler</h3>
                  <Link
                    href={CATEGORY_CONFIG[activeCategoryPreview].href}
                    className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-800"
                  >
                    Tümü
                  </Link>
                </div>

                {categoryPreviewItems[activeCategoryPreview].length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                    Bu kategori için henüz gönderi bulunmuyor.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryPreviewItems[activeCategoryPreview].map((item) => (
                      <Link
                        key={`preview-${item.id}`}
                        href={item.href}
                        className={`relative overflow-hidden rounded-xl border border-slate-200 transition hover:border-sky-200 hover:shadow-sm ${
                          item.imageUrl ? "bg-slate-900" : "bg-white"
                        }`}
                      >
                        {item.imageUrl && (
                          <>
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${item.imageUrl})` }}
                              aria-hidden="true"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/55 to-slate-900/20" aria-hidden="true" />
                          </>
                        )}
                        <div className={`relative z-10 flex h-28 flex-col justify-end p-3 ${item.imageUrl ? "text-white" : "text-slate-900"}`}>
                          <h4 className="line-clamp-2 text-sm font-semibold">{item.title}</h4>
                          <p className={`mt-1 text-xs ${item.imageUrl ? "text-white/85" : "text-slate-500"}`}>{item.location}</p>
                          <p className={`mt-1 text-xs font-medium ${item.imageUrl ? "text-white" : "text-slate-600"}`}>{item.priceLabel ?? "Detaylı bilgi"}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <AdsSection title="Öne Çıkan İlanlar" items={featuredAds} loading={loading} />

          <section id="son-ilanlar" className="bg-white py-14 scroll-mt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Son İlanlar</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CategoryFilterButton
                      isActive={latestAdsCategoryFilter === "all"}
                      onClick={() => setLatestAdsCategoryFilter("all")}
                    >
                      Tüm kategoriler
                    </CategoryFilterButton>
                    {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => (
                      <CategoryFilterButton key={key} isActive={latestAdsCategoryFilter === key} onClick={() => setLatestAdsCategoryFilter(key)}>
                        {CATEGORY_CONFIG[key].title}
                      </CategoryFilterButton>
                    ))}
                  </div>
                </div>
              </div>
              <AdsGrid items={latestFilteredAds} loading={loading} latestMobileGrid />
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
  subtitle?: string;
  items: UnifiedAd[];
  loading: boolean;
}) {
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
        <AdsGrid items={items} loading={loading} />
      </div>
    </section>
  );
}

function CategoryFilterButton({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        isActive ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
      }`}
    >
      {children}
    </button>
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
            {item.imageUrl ? (
              <div className="h-28 bg-slate-100">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={`h-28 bg-gradient-to-r ${meta.cardClass} p-4`}>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
              </div>
            )}
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
